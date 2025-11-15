import { FHIRResource, fhirRDFService } from './fhirRDFService';

export interface WorkflowStep {
  id: string;
  type: 'assessment' | 'diagnosis' | 'treatment' | 'followup' | 'referral';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  dependencies: string[];
  resources: string[];
  metadata?: Record<string, unknown>;
}

export interface GeneratedWorkflow {
  id: string;
  patientId: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  estimatedDuration?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentAnalysisResult {
  documentType: string;
  keyFindings: string[];
  extractedData: Record<string, unknown>;
  suggestedWorkflows: string[];
  confidence: number;
}

export class LLMWorkflowService {
  async analyzeUploadedDocument(
    content: string,
    mimeType: string
  ): Promise<DocumentAnalysisResult> {
    const documentType = this.detectDocumentType(content, mimeType);
    const keyFindings = this.extractKeyFindings(content, documentType);
    const extractedData = this.extractStructuredData(content, documentType);
    const suggestedWorkflows = this.suggestWorkflows(keyFindings, extractedData);

    return {
      documentType,
      keyFindings,
      extractedData,
      suggestedWorkflows,
      confidence: 0.85,
    };
  }

  private detectDocumentType(content: string, mimeType: string): string {
    const contentLower = content.toLowerCase();

    if (contentLower.includes('laboratory') || contentLower.includes('lab result')) {
      return 'laboratory_report';
    } else if (contentLower.includes('prescription') || contentLower.includes('medication')) {
      return 'prescription';
    } else if (contentLower.includes('discharge summary')) {
      return 'discharge_summary';
    } else if (contentLower.includes('radiology') || contentLower.includes('imaging')) {
      return 'imaging_report';
    } else if (contentLower.includes('consultation') || contentLower.includes('visit note')) {
      return 'consultation_note';
    } else if (contentLower.includes('pathology')) {
      return 'pathology_report';
    }

    return 'general_medical_document';
  }

  private extractKeyFindings(content: string, documentType: string): string[] {
    const findings: string[] = [];

    const abnormalPatterns = [
      /elevated|high|increased/gi,
      /low|decreased|reduced/gi,
      /abnormal|irregular/gi,
      /positive for/gi,
      /negative for/gi,
    ];

    const lines = content.split('\n');
    lines.forEach(line => {
      abnormalPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          findings.push(line.trim());
        }
      });
    });

    if (documentType === 'laboratory_report') {
      const numericPattern = /(\w+)\s*[:\-]?\s*([\d.]+)\s*(mg\/dL|mmol\/L|g\/dL|%)/gi;
      let match;
      while ((match = numericPattern.exec(content)) !== null) {
        findings.push(`${match[1]}: ${match[2]} ${match[3]}`);
      }
    }

    return findings.slice(0, 10);
  }

  private extractStructuredData(content: string, documentType: string): Record<string, unknown> {
    const data: Record<string, unknown> = {
      documentType,
      extractedAt: new Date().toISOString(),
    };

    const datePattern = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/g;
    const dates = content.match(datePattern);
    if (dates && dates.length > 0) {
      data.documentDate = dates[0];
    }

    const namePattern = /patient:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i;
    const nameMatch = content.match(namePattern);
    if (nameMatch) {
      data.patientName = nameMatch[1];
    }

    if (documentType === 'laboratory_report') {
      const labResults: Record<string, unknown>[] = [];
      const resultPattern = /(\w+(?:\s+\w+)*)\s*[:\-]?\s*([\d.]+)\s*(mg\/dL|mmol\/L|g\/dL|%|\/uL)/gi;
      let match;
      while ((match = resultPattern.exec(content)) !== null) {
        labResults.push({
          test: match[1].trim(),
          value: parseFloat(match[2]),
          unit: match[3],
        });
      }
      data.labResults = labResults;
    }

    if (documentType === 'prescription') {
      const medications: string[] = [];
      const medPattern = /(\w+(?:\s+\w+)*)\s+(\d+)\s*(mg|mcg|g)/gi;
      let match;
      while ((match = medPattern.exec(content)) !== null) {
        medications.push(`${match[1]} ${match[2]}${match[3]}`);
      }
      data.medications = medications;
    }

    return data;
  }

  private suggestWorkflows(
    keyFindings: string[],
    extractedData: Record<string, unknown>
  ): string[] {
    const workflows: string[] = [];
    const findingsText = keyFindings.join(' ').toLowerCase();

    if (findingsText.includes('elevated') || findingsText.includes('high')) {
      workflows.push('follow_up_abnormal_results');
      workflows.push('specialist_referral_review');
    }

    if (findingsText.includes('positive for')) {
      workflows.push('treatment_initiation');
      workflows.push('patient_education');
    }

    if (extractedData.documentType === 'laboratory_report') {
      workflows.push('lab_result_review');
      workflows.push('trend_analysis');
    }

    if (extractedData.documentType === 'prescription') {
      workflows.push('medication_adherence_tracking');
      workflows.push('refill_management');
    }

    if (extractedData.documentType === 'imaging_report') {
      workflows.push('imaging_follow_up');
    }

    return workflows;
  }

  async generateWorkflowFromRecords(
    patientId: string,
    records: FHIRResource[]
  ): Promise<GeneratedWorkflow> {
    const analysisResults = this.analyzeRecordPatterns(records);
    const steps = this.generateWorkflowSteps(analysisResults);

    return {
      id: `workflow_${Date.now()}`,
      patientId,
      title: analysisResults.workflowTitle,
      description: analysisResults.workflowDescription,
      steps,
      estimatedDuration: analysisResults.estimatedDuration,
      createdAt: new Date().toISOString(),
      metadata: {
        recordCount: records.length,
        confidence: analysisResults.confidence,
      },
    };
  }

  private analyzeRecordPatterns(records: FHIRResource[]): {
    workflowTitle: string;
    workflowDescription: string;
    estimatedDuration: string;
    confidence: number;
    patterns: string[];
  } {
    const resourceTypes = records.map(r => r.resourceType);
    const hasConditions = resourceTypes.includes('Condition');
    const hasObservations = resourceTypes.includes('Observation');
    const hasMedications = resourceTypes.includes('MedicationRequest');

    let title = 'General Care Plan';
    let description = 'Standard care workflow based on patient records';
    let duration = '2-4 weeks';

    if (hasConditions && hasObservations) {
      title = 'Chronic Condition Management';
      description = 'Comprehensive monitoring and management workflow for diagnosed conditions';
      duration = '3-6 months';
    } else if (hasMedications) {
      title = 'Medication Management Workflow';
      description = 'Track medication adherence and monitor for side effects';
      duration = '1-3 months';
    } else if (hasObservations) {
      title = 'Monitoring and Assessment Workflow';
      description = 'Regular monitoring of vital signs and test results';
      duration = '4-8 weeks';
    }

    return {
      workflowTitle: title,
      workflowDescription: description,
      estimatedDuration: duration,
      confidence: 0.8,
      patterns: resourceTypes,
    };
  }

  private generateWorkflowSteps(analysis: {
    workflowTitle: string;
    patterns: string[];
  }): WorkflowStep[] {
    const steps: WorkflowStep[] = [];

    steps.push({
      id: 'step_1',
      type: 'assessment',
      title: 'Initial Assessment',
      description: 'Review patient history and current status',
      priority: 'high',
      dependencies: [],
      resources: ['patient_records', 'clinical_guidelines'],
    });

    if (analysis.patterns.includes('Observation')) {
      steps.push({
        id: 'step_2',
        type: 'assessment',
        title: 'Monitor Vital Signs',
        description: 'Track and analyze vital sign trends',
        priority: 'medium',
        dependencies: ['step_1'],
        resources: ['observation_data', 'trending_tools'],
      });
    }

    if (analysis.patterns.includes('Condition')) {
      steps.push({
        id: 'step_3',
        type: 'diagnosis',
        title: 'Review Diagnoses',
        description: 'Validate and update diagnosis information',
        priority: 'high',
        dependencies: ['step_1'],
        resources: ['diagnostic_criteria', 'clinical_evidence'],
      });

      steps.push({
        id: 'step_4',
        type: 'treatment',
        title: 'Treatment Plan Review',
        description: 'Assess current treatment effectiveness',
        priority: 'high',
        dependencies: ['step_3'],
        resources: ['treatment_guidelines', 'evidence_base'],
      });
    }

    if (analysis.patterns.includes('MedicationRequest')) {
      steps.push({
        id: 'step_5',
        type: 'treatment',
        title: 'Medication Reconciliation',
        description: 'Verify all medications and check for interactions',
        priority: 'high',
        dependencies: ['step_1'],
        resources: ['medication_database', 'interaction_checker'],
      });
    }

    steps.push({
      id: `step_${steps.length + 1}`,
      type: 'followup',
      title: 'Schedule Follow-up',
      description: 'Arrange next appointment and monitoring',
      priority: 'medium',
      dependencies: steps.map(s => s.id),
      resources: ['scheduling_system', 'patient_portal'],
    });

    return steps;
  }

  async extractFHIRFromDocument(
    content: string,
    patientId: string
  ): Promise<FHIRResource[]> {
    const analysis = await this.analyzeUploadedDocument(content, 'text/plain');
    const resources: FHIRResource[] = [];

    if (analysis.documentType === 'laboratory_report' && analysis.extractedData.labResults) {
      const labResults = analysis.extractedData.labResults as Array<{
        test: string;
        value: number;
        unit: string;
      }>;

      labResults.forEach((result, index) => {
        const loincLookup = this.guessLOINCCode(result.test);

        resources.push({
          resourceType: 'Observation',
          id: `obs_${Date.now()}_${index}`,
          status: 'final',
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: 'laboratory',
                  display: 'Laboratory',
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: loincLookup.code,
                display: loincLookup.display,
              },
            ],
            text: result.test,
          },
          subject: {
            reference: `Patient/${patientId}`,
          },
          valueQuantity: {
            value: result.value,
            unit: result.unit,
          },
        });
      });
    }

    if (analysis.documentType === 'prescription' && analysis.extractedData.medications) {
      const medications = analysis.extractedData.medications as string[];

      medications.forEach((medication, index) => {
        resources.push({
          resourceType: 'MedicationRequest',
          id: `med_${Date.now()}_${index}`,
          status: 'active',
          intent: 'order',
          medicationCodeableConcept: {
            text: medication,
          },
          subject: {
            reference: `Patient/${patientId}`,
          },
        });
      });
    }

    return resources;
  }

  private guessLOINCCode(testName: string): { code: string; display: string } {
    const testLower = testName.toLowerCase();

    if (testLower.includes('glucose') || testLower.includes('sugar')) {
      return { code: '2345-7', display: 'Glucose [Mass/volume] in Serum or Plasma' };
    } else if (testLower.includes('cholesterol')) {
      return { code: '2093-3', display: 'Cholesterol [Mass/volume] in Serum or Plasma' };
    } else if (testLower.includes('hemoglobin') || testLower.includes('hgb')) {
      return { code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood' };
    } else if (testLower.includes('triglyceride')) {
      return { code: '2571-8', display: 'Triglyceride [Mass/volume] in Serum or Plasma' };
    }

    return { code: '85354-9', display: 'Blood pressure panel with all children optional' };
  }

  async generateWorkflowSuggestions(
    patientId: string,
    recentRecords: FHIRResource[]
  ): Promise<string[]> {
    const suggestions: string[] = [];

    const conditions = recentRecords.filter(r => r.resourceType === 'Condition');
    const observations = recentRecords.filter(r => r.resourceType === 'Observation');
    const medications = recentRecords.filter(r => r.resourceType === 'MedicationRequest');

    if (conditions.length > 0) {
      suggestions.push('Create chronic disease management workflow');
      suggestions.push('Schedule regular monitoring visits');
    }

    if (observations.length > 3) {
      suggestions.push('Analyze trends in vital signs');
      suggestions.push('Generate health summary report');
    }

    if (medications.length > 0) {
      suggestions.push('Set up medication reminders');
      suggestions.push('Check for drug interactions');
      suggestions.push('Schedule prescription refills');
    }

    if (recentRecords.length > 10) {
      suggestions.push('Consolidate medical records');
      suggestions.push('Create comprehensive care plan');
    }

    return suggestions;
  }
}

export const llmWorkflowService = new LLMWorkflowService();
