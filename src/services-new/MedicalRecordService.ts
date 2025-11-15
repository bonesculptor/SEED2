import { SupabaseClient } from '@supabase/supabase-js';
import { MedicalRecordRepository, Medication, Condition, Observation, Allergy } from '../domain/repositories/MedicalRecordRepository';

export class MedicalRecordService {
  private repository: MedicalRecordRepository;

  constructor(supabaseClient: SupabaseClient) {
    this.repository = new MedicalRecordRepository(supabaseClient);
  }

  async getMedications(userId: string, patientId?: string) {
    return this.repository.getMedications(userId, patientId);
  }

  async createMedication(userId: string, medication: Partial<Medication>) {
    if (!medication.medicationText) {
      throw new Error('Medication text is required');
    }
    return this.repository.createMedication(userId, medication);
  }

  async getConditions(userId: string, patientId?: string) {
    return this.repository.getConditions(userId, patientId);
  }

  async createCondition(userId: string, condition: Partial<Condition>) {
    if (!condition.conditionText) {
      throw new Error('Condition text is required');
    }
    return this.repository.createCondition(userId, condition);
  }

  async getObservations(userId: string, patientId?: string) {
    return this.repository.getObservations(userId, patientId);
  }

  async createObservation(userId: string, observation: Partial<Observation>) {
    if (!observation.observationText) {
      throw new Error('Observation text is required');
    }
    return this.repository.createObservation(userId, observation);
  }

  async getAllergies(userId: string, patientId?: string) {
    return this.repository.getAllergies(userId, patientId);
  }

  async createAllergy(userId: string, allergy: Partial<Allergy>) {
    if (!allergy.allergyText) {
      throw new Error('Allergy text is required');
    }
    return this.repository.createAllergy(userId, allergy);
  }

  async getAllMedicalRecords(userId: string, patientId?: string) {
    const [medications, conditions, observations, allergies] = await Promise.all([
      this.getMedications(userId, patientId),
      this.getConditions(userId, patientId),
      this.getObservations(userId, patientId),
      this.getAllergies(userId, patientId),
    ]);

    return {
      medications,
      conditions,
      observations,
      allergies,
    };
  }
}
