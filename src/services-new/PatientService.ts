import { SupabaseClient } from '@supabase/supabase-js';
import { PatientRepository, CreatePatientData, UpdatePatientData } from '../domain/repositories/PatientRepository';

export class PatientService {
  private repository: PatientRepository;

  constructor(supabaseClient: SupabaseClient) {
    this.repository = new PatientRepository(supabaseClient);
  }

  async getPatients(userId: string) {
    return this.repository.findByUserId(userId);
  }

  async getPatient(id: string, userId: string) {
    return this.repository.findById(id, userId);
  }

  async createPatient(userId: string, patientData: CreatePatientData) {
    return this.repository.create(userId, patientData);
  }

  async updatePatient(id: string, userId: string, patientData: UpdatePatientData) {
    return this.repository.update(id, userId, patientData);
  }

  async deletePatient(id: string, userId: string) {
    return this.repository.delete(id, userId);
  }
}
