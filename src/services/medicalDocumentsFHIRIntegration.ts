import { supabase } from '../lib/supabase';
import { medicalDocumentsService, PatientMedicalDocument, DocumentExtraction } from './medicalDocumentsService';

interface FHIRObservation {
  resourceType: 'Observation';
  id: string;
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  subject: {
    reference: string;
  };
  effectiveDateTime: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  valueString?: string;
  interpretation?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
}

interface FHIRMedicationRequest {
  resourceType: 'MedicationRequest';
  id: string;
  status: 'active' | 'completed' | 'cancelled';
  intent: 'proposal' | 'plan' | 'order';
  medicationCodeableConcept: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  subject: {
    reference: string;
  };
  authoredOn: string;
  dosageInstruction?: Array<{
    text: string;
    timing?: {
      repeat: {
        frequency: number;
        period: number;
        periodUnit: string;
      };
    };
  }>;
}

interface FHIRDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id: string;
  status: 'registered' | 'partial' | 'preliminary' | 'final';
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  subject: {
    reference: string;
  };
  effectiveDateTime: string;
  result?: Array<{
    reference: string;
  }>;
  conclusion?: string;
}

class MedicalDocumentsFHIRIntegration {
  async createObservationFromLabResult(
    document: PatientMedicalDocument,
    extraction: DocumentExtraction
  ): Promise<string | null> {
    try {
      if (extraction.extraction_type !== 'lab_values') {
        return null;
      }

      const labData = extraction.extracted_data as any;

      if (!labData.results || !Array.isArray(labData.results)) {
        return null;
      }

      for (const result of labData.results) {
        const observation: Partial<FHIRObservation> = {
          resourceType: 'Observation',
          status: 'final',
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: this.getLoincCode(result.test_name),
                display: result.test_name,
              },
            ],
            text: result.test_name,
          },
          subject: {
            reference: `Patient/${document.patient_id}`,
          },
          effectiveDateTime: document.document_date || new Date().toISOString(),
          valueQuantity: {
            value: parseFloat(result.value),
            unit: result.unit,
            system: 'http://unitsofmeasure.org',
            code: result.unit,
          },
        };

        if (result.status) {
          observation.interpretation = [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                  code: this.getInterpretationCode(result.status),
                  display: result.status,
                },
              ],
            },
          ];
        }

        const { data, error } = await supabase
          .from('fhir_observations')
          .insert({
            patient_id: document.patient_id,
            resource_data: observation,
            source_document_id: document.id,
            observation_date: observation.effectiveDateTime,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating FHIR observation:', error);
          continue;
        }

        await medicalDocumentsService.updateDocument(document.id, {
          fhir_resource_type: 'Observation',
          fhir_resource_id: data.id,
        });
      }

      return 'success';
    } catch (error) {
      console.error('Error in createObservationFromLabResult:', error);
      return null;
    }
  }

  async createDiagnosticReportFromDocument(
    document: PatientMedicalDocument,
    extraction: DocumentExtraction
  ): Promise<string | null> {
    try {
      const diagnosticReport: Partial<FHIRDiagnosticReport> = {
        resourceType: 'DiagnosticReport',
        status: 'final',
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '11502-2',
              display: 'Laboratory report',
            },
          ],
          text: document.title,
        },
        subject: {
          reference: `Patient/${document.patient_id}`,
        },
        effectiveDateTime: document.document_date || new Date().toISOString(),
        conclusion: document.description,
      };

      const { data, error } = await supabase
        .from('fhir_diagnostic_reports')
        .insert({
          patient_id: document.patient_id,
          resource_data: diagnosticReport,
          source_document_id: document.id,
          report_date: diagnosticReport.effectiveDateTime,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating FHIR diagnostic report:', error);
        return null;
      }

      await medicalDocumentsService.updateDocument(document.id, {
        fhir_resource_type: 'DiagnosticReport',
        fhir_resource_id: data.id,
      });

      return data.id;
    } catch (error) {
      console.error('Error in createDiagnosticReportFromDocument:', error);
      return null;
    }
  }

  async createMedicationRequestFromPrescription(
    document: PatientMedicalDocument,
    extraction: DocumentExtraction
  ): Promise<string | null> {
    try {
      if (extraction.extraction_type !== 'medications') {
        return null;
      }

      const medicationData = extraction.extracted_data as any;

      if (!medicationData.medications || !Array.isArray(medicationData.medications)) {
        return null;
      }

      for (const medication of medicationData.medications) {
        const medicationRequest: Partial<FHIRMedicationRequest> = {
          resourceType: 'MedicationRequest',
          status: 'active',
          intent: 'order',
          medicationCodeableConcept: {
            coding: [
              {
                system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                code: medication.rxnorm_code || 'unknown',
                display: medication.name,
              },
            ],
            text: medication.name,
          },
          subject: {
            reference: `Patient/${document.patient_id}`,
          },
          authoredOn: document.document_date || new Date().toISOString(),
        };

        if (medication.dosage) {
          medicationRequest.dosageInstruction = [
            {
              text: medication.dosage,
            },
          ];
        }

        const { data, error } = await supabase
          .from('fhir_medication_requests')
          .insert({
            patient_id: document.patient_id,
            resource_data: medicationRequest,
            source_document_id: document.id,
            request_date: medicationRequest.authoredOn,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating FHIR medication request:', error);
          continue;
        }

        await medicalDocumentsService.updateDocument(document.id, {
          fhir_resource_type: 'MedicationRequest',
          fhir_resource_id: data.id,
        });
      }

      return 'success';
    } catch (error) {
      console.error('Error in createMedicationRequestFromPrescription:', error);
      return null;
    }
  }

  async syncDocumentToFHIR(
    documentId: string
  ): Promise<{ success: boolean; fhirResourceType?: string; fhirResourceId?: string }> {
    try {
      const document = await medicalDocumentsService.getDocumentById(documentId);

      if (!document) {
        return { success: false };
      }

      const extractions = await medicalDocumentsService.getDocumentExtractions(documentId);

      if (extractions.length === 0) {
        return { success: false };
      }

      for (const extraction of extractions) {
        switch (extraction.extraction_type) {
          case 'lab_values':
            await this.createObservationFromLabResult(document, extraction);
            await this.createDiagnosticReportFromDocument(document, extraction);
            break;

          case 'medications':
            await this.createMedicationRequestFromPrescription(document, extraction);
            break;

          default:
            console.log(`No FHIR mapping for extraction type: ${extraction.extraction_type}`);
        }
      }

      return {
        success: true,
        fhirResourceType: document.fhir_resource_type || undefined,
        fhirResourceId: document.fhir_resource_id || undefined,
      };
    } catch (error) {
      console.error('Error syncing document to FHIR:', error);
      return { success: false };
    }
  }

  async getPatientFHIRResources(patientId: string): Promise<{
    observations: any[];
    diagnosticReports: any[];
    medicationRequests: any[];
  }> {
    try {
      const [observations, diagnosticReports, medicationRequests] = await Promise.all([
        supabase.from('fhir_observations').select('*').eq('patient_id', patientId),
        supabase.from('fhir_diagnostic_reports').select('*').eq('patient_id', patientId),
        supabase.from('fhir_medication_requests').select('*').eq('patient_id', patientId),
      ]);

      return {
        observations: observations.data || [],
        diagnosticReports: diagnosticReports.data || [],
        medicationRequests: medicationRequests.data || [],
      };
    } catch (error) {
      console.error('Error fetching patient FHIR resources:', error);
      return {
        observations: [],
        diagnosticReports: [],
        medicationRequests: [],
      };
    }
  }

  private getLoincCode(testName: string): string {
    const loincCodes: Record<string, string> = {
      'Hemoglobin': '718-7',
      'Glucose': '2339-0',
      'White Blood Cell Count': '6690-2',
      'Platelet Count': '777-3',
      'Cholesterol': '2093-3',
      'Triglycerides': '2571-8',
      'HDL Cholesterol': '2085-9',
      'LDL Cholesterol': '13457-7',
      'Creatinine': '2160-0',
      'Blood Urea Nitrogen': '3094-0',
      'Sodium': '2951-2',
      'Potassium': '2823-3',
      'Calcium': '17861-6',
    };

    return loincCodes[testName] || 'unknown';
  }

  private getInterpretationCode(status: string): string {
    const interpretationCodes: Record<string, string> = {
      'normal': 'N',
      'high': 'H',
      'low': 'L',
      'critical': 'HH',
    };

    return interpretationCodes[status.toLowerCase()] || 'N';
  }
}

export const medicalDocumentsFHIRIntegration = new MedicalDocumentsFHIRIntegration();
