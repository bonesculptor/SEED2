# SEED Framework - Reusable Agent Governance System

**Version**: 1.0.0
**License**: MIT

## Overview

The SEED (Systemic, Ecological, Evolutionary, Domain-driven) Framework is a reusable system for implementing sophisticated agent governance and protocol-based constraint management in any application domain.

## Architecture

### Three-Tier Governance

1. **Tier 1: Individual Agents**
   - Autonomous agents with specific capabilities
   - Constrained by policies at multiple levels
   - Auditable actions and decisions

2. **Tier 2: Agent Ensembles**
   - Coordinated groups of agents working together
   - Shared context and resources
   - Emergent capabilities through collaboration

3. **Tier 3: Co-Evolving Ecosystem (GCP)**
   - System-wide governance and evolution
   - Cross-domain learning and adaptation
   - Industry-specific constraints via GICS

### Protocol Hierarchy

#### Domain & Human Context Layer
- **HCP (Human Context Protocol)** - User identity, preferences, delegation
- **ACP (Agent Context Protocol)** - Agent capabilities and constraints

#### Business & Organizational Layer
- **BCP (Business Context Protocol)** - Business model, value propositions
- **MCP (Machine Context Protocol)** - ML pipelines, models, deployment

#### Infrastructure & Environment Layer
- **GeoCP (Geographical Context Protocol)** - Location, jurisdiction, compliance
- **DCP (Data Context Protocol)** - Data products, contracts, governance
- **TCP (Test Context Protocol)** - Testing, monitoring, drift detection
- **GCP/ECP (Ecosystem Context Protocol)** - Industry classification, regulations

## Installation

### Prerequisites

- Node.js 18+
- TypeScript 5+
- Supabase account
- PostgreSQL database

### Steps

1. **Apply Database Schema**
   ```bash
   # Run the migration file on your Supabase instance
   psql -h <host> -U <user> -d <database> -f database/seed_framework_schema.sql
   ```

2. **Install TypeScript Dependencies**
   ```bash
   npm install @supabase/supabase-js
   ```

3. **Copy Framework Files**
   ```bash
   cp -r repositories/ src/domain/repositories/
   cp -r services/ src/services/
   ```

4. **Configure Supabase Client**
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_ANON_KEY
   );
   ```

## Usage

### 1. Create an Ecosystem

```typescript
import { AgentGovernanceRepository } from './domain/repositories/AgentGovernanceRepository';
import { supabase } from './lib/supabase';

const governanceRepo = new AgentGovernanceRepository(supabase);

const ecosystem = await governanceRepo.createEcosystem(userId, {
  gcpId: 'healthcare-ecosystem-v1',
  name: 'Healthcare Ecosystem',
  version: '1.0.0',
  domainClassification: 'healthcare',
  regulatoryEnvironment: ['HIPAA', 'GDPR'],
  industryConstraints: {
    dataRetention: '7 years',
    encryptionRequired: true
  },
  learningEnabled: true
});
```

### 2. Define Protocols

```typescript
import { ProtocolRepository } from './domain/repositories/ProtocolRepository';

const protocolRepo = new ProtocolRepository(supabase);

// Create Human Context Protocol
const hcp = await protocolRepo.createHCP(userId, {
  hcpId: 'user-john-hcp-v1',
  title: 'John Doe Personal Context',
  version: '1.0.0',
  ownerName: 'John Doe',
  validityFrom: new Date().toISOString(),
  identity: { role: 'patient', verified: true },
  preferences: { dataSharing: 'restricted' }
});

// Create Agent Context Protocol
const acp = await protocolRepo.createACP(userId, {
  acpId: 'medical-analyzer-acp-v1',
  agentType: 'medical_analyzer',
  title: 'Medical Record Analyzer',
  version: '1.0.0',
  capabilities: ['read_medical_records', 'analyze_patterns'],
  oversightLevel: 'continuous',
  riskScore: 40
});
```

### 3. Register Agents

```typescript
const agent = await governanceRepo.createAgent(userId, {
  agentId: 'medical-analyzer-001',
  name: 'Medical Record Analyzer Agent',
  agentType: 'medical_analyzer',
  version: '1.0.0',
  ecosystemId: ecosystem.id,
  acpId: acp.id,
  capabilities: ['medical_analysis', 'pattern_detection'],
  supportedProtocols: ['HCP', 'ACP', 'DCP', 'GeoCP'],
  oversightLevel: 'continuous'
});
```

### 4. Select Agents with Protocol Constraints

```typescript
import { AgentSelectionService } from './services/AgentSelectionService';

const selectionService = new AgentSelectionService(supabase);

const result = await selectionService.selectAgent({
  userId,
  ecosystemId: ecosystem.id,
  hcpId: hcp.id,
  acpId: acp.id,
  agentType: 'medical_analyzer',
  requiredCapabilities: ['medical_analysis'],
  maxRiskScore: 50
});

if (result) {
  console.log(`Selected agent: ${result.agent.name}`);
  console.log(`Match score: ${result.matchScore}`);
  console.log(`Reasoning: ${result.selectionReasoning}`);
}
```

### 5. Evaluate Policies Before Execution

```typescript
const policyResult = await selectionService.evaluatePolicies(
  agent.agentId,
  userId,
  'read_medical_records',
  {
    userId,
    hcpId: hcp.id,
    acpId: acp.id,
    dcpId: dcp.id,
    geocpId: geocp.id
  }
);

if (policyResult.passed) {
  // Execute agent operation
} else {
  console.error('Policy violations:', policyResult.violatedPolicies);
  console.error('Risk assessment:', policyResult.riskAssessment);
}
```

## Framework Components

### Repositories
- `BaseRepository.ts` - Base repository with error handling
- `ProtocolRepository.ts` - All protocol CRUD operations
- `AgentGovernanceRepository.ts` - Agent, ensemble, and ecosystem management

### Services
- `AgentSelectionService.ts` - Three-tier protocol-based agent selection

### Database Schema
- `seed_framework_schema.sql` - Complete PostgreSQL schema with RLS

## Domain Constraints

The framework supports GICS (Global Industry Classification Standard) for domain-specific constraints:

```typescript
const gics = await governanceRepo.createGICSClassification(userId, {
  sectorCode: '35',
  sectorName: 'Health Care',
  industryCode: '351010',
  industryName: 'Health Care Equipment & Supplies',
  regulatoryRequirements: ['HIPAA', 'FDA'],
  applicableStandards: ['HL7 FHIR', 'DICOM']
});

// Link ecosystem to GICS
ecosystem.gicsId = gics.id;
```

## Security

All database tables use Row Level Security (RLS) with policies ensuring:
- Users can only access their own data
- All operations require authentication
- Protocol validations are enforced
- Audit trails are maintained

## Extension Points

The framework is designed to be extended:

1. **Custom Protocol Types** - Add new protocol tables following the same pattern
2. **Custom Validators** - Implement protocol-specific validation logic
3. **Custom Selectors** - Extend agent selection with domain-specific scoring
4. **Custom Constraints** - Add industry-specific governance rules

## License

MIT License - See LICENSE file for details

## Support

For questions and issues, please refer to the documentation or contact the framework maintainers.
