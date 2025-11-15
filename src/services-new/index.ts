import { SupabaseClient } from '@supabase/supabase-js';
import { PatientService } from './PatientService';
import { MedicalRecordService } from './MedicalRecordService';
import { DocumentService } from './DocumentService';
import { GraphService } from './GraphService';
import { AuthService } from './AuthService';
import { AgentSelectionService } from './AgentSelectionService';

export class ServiceContainer {
  public readonly patient: PatientService;
  public readonly medicalRecord: MedicalRecordService;
  public readonly document: DocumentService;
  public readonly graph: GraphService;
  public readonly auth: AuthService;
  public readonly agentSelection: AgentSelectionService;

  constructor(supabaseClient: SupabaseClient) {
    this.patient = new PatientService(supabaseClient);
    this.medicalRecord = new MedicalRecordService(supabaseClient);
    this.document = new DocumentService(supabaseClient);
    this.graph = new GraphService(supabaseClient);
    this.auth = new AuthService(supabaseClient);
    this.agentSelection = new AgentSelectionService(supabaseClient);
  }
}

export {
  PatientService,
  MedicalRecordService,
  DocumentService,
  GraphService,
  AuthService,
  AgentSelectionService,
};
