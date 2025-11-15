import { SupabaseClient } from '@supabase/supabase-js';

export interface PatientData {
  givenName: string;
  familyName: string;
  middleName?: string;
  dateOfBirth: string;
  nhsNumber?: string;
  hospitalNumber?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    county?: string;
    postcode?: string;
  };
  phone?: string;
}

export interface ConditionData {
  code?: string;
  codeSystem?: string;
  display: string;
  clinicalStatus: string;
  verificationStatus: string;
  onsetDate?: string;
  severity?: string;
  bodySite?: string;
  notes?: string;
}

export interface ProcedureData {
  code?: string;
  codeSystem?: string;
  display: string;
  category: string;
  performedDate: string;
  bodySite?: string;
  approach?: string;
  outcome?: string;
  complications?: string[];
  notes?: string;
  primaryPerformer?: string;
  location?: string;
}

export interface MedicationData {
  medicationName: string;
  genericName?: string;
  doseQuantity?: number;
  doseUnit?: string;
  route?: string;
  frequency?: string;
  timing?: string;
  status: string;
  prescribedDate?: string;
  startDate?: string;
  endDate?: string;
  durationDays?: number;
  indication?: string;
  instructions?: string;
  prescriberName?: string;
}

export interface ObservationData {
  code?: string;
  codeSystem?: string;
  display: string;
  category: string;
  effectiveDate: string;
  valueQuantity?: number;
  valueUnit?: string;
  valueString?: string;
  interpretation?: string;
  notes?: string;
}

export interface EncounterData {
  encounterType: string;
  status: string;
  startDate: string;
  endDate?: string;
  locationName?: string;
  reasonText?: string;
  primaryPractitioner?: string;
  notes?: string;
  summary?: string;
}

export interface TreatmentPlanData {
  title: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  goals?: any[];
  activities?: any[];
  primaryPractitioner?: string;
  notes?: string;
}

export class DigitalTwinService {
  constructor(private supabase: SupabaseClient) {}

  async createPatient(userId: string, data: PatientData): Promise<string> {
    const { data: patient, error } = await this.supabase
      .from('patients')
      .insert({
        user_id: userId,
        given_name: data.givenName,
        family_name: data.familyName,
        middle_name: data.middleName,
        date_of_birth: data.dateOfBirth,
        nhs_number: data.nhsNumber,
        hospital_number: data.hospitalNumber,
        address_line1: data.address?.line1,
        address_line2: data.address?.line2,
        city: data.address?.city,
        county: data.address?.county,
        postcode: data.address?.postcode,
        phone: data.phone,
      })
      .select('id')
      .single();

    if (error) throw error;
    return patient.id;
  }

  async createCondition(
    userId: string,
    patientId: string,
    data: ConditionData
  ): Promise<string> {
    const { data: condition, error } = await this.supabase
      .from('conditions')
      .insert({
        user_id: userId,
        patient_id: patientId,
        code: data.code,
        code_system: data.codeSystem,
        display: data.display,
        clinical_status: data.clinicalStatus,
        verification_status: data.verificationStatus,
        onset_date: data.onsetDate,
        severity: data.severity,
        body_site: data.bodySite,
        notes: data.notes,
      })
      .select('id')
      .single();

    if (error) throw error;
    return condition.id;
  }

  async createProcedure(
    userId: string,
    patientId: string,
    data: ProcedureData
  ): Promise<string> {
    const { data: procedure, error } = await this.supabase
      .from('procedures')
      .insert({
        user_id: userId,
        patient_id: patientId,
        code: data.code,
        code_system: data.codeSystem,
        display: data.display,
        category: data.category,
        performed_date: data.performedDate,
        body_site: data.bodySite,
        approach: data.approach,
        outcome: data.outcome,
        complications: data.complications || [],
        notes: data.notes,
        primary_performer: data.primaryPerformer,
        location: data.location,
      })
      .select('id')
      .single();

    if (error) throw error;
    return procedure.id;
  }

  async createMedication(
    userId: string,
    patientId: string,
    data: MedicationData
  ): Promise<string> {
    const { data: medication, error } = await this.supabase
      .from('medications')
      .insert({
        user_id: userId,
        patient_id: patientId,
        medication_name: data.medicationName,
        generic_name: data.genericName,
        dose_quantity: data.doseQuantity,
        dose_unit: data.doseUnit,
        route: data.route,
        frequency: data.frequency,
        timing: data.timing,
        status: data.status,
        prescribed_date: data.prescribedDate,
        start_date: data.startDate,
        end_date: data.endDate,
        duration_days: data.durationDays,
        indication: data.indication,
        instructions: data.instructions,
        prescriber_name: data.prescriberName,
      })
      .select('id')
      .single();

    if (error) throw error;
    return medication.id;
  }

  async createObservation(
    userId: string,
    patientId: string,
    data: ObservationData
  ): Promise<string> {
    const { data: observation, error } = await this.supabase
      .from('observations')
      .insert({
        user_id: userId,
        patient_id: patientId,
        code: data.code,
        code_system: data.codeSystem,
        display: data.display,
        category: data.category,
        effective_date: data.effectiveDate,
        value_quantity: data.valueQuantity,
        value_unit: data.valueUnit,
        value_string: data.valueString,
        interpretation: data.interpretation,
        notes: data.notes,
      })
      .select('id')
      .single();

    if (error) throw error;
    return observation.id;
  }

  async createEncounter(
    userId: string,
    patientId: string,
    data: EncounterData
  ): Promise<string> {
    const { data: encounter, error } = await this.supabase
      .from('encounters')
      .insert({
        user_id: userId,
        patient_id: patientId,
        encounter_type: data.encounterType,
        status: data.status,
        start_date: data.startDate,
        end_date: data.endDate,
        location_name: data.locationName,
        reason_text: data.reasonText,
        primary_practitioner: data.primaryPractitioner,
        notes: data.notes,
        summary: data.summary,
      })
      .select('id')
      .single();

    if (error) throw error;
    return encounter.id;
  }

  async createTreatmentPlan(
    userId: string,
    patientId: string,
    data: TreatmentPlanData
  ): Promise<string> {
    const { data: plan, error } = await this.supabase
      .from('treatment_plans')
      .insert({
        user_id: userId,
        patient_id: patientId,
        title: data.title,
        description: data.description,
        status: data.status,
        start_date: data.startDate,
        end_date: data.endDate,
        goals: data.goals || [],
        activities: data.activities || [],
        primary_practitioner: data.primaryPractitioner,
        notes: data.notes,
      })
      .select('id')
      .single();

    if (error) throw error;
    return plan.id;
  }

  async createRelationship(
    userId: string,
    sourceType: string,
    sourceId: string,
    targetType: string,
    targetId: string,
    relationshipType: string,
    context?: string
  ): Promise<void> {
    const { error } = await this.supabase.from('medical_relationships').insert({
      user_id: userId,
      source_type: sourceType,
      source_id: sourceId,
      target_type: targetType,
      target_id: targetId,
      relationship_type: relationshipType,
      context,
    });

    if (error) throw error;
  }

  async createDigitalTwinBaseline(
    userId: string,
    patientId: string,
    baselineName: string,
    baselineType: string,
    baselineDate: string,
    data: {
      conditions?: string[];
      procedures?: string[];
      medications?: string[];
      observations?: string[];
      treatmentPlanId?: string;
      clinicalSummary?: string;
      vitalSigns?: any;
      labResults?: any;
      functionalStatus?: any;
      sourceDocuments?: string[];
      notes?: string;
    }
  ): Promise<string> {
    const { data: baseline, error } = await this.supabase
      .from('digital_twin_baselines')
      .insert({
        user_id: userId,
        patient_id: patientId,
        baseline_name: baselineName,
        baseline_type: baselineType,
        baseline_date: baselineDate,
        conditions: data.conditions || [],
        procedures: data.procedures || [],
        medications: data.medications || [],
        observations: data.observations || [],
        treatment_plan_id: data.treatmentPlanId,
        clinical_summary: data.clinicalSummary,
        vital_signs: data.vitalSigns || {},
        lab_results: data.labResults || {},
        functional_status: data.functionalStatus || {},
        source_documents: data.sourceDocuments || [],
        notes: data.notes,
      })
      .select('id')
      .single();

    if (error) throw error;
    return baseline.id;
  }

  async getPatientGraph(userId: string, patientId: string): Promise<any> {
    const [conditions, procedures, medications, observations, encounters, relationships] =
      await Promise.all([
        this.supabase
          .from('conditions')
          .select('*')
          .eq('user_id', userId)
          .eq('patient_id', patientId),
        this.supabase
          .from('procedures')
          .select('*')
          .eq('user_id', userId)
          .eq('patient_id', patientId),
        this.supabase
          .from('medications')
          .select('*')
          .eq('user_id', userId)
          .eq('patient_id', patientId),
        this.supabase
          .from('observations')
          .select('*')
          .eq('user_id', userId)
          .eq('patient_id', patientId),
        this.supabase
          .from('encounters')
          .select('*')
          .eq('user_id', userId)
          .eq('patient_id', patientId),
        this.supabase
          .from('medical_relationships')
          .select('*')
          .eq('user_id', userId),
      ]);

    return {
      conditions: conditions.data || [],
      procedures: procedures.data || [],
      medications: medications.data || [],
      observations: observations.data || [],
      encounters: encounters.data || [],
      relationships: relationships.data || [],
    };
  }

  async getDigitalTwinBaselines(
    userId: string,
    patientId: string
  ): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('digital_twin_baselines')
      .select('*')
      .eq('user_id', userId)
      .eq('patient_id', patientId)
      .order('baseline_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const digitalTwinService = (supabase: SupabaseClient) =>
  new DigitalTwinService(supabase);
