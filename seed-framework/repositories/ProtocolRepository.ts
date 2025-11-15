import { BaseRepository } from './BaseRepository';

// =============================================
// Protocol Types
// =============================================

export enum ProtocolType {
  HCP = 'HCP', // Human Context
  ACP = 'ACP', // Agent Context
  BCP = 'BCP', // Business Context
  MCP = 'MCP', // Machine Context
  GeoCP = 'GeoCP', // Geographical Context
  DCP = 'DCP', // Data Context
  TCP = 'TCP', // Test Context
  GCP = 'GCP', // Ecosystem/Global Context
}

// Domain Layer Protocols
export interface HumanContextProtocol {
  id: string;
  userId: string;
  ecosystemId?: string;
  hcpId: string;
  title: string;
  version: string;
  ownerName: string;
  ownerUri?: string;
  stewardName?: string;
  stewardUri?: string;
  validityFrom: string;
  validityTo?: string;
  timezone?: string;
  identity: Record<string, unknown>;
  context: Record<string, unknown>;
  resources: Record<string, unknown>;
  rules: unknown[];
  preferences: Record<string, unknown>;
  delegation: Record<string, unknown>;
  audit: unknown[];
  mesh: Record<string, unknown>;
  obcMap: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentContextProtocol {
  id: string;
  userId: string;
  ecosystemId?: string;
  hcpId?: string;
  acpId: string;
  agentType: string;
  title: string;
  version: string;
  capabilities: unknown[];
  constraints: Record<string, unknown>;
  domainRestrictions: unknown[];
  oversightLevel: 'none' | 'notification' | 'approval' | 'continuous';
  policyReferences: string[];
  riskScore: number;
  allowedProtocols: string[];
  dataAccessScope: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Business Layer Protocols
export interface BusinessContextProtocol {
  id: string;
  userId: string;
  ecosystemId?: string;
  bcpId: string;
  title: string;
  version: string;
  ownerName: string;
  ownerUri?: string;
  validityFrom: string;
  validityTo?: string;
  customerSegments: unknown[];
  valuePropositions: unknown[];
  channels: unknown[];
  customerRelationships: unknown[];
  revenueStreams: unknown[];
  keyResources: unknown[];
  keyActivities: unknown[];
  keyPartners: unknown[];
  costStructure: unknown[];
  metrics: Record<string, unknown>;
  linkedHcpId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Infrastructure Layer Protocols
export interface GeographicalContextProtocol {
  id: string;
  userId: string;
  ecosystemId?: string;
  geocpId: string;
  title: string;
  version: string;
  countryCode: string;
  region?: string;
  jurisdiction: string;
  dataSovereigntyRules: unknown[];
  complianceRequirements: unknown[];
  crossBorderRestrictions: Record<string, unknown>;
  allowedRegions: string[];
  prohibitedRegions: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DataContextProtocol {
  id: string;
  userId: string;
  ecosystemId?: string;
  dcpId: string;
  title: string;
  version: string;
  ownerName: string;
  ownerUri?: string;
  domain: string;
  dataProducts: unknown[];
  contracts: Record<string, unknown>;
  ports: unknown[];
  storage: Record<string, unknown>;
  slas: Record<string, unknown>;
  policies: unknown[];
  linkedHcpId?: string;
  linkedBcpId?: string;
  linkedMcpId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TestContextProtocol {
  id: string;
  userId: string;
  ecosystemId?: string;
  tcpId: string;
  title: string;
  version: string;
  ownerName: string;
  ownerUri?: string;
  baseline: Record<string, unknown>;
  monitoring: Record<string, unknown>;
  driftConfig: Record<string, unknown>;
  alerting: Record<string, unknown>;
  linkedDcpId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// =============================================
// Protocol Repository
// =============================================

export class ProtocolRepository extends BaseRepository<any> {
  // Human Context Protocol (HCP)
  async getHCP(hcpId: string, userId: string): Promise<HumanContextProtocol | null> {
    const { data, error } = await this.db
      .from('human_context_protocols')
      .select('*')
      .eq('hcp_id', hcpId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch HCP');
    }

    return data ? this.hcpToDomain(data) : null;
  }

  async listHCPs(userId: string, ecosystemId?: string): Promise<HumanContextProtocol[]> {
    let query = this.db
      .from('human_context_protocols')
      .select('*')
      .eq('user_id', userId);

    if (ecosystemId) {
      query = query.eq('ecosystem_id', ecosystemId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'list HCPs');
    }

    return (data || []).map(this.hcpToDomain);
  }

  async createHCP(userId: string, hcp: Partial<HumanContextProtocol>): Promise<HumanContextProtocol> {
    const { data, error } = await this.db
      .from('human_context_protocols')
      .insert({
        user_id: userId,
        ecosystem_id: hcp.ecosystemId,
        hcp_id: hcp.hcpId,
        title: hcp.title,
        version: hcp.version || '1.0.0',
        owner_name: hcp.ownerName,
        owner_uri: hcp.ownerUri,
        steward_name: hcp.stewardName,
        steward_uri: hcp.stewardUri,
        validity_from: hcp.validityFrom || new Date().toISOString(),
        validity_to: hcp.validityTo,
        timezone: hcp.timezone || 'UTC',
        identity: hcp.identity || {},
        context: hcp.context || {},
        resources: hcp.resources || {},
        rules: hcp.rules || [],
        preferences: hcp.preferences || {},
        delegation: hcp.delegation || {},
        audit: hcp.audit || [],
        mesh: hcp.mesh || {},
        obc_map: hcp.obcMap || {},
        metadata: hcp.metadata,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create HCP');
    }

    return this.hcpToDomain(data);
  }

  // Agent Context Protocol (ACP)
  async getACP(acpId: string, userId: string): Promise<AgentContextProtocol | null> {
    const { data, error } = await this.db
      .from('agent_context_protocols')
      .select('*')
      .eq('acp_id', acpId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch ACP');
    }

    return data ? this.acpToDomain(data) : null;
  }

  async listACPs(userId: string, agentType?: string): Promise<AgentContextProtocol[]> {
    let query = this.db
      .from('agent_context_protocols')
      .select('*')
      .eq('user_id', userId);

    if (agentType) {
      query = query.eq('agent_type', agentType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'list ACPs');
    }

    return (data || []).map(this.acpToDomain);
  }

  async createACP(userId: string, acp: Partial<AgentContextProtocol>): Promise<AgentContextProtocol> {
    const { data, error } = await this.db
      .from('agent_context_protocols')
      .insert({
        user_id: userId,
        ecosystem_id: acp.ecosystemId,
        hcp_id: acp.hcpId,
        acp_id: acp.acpId,
        agent_type: acp.agentType,
        title: acp.title,
        version: acp.version || '1.0.0',
        capabilities: acp.capabilities || [],
        constraints: acp.constraints || {},
        domain_restrictions: acp.domainRestrictions || [],
        oversight_level: acp.oversightLevel || 'notification',
        policy_references: acp.policyReferences || [],
        risk_score: acp.riskScore || 50,
        allowed_protocols: acp.allowedProtocols || [],
        data_access_scope: acp.dataAccessScope || {},
        metadata: acp.metadata,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create ACP');
    }

    return this.acpToDomain(data);
  }

  // Business Context Protocol (BCP)
  async getBCP(bcpId: string, userId: string): Promise<BusinessContextProtocol | null> {
    const { data, error } = await this.db
      .from('business_context_protocols')
      .select('*')
      .eq('bcp_id', bcpId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch BCP');
    }

    return data ? this.bcpToDomain(data) : null;
  }

  // Geographical Context Protocol (GeoCP)
  async getGeoCP(geocpId: string, userId: string): Promise<GeographicalContextProtocol | null> {
    const { data, error } = await this.db
      .from('geographical_context_protocols')
      .select('*')
      .eq('geocp_id', geocpId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch GeoCP');
    }

    return data ? this.geocpToDomain(data) : null;
  }

  async createGeoCP(userId: string, geocp: Partial<GeographicalContextProtocol>): Promise<GeographicalContextProtocol> {
    const { data, error } = await this.db
      .from('geographical_context_protocols')
      .insert({
        user_id: userId,
        ecosystem_id: geocp.ecosystemId,
        geocp_id: geocp.geocpId,
        title: geocp.title,
        version: geocp.version || '1.0.0',
        country_code: geocp.countryCode,
        region: geocp.region,
        jurisdiction: geocp.jurisdiction,
        data_sovereignty_rules: geocp.dataSovereigntyRules || [],
        compliance_requirements: geocp.complianceRequirements || [],
        cross_border_restrictions: geocp.crossBorderRestrictions || {},
        allowed_regions: geocp.allowedRegions || [],
        prohibited_regions: geocp.prohibitedRegions || [],
        metadata: geocp.metadata,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'create GeoCP');
    }

    return this.geocpToDomain(data);
  }

  // Data Context Protocol (DCP)
  async getDCP(dcpId: string, userId: string): Promise<DataContextProtocol | null> {
    const { data, error } = await this.db
      .from('data_context_protocols')
      .select('*')
      .eq('dcp_id', dcpId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch DCP');
    }

    return data ? this.dcpToDomain(data) : null;
  }

  // Test Context Protocol (TCP)
  async getTCP(tcpId: string, userId: string): Promise<TestContextProtocol | null> {
    const { data, error } = await this.db
      .from('test_context_protocols')
      .select('*')
      .eq('tcp_id', tcpId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      this.handleError(error, 'fetch TCP');
    }

    return data ? this.tcpToDomain(data) : null;
  }

  // Domain Mappers
  private hcpToDomain(row: any): HumanContextProtocol {
    return {
      id: row.id,
      userId: row.user_id,
      ecosystemId: row.ecosystem_id,
      hcpId: row.hcp_id,
      title: row.title,
      version: row.version,
      ownerName: row.owner_name,
      ownerUri: row.owner_uri,
      stewardName: row.steward_name,
      stewardUri: row.steward_uri,
      validityFrom: row.validity_from,
      validityTo: row.validity_to,
      timezone: row.timezone,
      identity: row.identity || {},
      context: row.context || {},
      resources: row.resources || {},
      rules: row.rules || [],
      preferences: row.preferences || {},
      delegation: row.delegation || {},
      audit: row.audit || [],
      mesh: row.mesh || {},
      obcMap: row.obc_map || {},
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private acpToDomain(row: any): AgentContextProtocol {
    return {
      id: row.id,
      userId: row.user_id,
      ecosystemId: row.ecosystem_id,
      hcpId: row.hcp_id,
      acpId: row.acp_id,
      agentType: row.agent_type,
      title: row.title,
      version: row.version,
      capabilities: row.capabilities || [],
      constraints: row.constraints || {},
      domainRestrictions: row.domain_restrictions || [],
      oversightLevel: row.oversight_level,
      policyReferences: row.policy_references || [],
      riskScore: row.risk_score,
      allowedProtocols: row.allowed_protocols || [],
      dataAccessScope: row.data_access_scope || {},
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private bcpToDomain(row: any): BusinessContextProtocol {
    return {
      id: row.id,
      userId: row.user_id,
      ecosystemId: row.ecosystem_id,
      bcpId: row.bcp_id,
      title: row.title,
      version: row.version,
      ownerName: row.owner_name,
      ownerUri: row.owner_uri,
      validityFrom: row.validity_from,
      validityTo: row.validity_to,
      customerSegments: row.customer_segments || [],
      valuePropositions: row.value_propositions || [],
      channels: row.channels || [],
      customerRelationships: row.customer_relationships || [],
      revenueStreams: row.revenue_streams || [],
      keyResources: row.key_resources || [],
      keyActivities: row.key_activities || [],
      keyPartners: row.key_partners || [],
      costStructure: row.cost_structure || [],
      metrics: row.metrics || {},
      linkedHcpId: row.linked_hcp_id,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private geocpToDomain(row: any): GeographicalContextProtocol {
    return {
      id: row.id,
      userId: row.user_id,
      ecosystemId: row.ecosystem_id,
      geocpId: row.geocp_id,
      title: row.title,
      version: row.version,
      countryCode: row.country_code,
      region: row.region,
      jurisdiction: row.jurisdiction,
      dataSovereigntyRules: row.data_sovereignty_rules || [],
      complianceRequirements: row.compliance_requirements || [],
      crossBorderRestrictions: row.cross_border_restrictions || {},
      allowedRegions: row.allowed_regions || [],
      prohibitedRegions: row.prohibited_regions || [],
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private dcpToDomain(row: any): DataContextProtocol {
    return {
      id: row.id,
      userId: row.user_id,
      ecosystemId: row.ecosystem_id,
      dcpId: row.dcp_id,
      title: row.title,
      version: row.version,
      ownerName: row.owner_name,
      ownerUri: row.owner_uri,
      domain: row.domain,
      dataProducts: row.data_products || [],
      contracts: row.contracts || {},
      ports: row.ports || [],
      storage: row.storage || {},
      slas: row.slas || {},
      policies: row.policies || [],
      linkedHcpId: row.linked_hcp_id,
      linkedBcpId: row.linked_bcp_id,
      linkedMcpId: row.linked_mcp_id,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private tcpToDomain(row: any): TestContextProtocol {
    return {
      id: row.id,
      userId: row.user_id,
      ecosystemId: row.ecosystem_id,
      tcpId: row.tcp_id,
      title: row.title,
      version: row.version,
      ownerName: row.owner_name,
      ownerUri: row.owner_uri,
      baseline: row.baseline || {},
      monitoring: row.monitoring || {},
      driftConfig: row.drift_config || {},
      alerting: row.alerting || {},
      linkedDcpId: row.linked_dcp_id,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
