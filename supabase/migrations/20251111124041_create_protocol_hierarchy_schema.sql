/*
  # SEED Architecture - Protocol Hierarchy & Three-Tier Governance
  
  ## Overview
  Implements the SEED (Systemic, Ecological, Evolutionary, Domain-driven) architecture
  with three-tier agent governance and protocol-based constraint system.
  
  ## Three-Tier Governance Structure
  
  ### Tier 1: Individual Agents
  - Autonomous agents with specific capabilities
  - Constrained by policies at multiple levels
  - Auditable actions and decisions
  
  ### Tier 2: Agent Ensembles
  - Coordinated groups of agents working together
  - Shared context and resources
  - Emergent capabilities through collaboration
  
  ### Tier 3: Co-Evolving Ecosystem (GCP)
  - System-wide governance and evolution
  - Cross-domain learning and adaptation
  - Industry-specific constraints via GICS
  
  ## Protocol Hierarchy (Three-Tier Selection)
  
  ### Domain & Human Context Layer
  1. **HCP (Human Context Protocol)** - User identity, preferences, delegation
  2. **ACP (Agent Context Protocol)** - Agent capabilities and constraints
  
  ### Business & Organizational Layer
  3. **BCP (Business Context Protocol)** - Business model, value propositions
  4. **MCP (Machine Context Protocol)** - ML pipelines, models, deployment
  
  ### Infrastructure & Environment Layer
  5. **GeoCP (Geographical Context Protocol)** - Location, jurisdiction, compliance
  6. **DCP (Data Context Protocol)** - Data products, contracts, governance
  7. **TCP (Test Context Protocol)** - Testing, monitoring, drift detection
  8. **ECP (Ecosystem Context Protocol)** - Industry classification, regulations
  
  ## New Tables
  
  ### Protocol Tables
  - human_context_protocols (HCP)
  - agent_context_protocols (ACP)
  - business_context_protocols (BCP)
  - machine_context_protocols (MCP)
  - geographical_context_protocols (GeoCP)
  - data_context_protocols (DCP)
  - test_context_protocols (TCP)
  - ecosystem_context_protocols (ECP/GCP)
  
  ### Governance Tables
  - agent_definitions (Tier 1: Individual agents)
  - agent_ensembles (Tier 2: Coordinated groups)
  - ecosystem_environments (Tier 3: System-wide governance)
  - protocol_links (Cross-protocol relationships)
  - protocol_validations (Compliance checking)
  
  ### GICS Industry Classification
  - gics_classifications (Industry sectors for domain constraints)
  
  ## Security
  
  All tables have RLS enabled with authenticated-only access.
  Users can only access protocols and agents within their authorized domains.
*/

-- =============================================
-- GICS Industry Classification (Domain Constraints)
-- =============================================

CREATE TABLE IF NOT EXISTS gics_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- GICS Hierarchy
  sector_code text NOT NULL CHECK (length(sector_code) = 2),
  sector_name text NOT NULL,
  industry_group_code text CHECK (length(industry_group_code) = 4),
  industry_group_name text,
  industry_code text CHECK (length(industry_code) = 6),
  industry_name text,
  sub_industry_code text CHECK (length(sub_industry_code) = 8),
  sub_industry_name text,
  
  -- Healthcare is sector 35
  is_healthcare boolean GENERATED ALWAYS AS (sector_code = '35') STORED,
  
  -- Metadata
  description text,
  regulatory_requirements jsonb DEFAULT '[]',
  applicable_standards jsonb DEFAULT '[]',
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gics_classifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GICS classifications"
  ON gics_classifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own GICS classifications"
  ON gics_classifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_gics_user_id ON gics_classifications(user_id);
CREATE INDEX idx_gics_sector ON gics_classifications(sector_code);
CREATE INDEX idx_gics_healthcare ON gics_classifications(is_healthcare);

-- =============================================
-- Tier 3: Ecosystem Environment (GCP)
-- =============================================

CREATE TABLE IF NOT EXISTS ecosystem_environments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gics_id uuid REFERENCES gics_classifications(id) ON DELETE CASCADE,
  
  -- Identification
  gcp_id text NOT NULL UNIQUE,
  name text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  
  -- Ecosystem Configuration
  domain_classification text NOT NULL, -- 'healthcare', 'finance', etc.
  regulatory_environment jsonb NOT NULL DEFAULT '[]',
  industry_constraints jsonb NOT NULL DEFAULT '{}',
  
  -- Evolution & Learning
  evolution_strategy text NOT NULL DEFAULT 'supervised',
  learning_enabled boolean NOT NULL DEFAULT true,
  adaptation_rate numeric CHECK (adaptation_rate BETWEEN 0 AND 1),
  
  -- Cross-Domain Governance
  inter_domain_policies jsonb NOT NULL DEFAULT '[]',
  knowledge_sharing_rules jsonb NOT NULL DEFAULT '{}',
  
  -- Ecosystem Health
  health_status text NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'degraded', 'critical')),
  last_evolution_at timestamptz,
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ecosystem_environments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ecosystems"
  ON ecosystem_environments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own ecosystems"
  ON ecosystem_environments FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ecosystem_user_id ON ecosystem_environments(user_id);
CREATE INDEX idx_ecosystem_gcp_id ON ecosystem_environments(gcp_id);
CREATE INDEX idx_ecosystem_domain ON ecosystem_environments(domain_classification);

-- =============================================
-- Human Context Protocol (HCP) - Domain Layer
-- =============================================

CREATE TABLE IF NOT EXISTS human_context_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ecosystem_id uuid REFERENCES ecosystem_environments(id) ON DELETE CASCADE,
  
  -- Identification
  hcp_id text NOT NULL UNIQUE,
  title text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  
  -- Ownership & Stewardship
  owner_name text NOT NULL,
  owner_uri text,
  steward_name text,
  steward_uri text,
  
  -- Validity
  validity_from timestamptz NOT NULL DEFAULT now(),
  validity_to timestamptz,
  timezone text DEFAULT 'UTC',
  
  -- Core Contexts (as per HCP specification)
  identity jsonb NOT NULL DEFAULT '{}', -- User identity, roles, credentials
  context jsonb NOT NULL DEFAULT '{}', -- Domain context, location, situation
  resources jsonb NOT NULL DEFAULT '{}', -- Available resources, capabilities
  rules jsonb NOT NULL DEFAULT '[]', -- Business rules, constraints
  preferences jsonb NOT NULL DEFAULT '{}', -- User preferences, settings
  delegation jsonb NOT NULL DEFAULT '{}', -- Delegation rules, proxies
  audit jsonb NOT NULL DEFAULT '[]', -- Audit trail
  mesh jsonb NOT NULL DEFAULT '{}', -- Data mesh configuration
  obc_map jsonb NOT NULL DEFAULT '{}', -- Ontology-based computing map
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE human_context_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own HCP"
  ON human_context_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own HCP"
  ON human_context_protocols FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_hcp_user_id ON human_context_protocols(user_id);
CREATE INDEX idx_hcp_id ON human_context_protocols(hcp_id);
CREATE INDEX idx_hcp_ecosystem ON human_context_protocols(ecosystem_id);

-- =============================================
-- Agent Context Protocol (ACP) - Domain Layer
-- =============================================

CREATE TABLE IF NOT EXISTS agent_context_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ecosystem_id uuid REFERENCES ecosystem_environments(id) ON DELETE CASCADE,
  hcp_id uuid REFERENCES human_context_protocols(id) ON DELETE CASCADE,
  
  -- Identification
  acp_id text NOT NULL UNIQUE,
  agent_type text NOT NULL,
  title text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  
  -- Capabilities
  capabilities jsonb NOT NULL DEFAULT '[]',
  constraints jsonb NOT NULL DEFAULT '{}',
  domain_restrictions jsonb NOT NULL DEFAULT '[]',
  
  -- Governance
  oversight_level text NOT NULL DEFAULT 'notification' 
    CHECK (oversight_level IN ('none', 'notification', 'approval', 'continuous')),
  policy_references text[] NOT NULL DEFAULT '{}',
  risk_score integer NOT NULL DEFAULT 50 CHECK (risk_score BETWEEN 0 AND 100),
  
  -- Resource Access
  allowed_protocols text[] NOT NULL DEFAULT '{}',
  data_access_scope jsonb NOT NULL DEFAULT '{}',
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_context_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ACP"
  ON agent_context_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own ACP"
  ON agent_context_protocols FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_acp_user_id ON agent_context_protocols(user_id);
CREATE INDEX idx_acp_agent_type ON agent_context_protocols(agent_type);
CREATE INDEX idx_acp_ecosystem ON agent_context_protocols(ecosystem_id);

-- =============================================
-- Business Context Protocol (BCP) - Business Layer
-- =============================================

CREATE TABLE IF NOT EXISTS business_context_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ecosystem_id uuid REFERENCES ecosystem_environments(id) ON DELETE CASCADE,
  
  -- Identification
  bcp_id text NOT NULL UNIQUE,
  title text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  
  -- Ownership
  owner_name text NOT NULL,
  owner_uri text,
  
  -- Validity
  validity_from timestamptz NOT NULL DEFAULT now(),
  validity_to timestamptz,
  
  -- Business Model Canvas
  customer_segments jsonb NOT NULL DEFAULT '[]',
  value_propositions jsonb NOT NULL DEFAULT '[]',
  channels jsonb NOT NULL DEFAULT '[]',
  customer_relationships jsonb NOT NULL DEFAULT '[]',
  revenue_streams jsonb NOT NULL DEFAULT '[]',
  key_resources jsonb NOT NULL DEFAULT '[]',
  key_activities jsonb NOT NULL DEFAULT '[]',
  key_partners jsonb NOT NULL DEFAULT '[]',
  cost_structure jsonb NOT NULL DEFAULT '[]',
  
  -- Metrics & KPIs
  metrics jsonb NOT NULL DEFAULT '{}',
  
  -- Protocol Links
  linked_hcp_id uuid REFERENCES human_context_protocols(id),
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE business_context_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own BCP"
  ON business_context_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own BCP"
  ON business_context_protocols FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_bcp_user_id ON business_context_protocols(user_id);
CREATE INDEX idx_bcp_id ON business_context_protocols(bcp_id);

-- =============================================
-- Machine Context Protocol (MCP) - Business Layer
-- =============================================

CREATE TABLE IF NOT EXISTS machine_context_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ecosystem_id uuid REFERENCES ecosystem_environments(id) ON DELETE CASCADE,
  
  -- Identification
  mcp_id text NOT NULL UNIQUE,
  title text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  
  -- Ownership
  owner_name text NOT NULL,
  owner_uri text,
  
  -- ML Pipeline Configuration
  pipeline jsonb NOT NULL DEFAULT '{}',
  tasks jsonb NOT NULL DEFAULT '[]',
  models jsonb NOT NULL DEFAULT '[]',
  deployment jsonb NOT NULL DEFAULT '{}',
  monitoring jsonb NOT NULL DEFAULT '{}',
  
  -- Protocol Links
  linked_hcp_id uuid REFERENCES human_context_protocols(id),
  linked_bcp_id uuid REFERENCES business_context_protocols(id),
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE machine_context_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own MCP"
  ON machine_context_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own MCP"
  ON machine_context_protocols FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_mcp_user_id ON machine_context_protocols(user_id);
CREATE INDEX idx_mcp_id ON machine_context_protocols(mcp_id);

-- =============================================
-- Geographical Context Protocol (GeoCP) - Infrastructure Layer
-- =============================================

CREATE TABLE IF NOT EXISTS geographical_context_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ecosystem_id uuid REFERENCES ecosystem_environments(id) ON DELETE CASCADE,
  
  -- Identification
  geocp_id text NOT NULL UNIQUE,
  title text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  
  -- Geographic Information
  country_code text NOT NULL CHECK (length(country_code) = 2),
  region text,
  jurisdiction text NOT NULL,
  
  -- Regulatory Environment
  data_sovereignty_rules jsonb NOT NULL DEFAULT '[]',
  compliance_requirements jsonb NOT NULL DEFAULT '[]',
  cross_border_restrictions jsonb NOT NULL DEFAULT '{}',
  
  -- Data Residency
  allowed_regions text[] NOT NULL DEFAULT '{}',
  prohibited_regions text[] NOT NULL DEFAULT '{}',
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE geographical_context_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GeoCP"
  ON geographical_context_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own GeoCP"
  ON geographical_context_protocols FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_geocp_user_id ON geographical_context_protocols(user_id);
CREATE INDEX idx_geocp_country ON geographical_context_protocols(country_code);

-- =============================================
-- Data Context Protocol (DCP) - Infrastructure Layer
-- =============================================

CREATE TABLE IF NOT EXISTS data_context_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ecosystem_id uuid REFERENCES ecosystem_environments(id) ON DELETE CASCADE,
  
  -- Identification
  dcp_id text NOT NULL UNIQUE,
  title text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  
  -- Ownership
  owner_name text NOT NULL,
  owner_uri text,
  
  -- Domain
  domain text NOT NULL,
  
  -- Data Products
  data_products jsonb NOT NULL DEFAULT '[]',
  contracts jsonb NOT NULL DEFAULT '{}',
  ports jsonb NOT NULL DEFAULT '[]',
  
  -- Storage & Quality
  storage jsonb NOT NULL DEFAULT '{}',
  slas jsonb NOT NULL DEFAULT '{}',
  policies jsonb NOT NULL DEFAULT '[]',
  
  -- Protocol Links
  linked_hcp_id uuid REFERENCES human_context_protocols(id),
  linked_bcp_id uuid REFERENCES business_context_protocols(id),
  linked_mcp_id uuid REFERENCES machine_context_protocols(id),
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE data_context_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own DCP"
  ON data_context_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own DCP"
  ON data_context_protocols FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_dcp_user_id ON data_context_protocols(user_id);
CREATE INDEX idx_dcp_id ON data_context_protocols(dcp_id);
CREATE INDEX idx_dcp_domain ON data_context_protocols(domain);

-- =============================================
-- Test Context Protocol (TCP) - Infrastructure Layer
-- =============================================

CREATE TABLE IF NOT EXISTS test_context_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ecosystem_id uuid REFERENCES ecosystem_environments(id) ON DELETE CASCADE,
  
  -- Identification
  tcp_id text NOT NULL UNIQUE,
  title text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  
  -- Ownership
  owner_name text NOT NULL,
  owner_uri text,
  
  -- Testing Configuration
  baseline jsonb NOT NULL DEFAULT '{}',
  monitoring jsonb NOT NULL DEFAULT '{}',
  drift_config jsonb NOT NULL DEFAULT '{}',
  alerting jsonb NOT NULL DEFAULT '{}',
  
  -- Protocol Links
  linked_dcp_id uuid REFERENCES data_context_protocols(id),
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE test_context_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own TCP"
  ON test_context_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own TCP"
  ON test_context_protocols FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_tcp_user_id ON test_context_protocols(user_id);
CREATE INDEX idx_tcp_id ON test_context_protocols(tcp_id);

-- =============================================
-- Tier 1: Individual Agent Definitions
-- =============================================

CREATE TABLE IF NOT EXISTS agent_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acp_id uuid REFERENCES agent_context_protocols(id) ON DELETE CASCADE,
  ecosystem_id uuid REFERENCES ecosystem_environments(id) ON DELETE CASCADE,
  
  -- Identification
  agent_id text NOT NULL UNIQUE,
  name text NOT NULL,
  agent_type text NOT NULL,
  version text NOT NULL DEFAULT '1.0.0',
  
  -- Capabilities
  capabilities jsonb NOT NULL DEFAULT '[]',
  supported_protocols text[] NOT NULL DEFAULT '{}',
  
  -- Domain Constraints (via GICS)
  gics_id uuid REFERENCES gics_classifications(id),
  domain_restrictions jsonb NOT NULL DEFAULT '[]',
  
  -- Configuration
  config jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  
  -- Governance
  oversight_level text NOT NULL DEFAULT 'notification',
  approval_required boolean NOT NULL DEFAULT false,
  audit_level text NOT NULL DEFAULT 'standard',
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agents"
  ON agent_definitions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own agents"
  ON agent_definitions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_agent_user_id ON agent_definitions(user_id);
CREATE INDEX idx_agent_type ON agent_definitions(agent_type);
CREATE INDEX idx_agent_ecosystem ON agent_definitions(ecosystem_id);
CREATE INDEX idx_agent_gics ON agent_definitions(gics_id);

-- =============================================
-- Tier 2: Agent Ensembles
-- =============================================

CREATE TABLE IF NOT EXISTS agent_ensembles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ecosystem_id uuid NOT NULL REFERENCES ecosystem_environments(id) ON DELETE CASCADE,
  
  -- Identification
  ensemble_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  
  -- Member Agents
  member_agent_ids uuid[] NOT NULL DEFAULT '{}',
  coordination_strategy text NOT NULL DEFAULT 'sequential' 
    CHECK (coordination_strategy IN ('sequential', 'parallel', 'conditional', 'collaborative')),
  
  -- Shared Context
  shared_context jsonb NOT NULL DEFAULT '{}',
  communication_protocol text NOT NULL DEFAULT 'message_passing',
  
  -- Emergent Capabilities
  emergent_capabilities jsonb NOT NULL DEFAULT '[]',
  performance_metrics jsonb NOT NULL DEFAULT '{}',
  
  -- Governance
  ensemble_policies jsonb NOT NULL DEFAULT '[]',
  conflict_resolution text NOT NULL DEFAULT 'priority_based',
  
  -- Status
  is_active boolean NOT NULL DEFAULT true,
  last_coordination_at timestamptz,
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_ensembles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ensembles"
  ON agent_ensembles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own ensembles"
  ON agent_ensembles FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ensemble_user_id ON agent_ensembles(user_id);
CREATE INDEX idx_ensemble_ecosystem ON agent_ensembles(ecosystem_id);

-- =============================================
-- Protocol Links (Cross-Protocol Relationships)
-- =============================================

CREATE TABLE IF NOT EXISTS protocol_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source Protocol
  source_type text NOT NULL CHECK (source_type IN ('HCP', 'ACP', 'BCP', 'MCP', 'GeoCP', 'DCP', 'TCP', 'GCP')),
  source_id uuid NOT NULL,
  
  -- Target Protocol
  target_type text NOT NULL CHECK (target_type IN ('HCP', 'ACP', 'BCP', 'MCP', 'GeoCP', 'DCP', 'TCP', 'GCP')),
  target_id uuid NOT NULL,
  
  -- Relationship
  relationship_type text NOT NULL,
  relationship_metadata jsonb,
  
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT no_self_link CHECK (NOT (source_type = target_type AND source_id = target_id))
);

ALTER TABLE protocol_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own protocol links"
  ON protocol_links FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own protocol links"
  ON protocol_links FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_protocol_link_source ON protocol_links(source_type, source_id);
CREATE INDEX idx_protocol_link_target ON protocol_links(target_type, target_id);

-- =============================================
-- Protocol Validations
-- =============================================

CREATE TABLE IF NOT EXISTS protocol_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Protocol Being Validated
  protocol_type text NOT NULL CHECK (protocol_type IN ('HCP', 'ACP', 'BCP', 'MCP', 'GeoCP', 'DCP', 'TCP', 'GCP')),
  protocol_id uuid NOT NULL,
  
  -- Validation Results
  validation_timestamp timestamptz NOT NULL DEFAULT now(),
  conforms boolean NOT NULL,
  validation_results jsonb NOT NULL DEFAULT '{}',
  
  -- Validator
  validator_version text,
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE protocol_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own validations"
  ON protocol_validations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create validations"
  ON protocol_validations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_validation_protocol ON protocol_validations(protocol_type, protocol_id);
CREATE INDEX idx_validation_timestamp ON protocol_validations(validation_timestamp DESC);

-- =============================================
-- Agent Jobs (with Protocol Constraints)
-- =============================================

CREATE TABLE IF NOT EXISTS agent_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agent_definitions(id) ON DELETE CASCADE,
  ensemble_id uuid REFERENCES agent_ensembles(id) ON DELETE CASCADE,
  
  -- Protocol Context (Three-Tier Selection)
  hcp_id uuid REFERENCES human_context_protocols(id),
  bcp_id uuid REFERENCES business_context_protocols(id),
  geocp_id uuid REFERENCES geographical_context_protocols(id),
  dcp_id uuid REFERENCES data_context_protocols(id),
  tcp_id uuid REFERENCES test_context_protocols(id),
  
  -- Job Details
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'policy_check', 'approved', 'running', 'completed', 'failed', 'cancelled')),
  input_data jsonb,
  output_data jsonb,
  error_message text,
  
  -- Governance
  policy_check_passed boolean,
  policies_evaluated text[],
  approval_status text CHECK (approval_status IN ('not_required', 'pending', 'approved', 'denied')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  
  -- Execution
  started_at timestamptz,
  completed_at timestamptz,
  execution_time_ms integer,
  
  -- Audit
  records_accessed integer DEFAULT 0,
  records_modified integer DEFAULT 0,
  phi_accessed boolean DEFAULT false,
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agent_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent jobs"
  ON agent_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create agent jobs"
  ON agent_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent jobs"
  ON agent_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_agent_job_user_id ON agent_jobs(user_id);
CREATE INDEX idx_agent_job_agent_id ON agent_jobs(agent_id);
CREATE INDEX idx_agent_job_status ON agent_jobs(status);
CREATE INDEX idx_agent_job_created ON agent_jobs(created_at DESC);

-- =============================================
-- Updated At Triggers
-- =============================================

CREATE TRIGGER update_gics_updated_at BEFORE UPDATE ON gics_classifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ecosystem_updated_at BEFORE UPDATE ON ecosystem_environments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hcp_updated_at BEFORE UPDATE ON human_context_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_acp_updated_at BEFORE UPDATE ON agent_context_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bcp_updated_at BEFORE UPDATE ON business_context_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mcp_updated_at BEFORE UPDATE ON machine_context_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geocp_updated_at BEFORE UPDATE ON geographical_context_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dcp_updated_at BEFORE UPDATE ON data_context_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tcp_updated_at BEFORE UPDATE ON test_context_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_updated_at BEFORE UPDATE ON agent_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ensemble_updated_at BEFORE UPDATE ON agent_ensembles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();