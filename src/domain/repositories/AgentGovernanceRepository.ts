import { BaseRepository } from './BaseRepository';

// =============================================
// Three-Tier Governance Types
// =============================================

// Tier 3: Ecosystem Environment (GCP)
export interface EcosystemEnvironment {
  id: string;
  userId: string;
  gicsId?: string;
  gcpId: string;
  name: string;
  version: string;
  domainClassification: string;
  regulatoryEnvironment: unknown[];
  industryConstraints: Record<string, unknown>;
  evolutionStrategy: string;
  learningEnabled: boolean;
  adaptationRate?: number;
  interDomainPolicies: unknown[];
  knowledgeSharingRules: Record<string, unknown>;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  lastEvolutionAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Tier 1: Individual Agent
export interface AgentDefinition {
  id: string;
  userId: string;
  acpId?: string;
  ecosystemId?: string;
  gicsId?: string;
  agentId: string;
  name: string;
  agentType: string;
  version: string;
  capabilities: unknown[];
  supportedProtocols: string[];
  domainRestrictions: unknown[];
  config: Record<string, unknown>;
  isActive: boolean;
  oversightLevel: string;
  approvalRequired: boolean;
  auditLevel: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Tier 2: Agent Ensemble
export interface AgentEnsemble {
  id: string;
  userId: string;
  ecosystemId: string;
  ensembleId: string;
  name: string;
  description?: string;
  memberAgentIds: string[];
  coordinationStrategy: 'sequential' | 'parallel' | 'conditional' | 'collaborative';
  sharedContext: Record<string, unknown>;
  communicationProtocol: string;
  emergentCapabilities: unknown[];
  performanceMetrics: Record<string, unknown>;
  ensemblePolicies: unknown[];
  conflictResolution: string;
  isActive: boolean;
  lastCoordinationAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Agent Job with Protocol Context
export interface AgentJob {
  id: string;
  userId: string;
  agentId: string;
  ensembleId?: string;

  // Three-Tier Protocol Selection
  hcpId?: string;
  bcpId?: string;
  geocpId?: string;
  dcpId?: string;
  tcpId?: string;

  status: 'pending' | 'policy_check' | 'approved' | 'running' | 'completed' | 'failed' | 'cancelled';
  inputData?: unknown;
  outputData?: unknown;
  errorMessage?: string;

  // Governance
  policyCheckPassed?: boolean;
  policiesEvaluated?: string[];
  approvalStatus?: 'not_required' | 'pending' | 'approved' | 'denied';
  approvedBy?: string;
  approvedAt?: string;

  // Execution
  startedAt?: string;
  completedAt?: string;
  executionTimeMs?: number;

  // Audit
  recordsAccessed: number;
  recordsModified: number;
  phiAccessed: boolean;

  metadata?: Record<string, unknown>;
  createdAt: string;
}

// GICS Classification
export interface GICSClassification {
  id: string;
  userId: string;
  sectorCode: string;
  sectorName: string;
  industryGroupCode?: string;
  industryGroupName?: string;
  industryCode?: string;
  industryName?: string;
  subIndustryCode?: string;
  subIndustryName?: string;
  isHealthcare: boolean;
  description?: string;
  regulatoryRequirements: unknown[];
  applicableStandards: unknown[];
  createdAt: string;
  updatedAt: string;
}

// =============================================
// Agent Governance Repository
// =============================================

export class AgentGovernanceRepository extends BaseRepository<any> {
  // =============================================
  // Tier 3: Ecosystem Management
  // =============================================

  async getEcosystem(gcpId: string, userId: string): Promise<EcosystemEnvironment | null> {
    const { data, error } = await this.db
      .from('ecosystem_environments')
      .select('*')
      .eq('gcp_id', gcpId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch ecosystem');
    }

    return data ? this.ecosystemToDomain(data) : null;
  }

  async listEcosystems(userId: string, domainClassification?: string): Promise<EcosystemEnvironment[]> {
    let query = this.db
      .from('ecosystem_environments')
      .select('*')
      .eq('user_id', userId);

    if (domainClassification) {
      query = query.eq('domain_classification', domainClassification);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'list ecosystems');
    }

    return (data || []).map(this.ecosystemToDomain);
  }

  async createEcosystem(userId: string, ecosystem: Partial<EcosystemEnvironment>): Promise<EcosystemEnvironment> {
    const { data, error } = await this.db
      .from('ecosystem_environments')
      .insert({
        user_id: userId,
        gics_id: ecosystem.gicsId,
        gcp_id: ecosystem.gcpId,
        name: ecosystem.name,
        version: ecosystem.version || '1.0.0',
        domain_classification: ecosystem.domainClassification,
        regulatory_environment: ecosystem.regulatoryEnvironment || [],
        industry_constraints: ecosystem.industryConstraints || {},
        evolution_strategy: ecosystem.evolutionStrategy || 'supervised',
        learning_enabled: ecosystem.learningEnabled ?? true,
        adaptation_rate: ecosystem.adaptationRate,
        inter_domain_policies: ecosystem.interDomainPolicies || [],
        knowledge_sharing_rules: ecosystem.knowledgeSharingRules || {},
        health_status: ecosystem.healthStatus || 'healthy',
        metadata: ecosystem.metadata,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create ecosystem');
    }

    return this.ecosystemToDomain(data);
  }

  async updateEcosystemHealth(ecosystemId: string, userId: string, healthStatus: string): Promise<void> {
    const { error } = await this.db
      .from('ecosystem_environments')
      .update({
        health_status: healthStatus,
        last_evolution_at: new Date().toISOString(),
      })
      .eq('id', ecosystemId)
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'update ecosystem health');
    }
  }

  // =============================================
  // Tier 1: Individual Agent Management
  // =============================================

  async getAgent(agentId: string, userId: string): Promise<AgentDefinition | null> {
    const { data, error } = await this.db
      .from('agent_definitions')
      .select('*')
      .eq('agent_id', agentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch agent');
    }

    return data ? this.agentToDomain(data) : null;
  }

  async listAgents(userId: string, filters?: {
    ecosystemId?: string;
    agentType?: string;
    isActive?: boolean;
  }): Promise<AgentDefinition[]> {
    let query = this.db
      .from('agent_definitions')
      .select('*')
      .eq('user_id', userId);

    if (filters?.ecosystemId) {
      query = query.eq('ecosystem_id', filters.ecosystemId);
    }
    if (filters?.agentType) {
      query = query.eq('agent_type', filters.agentType);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'list agents');
    }

    return (data || []).map(this.agentToDomain);
  }

  async createAgent(userId: string, agent: Partial<AgentDefinition>): Promise<AgentDefinition> {
    const { data, error } = await this.db
      .from('agent_definitions')
      .insert({
        user_id: userId,
        acp_id: agent.acpId,
        ecosystem_id: agent.ecosystemId,
        gics_id: agent.gicsId,
        agent_id: agent.agentId,
        name: agent.name,
        agent_type: agent.agentType,
        version: agent.version || '1.0.0',
        capabilities: agent.capabilities || [],
        supported_protocols: agent.supportedProtocols || [],
        domain_restrictions: agent.domainRestrictions || [],
        config: agent.config || {},
        is_active: agent.isActive ?? true,
        oversight_level: agent.oversightLevel || 'notification',
        approval_required: agent.approvalRequired ?? false,
        audit_level: agent.auditLevel || 'standard',
        metadata: agent.metadata,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create agent');
    }

    return this.agentToDomain(data);
  }

  // =============================================
  // Tier 2: Ensemble Management
  // =============================================

  async getEnsemble(ensembleId: string, userId: string): Promise<AgentEnsemble | null> {
    const { data, error } = await this.db
      .from('agent_ensembles')
      .select('*')
      .eq('ensemble_id', ensembleId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch ensemble');
    }

    return data ? this.ensembleToDomain(data) : null;
  }

  async listEnsembles(userId: string, ecosystemId?: string): Promise<AgentEnsemble[]> {
    let query = this.db
      .from('agent_ensembles')
      .select('*')
      .eq('user_id', userId);

    if (ecosystemId) {
      query = query.eq('ecosystem_id', ecosystemId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'list ensembles');
    }

    return (data || []).map(this.ensembleToDomain);
  }

  async createEnsemble(userId: string, ensemble: Partial<AgentEnsemble>): Promise<AgentEnsemble> {
    const { data, error } = await this.db
      .from('agent_ensembles')
      .insert({
        user_id: userId,
        ecosystem_id: ensemble.ecosystemId,
        ensemble_id: ensemble.ensembleId,
        name: ensemble.name,
        description: ensemble.description,
        member_agent_ids: ensemble.memberAgentIds || [],
        coordination_strategy: ensemble.coordinationStrategy || 'sequential',
        shared_context: ensemble.sharedContext || {},
        communication_protocol: ensemble.communicationProtocol || 'message_passing',
        emergent_capabilities: ensemble.emergentCapabilities || [],
        performance_metrics: ensemble.performanceMetrics || {},
        ensemble_policies: ensemble.ensemblePolicies || [],
        conflict_resolution: ensemble.conflictResolution || 'priority_based',
        is_active: ensemble.isActive ?? true,
        metadata: ensemble.metadata,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create ensemble');
    }

    return this.ensembleToDomain(data);
  }

  // =============================================
  // Agent Job Management (with Protocol Context)
  // =============================================

  async createJob(userId: string, job: Partial<AgentJob>): Promise<AgentJob> {
    const { data, error } = await this.db
      .from('agent_jobs')
      .insert({
        user_id: userId,
        agent_id: job.agentId,
        ensemble_id: job.ensembleId,
        hcp_id: job.hcpId,
        bcp_id: job.bcpId,
        geocp_id: job.geocpId,
        dcp_id: job.dcpId,
        tcp_id: job.tcpId,
        status: job.status || 'pending',
        input_data: job.inputData,
        metadata: job.metadata,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create agent job');
    }

    return this.jobToDomain(data);
  }

  async getJob(jobId: string, userId: string): Promise<AgentJob | null> {
    const { data, error } = await this.db
      .from('agent_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch agent job');
    }

    return data ? this.jobToDomain(data) : null;
  }

  async updateJobStatus(
    jobId: string,
    userId: string,
    status: string,
    updates?: Partial<AgentJob>
  ): Promise<AgentJob> {
    const updateData: Record<string, unknown> = {
      status,
      ...updates,
    };

    if (status === 'running' && !updates?.startedAt) {
      updateData.started_at = new Date().toISOString();
    }

    if ((status === 'completed' || status === 'failed') && !updates?.completedAt) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.db
      .from('agent_jobs')
      .update(updateData)
      .eq('id', jobId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      this.handleError(error, 'update agent job');
    }

    return this.jobToDomain(data);
  }

  async listJobs(userId: string, filters?: {
    agentId?: string;
    status?: string;
    limit?: number;
  }): Promise<AgentJob[]> {
    let query = this.db
      .from('agent_jobs')
      .select('*')
      .eq('user_id', userId);

    if (filters?.agentId) {
      query = query.eq('agent_id', filters.agentId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'list agent jobs');
    }

    return (data || []).map(this.jobToDomain);
  }

  // =============================================
  // GICS Classification
  // =============================================

  async getGICSClassification(gicsId: string, userId: string): Promise<GICSClassification | null> {
    const { data, error } = await this.db
      .from('gics_classifications')
      .select('*')
      .eq('id', gicsId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch GICS classification');
    }

    return data ? this.gicsToDomain(data) : null;
  }

  async listGICSClassifications(userId: string, sectorCode?: string): Promise<GICSClassification[]> {
    let query = this.db
      .from('gics_classifications')
      .select('*')
      .eq('user_id', userId);

    if (sectorCode) {
      query = query.eq('sector_code', sectorCode);
    }

    const { data, error } = await query.order('sector_code');

    if (error) {
      this.handleError(error, 'list GICS classifications');
    }

    return (data || []).map(this.gicsToDomain);
  }

  async createGICSClassification(userId: string, gics: Partial<GICSClassification>): Promise<GICSClassification> {
    const { data, error } = await this.db
      .from('gics_classifications')
      .insert({
        user_id: userId,
        sector_code: gics.sectorCode,
        sector_name: gics.sectorName,
        industry_group_code: gics.industryGroupCode,
        industry_group_name: gics.industryGroupName,
        industry_code: gics.industryCode,
        industry_name: gics.industryName,
        sub_industry_code: gics.subIndustryCode,
        sub_industry_name: gics.subIndustryName,
        description: gics.description,
        regulatory_requirements: gics.regulatoryRequirements || [],
        applicable_standards: gics.applicableStandards || [],
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create GICS classification');
    }

    return this.gicsToDomain(data);
  }

  // =============================================
  // Domain Mappers
  // =============================================

  private ecosystemToDomain(row: any): EcosystemEnvironment {
    return {
      id: row.id,
      userId: row.user_id,
      gicsId: row.gics_id,
      gcpId: row.gcp_id,
      name: row.name,
      version: row.version,
      domainClassification: row.domain_classification,
      regulatoryEnvironment: row.regulatory_environment || [],
      industryConstraints: row.industry_constraints || {},
      evolutionStrategy: row.evolution_strategy,
      learningEnabled: row.learning_enabled,
      adaptationRate: row.adaptation_rate,
      interDomainPolicies: row.inter_domain_policies || [],
      knowledgeSharingRules: row.knowledge_sharing_rules || {},
      healthStatus: row.health_status,
      lastEvolutionAt: row.last_evolution_at,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private agentToDomain(row: any): AgentDefinition {
    return {
      id: row.id,
      userId: row.user_id,
      acpId: row.acp_id,
      ecosystemId: row.ecosystem_id,
      gicsId: row.gics_id,
      agentId: row.agent_id,
      name: row.name,
      agentType: row.agent_type,
      version: row.version,
      capabilities: row.capabilities || [],
      supportedProtocols: row.supported_protocols || [],
      domainRestrictions: row.domain_restrictions || [],
      config: row.config || {},
      isActive: row.is_active,
      oversightLevel: row.oversight_level,
      approvalRequired: row.approval_required,
      auditLevel: row.audit_level,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private ensembleToDomain(row: any): AgentEnsemble {
    return {
      id: row.id,
      userId: row.user_id,
      ecosystemId: row.ecosystem_id,
      ensembleId: row.ensemble_id,
      name: row.name,
      description: row.description,
      memberAgentIds: row.member_agent_ids || [],
      coordinationStrategy: row.coordination_strategy,
      sharedContext: row.shared_context || {},
      communicationProtocol: row.communication_protocol,
      emergentCapabilities: row.emergent_capabilities || [],
      performanceMetrics: row.performance_metrics || {},
      ensemblePolicies: row.ensemble_policies || [],
      conflictResolution: row.conflict_resolution,
      isActive: row.is_active,
      lastCoordinationAt: row.last_coordination_at,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private jobToDomain(row: any): AgentJob {
    return {
      id: row.id,
      userId: row.user_id,
      agentId: row.agent_id,
      ensembleId: row.ensemble_id,
      hcpId: row.hcp_id,
      bcpId: row.bcp_id,
      geocpId: row.geocp_id,
      dcpId: row.dcp_id,
      tcpId: row.tcp_id,
      status: row.status,
      inputData: row.input_data,
      outputData: row.output_data,
      errorMessage: row.error_message,
      policyCheckPassed: row.policy_check_passed,
      policiesEvaluated: row.policies_evaluated,
      approvalStatus: row.approval_status,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      executionTimeMs: row.execution_time_ms,
      recordsAccessed: row.records_accessed || 0,
      recordsModified: row.records_modified || 0,
      phiAccessed: row.phi_accessed || false,
      metadata: row.metadata,
      createdAt: row.created_at,
    };
  }

  private gicsToDomain(row: any): GICSClassification {
    return {
      id: row.id,
      userId: row.user_id,
      sectorCode: row.sector_code,
      sectorName: row.sector_name,
      industryGroupCode: row.industry_group_code,
      industryGroupName: row.industry_group_name,
      industryCode: row.industry_code,
      industryName: row.industry_name,
      subIndustryCode: row.sub_industry_code,
      subIndustryName: row.sub_industry_name,
      isHealthcare: row.is_healthcare,
      description: row.description,
      regulatoryRequirements: row.regulatory_requirements || [],
      applicableStandards: row.applicable_standards || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
