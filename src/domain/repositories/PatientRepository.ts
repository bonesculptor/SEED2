import { BaseRepository } from './BaseRepository';

export interface Patient {
  id: string;
  userId: string;
  givenName: string;
  familyName: string;
  birthDate?: string;
  gender?: string;
  nhsNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientData {
  givenName: string;
  familyName: string;
  birthDate?: string;
  gender?: string;
  nhsNumber?: string;
}

export interface UpdatePatientData {
  givenName?: string;
  familyName?: string;
  birthDate?: string;
  gender?: string;
  nhsNumber?: string;
}

export class PatientRepository extends BaseRepository<Patient> {
  private readonly tableName = 'fhir_patient_protocols';

  async findByUserId(userId: string): Promise<Patient[]> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'fetch patients');
    }

    return (data || []).map(this.toDomain);
  }

  async findById(id: string, userId: string): Promise<Patient | null> {
    const { data, error } = await this.db
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch patient');
    }

    return data ? this.toDomain(data) : null;
  }

  async create(userId: string, patientData: CreatePatientData): Promise<Patient> {
    const { data, error } = await this.db
      .from(this.tableName)
      .insert({
        user_id: userId,
        given_name: patientData.givenName,
        family_name: patientData.familyName,
        birth_date: patientData.birthDate,
        gender: patientData.gender,
        nhs_number: patientData.nhsNumber,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create patient');
    }

    return this.toDomain(data);
  }

  async update(id: string, userId: string, patientData: UpdatePatientData): Promise<Patient> {
    const updateData: Record<string, unknown> = {};

    if (patientData.givenName !== undefined) updateData.given_name = patientData.givenName;
    if (patientData.familyName !== undefined) updateData.family_name = patientData.familyName;
    if (patientData.birthDate !== undefined) updateData.birth_date = patientData.birthDate;
    if (patientData.gender !== undefined) updateData.gender = patientData.gender;
    if (patientData.nhsNumber !== undefined) updateData.nhs_number = patientData.nhsNumber;

    const { data, error } = await this.db
      .from(this.tableName)
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'update patient');
    }

    return this.toDomain(data);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.db
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'delete patient');
    }
  }

  private toDomain(row: any): Patient {
    return {
      id: row.id,
      userId: row.user_id,
      givenName: row.given_name ?? 'Unknown',
      familyName: row.family_name ?? 'Unknown',
      birthDate: row.birth_date,
      gender: row.gender,
      nhsNumber: row.nhs_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
