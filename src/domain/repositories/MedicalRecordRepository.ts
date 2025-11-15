import { BaseRepository } from './BaseRepository';

export interface Medication {
  id: string;
  userId: string;
  patientId?: string;
  medicationText: string;
  medicationCode?: any;
  dosage?: string;
  frequency?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Condition {
  id: string;
  userId: string;
  patientId?: string;
  conditionText: string;
  conditionCode?: any;
  clinicalStatus: string;
  onsetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Observation {
  id: string;
  userId: string;
  patientId?: string;
  observationText: string;
  observationCode?: any;
  value?: string;
  unit?: string;
  observationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Allergy {
  id: string;
  userId: string;
  patientId?: string;
  allergyText: string;
  allergyCode?: any;
  criticality: string;
  createdAt: string;
  updatedAt: string;
}

export class MedicalRecordRepository extends BaseRepository<any> {
  async getMedications(userId: string, patientId?: string): Promise<Medication[]> {
    let query = this.db
      .from('fhir_medication_protocols')
      .select('*')
      .eq('user_id', userId);

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetch medications');
    }

    return (data || []).map(this.medicationToDomain);
  }

  async createMedication(userId: string, medication: Partial<Medication>): Promise<Medication> {
    const { data, error } = await this.db
      .from('fhir_medication_protocols')
      .insert({
        user_id: userId,
        patient_id: medication.patientId,
        medication_text: medication.medicationText,
        medication_code: medication.medicationCode,
        dosage: medication.dosage,
        frequency: medication.frequency,
        status: medication.status || 'active',
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create medication');
    }

    return this.medicationToDomain(data);
  }

  async getConditions(userId: string, patientId?: string): Promise<Condition[]> {
    let query = this.db
      .from('fhir_condition_protocols')
      .select('*')
      .eq('user_id', userId);

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetch conditions');
    }

    return (data || []).map(this.conditionToDomain);
  }

  async createCondition(userId: string, condition: Partial<Condition>): Promise<Condition> {
    const { data, error } = await this.db
      .from('fhir_condition_protocols')
      .insert({
        user_id: userId,
        patient_id: condition.patientId,
        condition_text: condition.conditionText,
        condition_code: condition.conditionCode,
        clinical_status: condition.clinicalStatus || 'active',
        onset_date: condition.onsetDate,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create condition');
    }

    return this.conditionToDomain(data);
  }

  async getObservations(userId: string, patientId?: string): Promise<Observation[]> {
    let query = this.db
      .from('fhir_observation_protocols')
      .select('*')
      .eq('user_id', userId);

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetch observations');
    }

    return (data || []).map(this.observationToDomain);
  }

  async createObservation(userId: string, observation: Partial<Observation>): Promise<Observation> {
    const { data, error } = await this.db
      .from('fhir_observation_protocols')
      .insert({
        user_id: userId,
        patient_id: observation.patientId,
        observation_text: observation.observationText,
        observation_code: observation.observationCode,
        value: observation.value,
        unit: observation.unit,
        observation_date: observation.observationDate,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create observation');
    }

    return this.observationToDomain(data);
  }

  async getAllergies(userId: string, patientId?: string): Promise<Allergy[]> {
    let query = this.db
      .from('fhir_allergy_protocols')
      .select('*')
      .eq('user_id', userId);

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetch allergies');
    }

    return (data || []).map(this.allergyToDomain);
  }

  async createAllergy(userId: string, allergy: Partial<Allergy>): Promise<Allergy> {
    const { data, error } = await this.db
      .from('fhir_allergy_protocols')
      .insert({
        user_id: userId,
        patient_id: allergy.patientId,
        allergy_text: allergy.allergyText,
        allergy_code: allergy.allergyCode,
        criticality: allergy.criticality || 'low',
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create allergy');
    }

    return this.allergyToDomain(data);
  }

  private medicationToDomain(row: any): Medication {
    return {
      id: row.id,
      userId: row.user_id,
      patientId: row.patient_id,
      medicationText: row.medication_text ?? '',
      medicationCode: row.medication_code,
      dosage: row.dosage,
      frequency: row.frequency,
      status: row.status ?? 'active',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private conditionToDomain(row: any): Condition {
    return {
      id: row.id,
      userId: row.user_id,
      patientId: row.patient_id,
      conditionText: row.condition_text ?? '',
      conditionCode: row.condition_code,
      clinicalStatus: row.clinical_status ?? 'active',
      onsetDate: row.onset_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private observationToDomain(row: any): Observation {
    return {
      id: row.id,
      userId: row.user_id,
      patientId: row.patient_id,
      observationText: row.observation_text ?? '',
      observationCode: row.observation_code,
      value: row.value,
      unit: row.unit,
      observationDate: row.observation_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private allergyToDomain(row: any): Allergy {
    return {
      id: row.id,
      userId: row.user_id,
      patientId: row.patient_id,
      allergyText: row.allergy_text ?? '',
      allergyCode: row.allergy_code,
      criticality: row.criticality ?? 'low',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
