# Agent Support Implementation Roadmap

**Date**: 2025-11-11
**Status**: Planning Phase
**Prerequisites**: ✅ Phase 1 Complete (Core Architecture Stable)

---

## Overview

This document outlines the plan for adding agent orchestration capabilities to the medical records system. Following the architecture review principles, we will only add agent support AFTER the core system is stable and proven to work.

---

## Current State (Phase 1 Complete)

✅ Secure database with 8 core tables
✅ Repository pattern for data access
✅ 5 core services with clean architecture
✅ Error handling and null safety
✅ Build verification passing

**Decision**: Do NOT implement agents until Phase 2 (testing & observability) is complete.

---

## Agent Requirements (From Original Model)

Based on the architecture review, the system originally planned for:

### Agent System Tables (Previously 9 tables)
- Agent definitions and configurations
- Agent execution history
- Agent orchestration and coordination
- Multi-tier agent hierarchy
- Task queues and scheduling

### Use Cases for Agents
1. **Document Processing Agent**
   - Extract medical information from uploaded PDFs
   - Parse and structure unstructured data
   - Create FHIR records automatically

2. **Medical Record Validation Agent**
   - Verify data completeness
   - Check for inconsistencies
   - Flag potential errors

3. **Graph Analysis Agent**
   - Detect patterns in medical data
   - Identify drug interactions
   - Suggest connections

4. **Notification Agent**
   - Send reminders for medications
   - Alert on critical values
   - Schedule follow-ups

5. **Reporting Agent**
   - Generate summaries
   - Create visualizations
   - Export data in various formats

---

## Implementation Phases

### Phase 2: Testing & Observability (CURRENT PRIORITY)

**Do NOT start agent work yet. First complete:**

1. ✅ Core system is stable (DONE)
2. ⏳ Add comprehensive test coverage
3. ⏳ Set up error monitoring (Sentry)
4. ⏳ Add structured logging
5. ⏳ Create staging environment
6. ⏳ Run load tests
7. ⏳ Verify all core features work

**Success Criteria**:
- 90%+ test coverage
- Zero production crashes for 30 days
- All core features tested and verified
- Performance benchmarks met

---

### Phase 3: Simple Agent Foundation (Future)

**Only start after Phase 2 is complete.**

#### 3.1 Database Schema for Agents

Create minimal agent tables:

```sql
-- Agent definitions
CREATE TABLE agent_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  agent_type text NOT NULL, -- 'document_processor', 'validator', etc.
  config jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Agent execution jobs
CREATE TABLE agent_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agent_definitions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  input_data jsonb,
  output_data jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Agent execution logs
CREATE TABLE agent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES agent_jobs(id) ON DELETE CASCADE,
  level text NOT NULL, -- info, warning, error
  message text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies (authenticated users only)
ALTER TABLE agent_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;

-- Policies omitted for brevity - follow same pattern as other tables
```

#### 3.2 Agent Repository

```typescript
// src/domain/repositories/AgentRepository.ts
export interface AgentJob {
  id: string;
  userId: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  inputData?: any;
  outputData?: any;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export class AgentRepository extends BaseRepository<AgentJob> {
  async createJob(userId: string, agentId: string, inputData: any): Promise<AgentJob> {
    // Implementation
  }

  async getJob(jobId: string, userId: string): Promise<AgentJob | null> {
    // Implementation
  }

  async updateJobStatus(
    jobId: string,
    status: string,
    outputData?: any,
    errorMessage?: string
  ): Promise<AgentJob> {
    // Implementation
  }

  async getUserJobs(userId: string): Promise<AgentJob[]> {
    // Implementation
  }
}
```

#### 3.3 Agent Service

```typescript
// src/services/AgentService.ts
export interface AgentExecutor {
  execute(input: any): Promise<any>;
}

export class AgentService {
  private executors: Map<string, AgentExecutor> = new Map();

  constructor(
    private supabaseClient: SupabaseClient,
    private repository: AgentRepository
  ) {}

  registerAgent(agentType: string, executor: AgentExecutor): void {
    this.executors.set(agentType, executor);
  }

  async runAgent(userId: string, agentType: string, inputData: any): Promise<AgentJob> {
    // Create job record
    const job = await this.repository.createJob(userId, agentType, inputData);

    // Execute in background
    this.executeJobAsync(job.id, agentType, inputData);

    return job;
  }

  private async executeJobAsync(jobId: string, agentType: string, inputData: any): Promise<void> {
    try {
      await this.repository.updateJobStatus(jobId, 'running');

      const executor = this.executors.get(agentType);
      if (!executor) {
        throw new Error(`No executor registered for agent type: ${agentType}`);
      }

      const outputData = await executor.execute(inputData);

      await this.repository.updateJobStatus(jobId, 'completed', outputData);
    } catch (error) {
      await this.repository.updateJobStatus(
        jobId,
        'failed',
        undefined,
        error.message
      );
    }
  }

  async getJobStatus(jobId: string, userId: string): Promise<AgentJob | null> {
    return this.repository.getJob(jobId, userId);
  }

  async getUserJobs(userId: string): Promise<AgentJob[]> {
    return this.repository.getUserJobs(userId);
  }
}
```

#### 3.4 Example Agent: Document Processor

```typescript
// src/agents/DocumentProcessorAgent.ts
export class DocumentProcessorAgent implements AgentExecutor {
  constructor(
    private medicalRecordService: MedicalRecordService,
    private documentService: DocumentService
  ) {}

  async execute(input: { documentId: string; userId: string }): Promise<any> {
    // 1. Get document
    const document = await this.documentService.getDocument(
      input.documentId,
      input.userId
    );

    if (!document) {
      throw new Error('Document not found');
    }

    // 2. Extract text (integrate with OCR service)
    const extractedText = await this.extractTextFromDocument(document);

    // 3. Parse medical information (integrate with LLM)
    const medicalData = await this.parseMedicalInformation(extractedText);

    // 4. Create FHIR records
    const results = {
      medications: [],
      conditions: [],
      observations: [],
    };

    for (const med of medicalData.medications || []) {
      const medication = await this.medicalRecordService.createMedication(
        input.userId,
        {
          medicationText: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
        }
      );
      results.medications.push(medication);
    }

    // Similar for conditions, observations...

    return results;
  }

  private async extractTextFromDocument(document: any): Promise<string> {
    // TODO: Integrate with OCR service
    return 'Mock extracted text';
  }

  private async parseMedicalInformation(text: string): Promise<any> {
    // TODO: Integrate with LLM for parsing
    return {
      medications: [],
      conditions: [],
      observations: [],
    };
  }
}
```

---

### Phase 4: Advanced Agent Features (Future)

**Only start after Phase 3 is proven stable.**

#### 4.1 Agent Orchestration
- Multi-step workflows
- Agent dependencies
- Conditional execution
- Parallel agent execution

#### 4.2 Agent Scheduling
- Cron-like scheduling
- Event-driven triggers
- Retry logic with exponential backoff

#### 4.3 Agent Monitoring
- Real-time status dashboard
- Performance metrics
- Cost tracking
- Error alerting

#### 4.4 Agent Coordination
- Agent-to-agent communication
- Shared context
- Transaction management
- Conflict resolution

---

## Integration Points

### With Core Services

```typescript
// In ServiceContainer
export class ServiceContainer {
  public readonly auth: AuthService;
  public readonly patient: PatientService;
  public readonly medicalRecord: MedicalRecordService;
  public readonly document: DocumentService;
  public readonly graph: GraphService;
  public readonly agent?: AgentService; // Optional, added in Phase 3

  constructor(supabaseClient: SupabaseClient) {
    this.auth = new AuthService(supabaseClient);
    this.patient = new PatientService(supabaseClient);
    this.medicalRecord = new MedicalRecordService(supabaseClient);
    this.document = new DocumentService(supabaseClient);
    this.graph = new GraphService(supabaseClient);

    // Only initialize if agent feature is enabled
    if (FEATURES.AGENTS_ENABLED) {
      const agentRepo = new AgentRepository(supabaseClient);
      this.agent = new AgentService(supabaseClient, agentRepo);

      // Register agent executors
      this.agent.registerAgent(
        'document_processor',
        new DocumentProcessorAgent(this.medicalRecord, this.document)
      );
    }
  }
}
```

### Usage Example

```typescript
// In a component
async function processDocument(documentId: string) {
  if (!services.agent) {
    throw new Error('Agent feature not enabled');
  }

  const user = await services.auth.getCurrentUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Start agent job
  const job = await services.agent.runAgent(
    user.id,
    'document_processor',
    { documentId, userId: user.id }
  );

  console.log('Job started:', job.id);

  // Poll for completion
  const interval = setInterval(async () => {
    const status = await services.agent!.getJobStatus(job.id, user.id);

    if (status?.status === 'completed') {
      console.log('Job completed:', status.outputData);
      clearInterval(interval);
    } else if (status?.status === 'failed') {
      console.error('Job failed:', status.errorMessage);
      clearInterval(interval);
    }
  }, 2000);
}
```

---

## Design Principles for Agents

### 1. Keep It Simple
- Start with one agent type (document processor)
- Prove it works before adding more
- Don't build orchestration until needed

### 2. Maintain Security
- All agent operations require authentication
- Agents can only access user's own data
- Log all agent actions for audit

### 3. Error Resilience
- Agents must handle failures gracefully
- Implement retry logic
- Never leave data in inconsistent state

### 4. Observability
- Log every agent execution
- Track performance metrics
- Alert on failures

### 5. Testability
- Mock external services (OCR, LLM)
- Test agent logic in isolation
- Integration tests for full workflows

---

## External Service Integration

### OCR Service
```typescript
interface OCRService {
  extractText(documentPath: string): Promise<string>;
}

// Implementation options:
// - Google Cloud Vision API
// - AWS Textract
// - Azure Computer Vision
// - Tesseract (self-hosted)
```

### LLM Service
```typescript
interface LLMService {
  parseMedicalText(text: string): Promise<MedicalData>;
}

// Implementation options:
// - OpenAI GPT-4
// - Anthropic Claude
// - Google PaLM
// - Self-hosted open models
```

---

## Cost Considerations

### OCR Costs
- Google Cloud Vision: ~$1.50 per 1,000 pages
- AWS Textract: ~$1.50 per 1,000 pages
- Self-hosted: Server costs only

### LLM Costs
- GPT-4: ~$0.03-0.06 per 1K tokens
- Claude: ~$0.01-0.02 per 1K tokens
- Self-hosted: Server + GPU costs

### Recommendations
- Start with small document batches
- Cache LLM results
- Use cheaper models for initial parsing
- Reserve expensive models for validation

---

## Success Metrics

### Agent Performance
- Job completion rate >95%
- Average execution time <30s per document
- Error rate <5%

### User Impact
- Document processing saves >80% manual entry time
- Extracted data accuracy >90%
- User satisfaction score >4/5

### System Health
- Agent failures don't crash main system
- Queue processing time <1 minute
- Resource usage within limits

---

## Migration Strategy

### From Current State
1. ✅ Phase 1 complete (core stable)
2. ⏳ Phase 2: Add tests and monitoring
3. ⏳ Phase 3: Add simple agent foundation
4. ⏳ Phase 4: Add advanced features

### Feature Flags
```typescript
const FEATURES = {
  AGENTS_ENABLED: false, // Enable in Phase 3
  AGENT_SCHEDULING: false, // Enable in Phase 4
  AGENT_ORCHESTRATION: false, // Enable in Phase 4
};
```

### Rollout Plan
1. Deploy to staging with agents enabled
2. Test with synthetic data
3. Beta test with 10 users
4. Gradual rollout to 100% users
5. Monitor for 30 days before considering stable

---

## Architecture Decision Record (ADR)

### Decision: Defer Agent Implementation

**Context**: System has unstable foundation with 78 tables and 27 services.

**Decision**: Complete Phase 1 (core stabilization) and Phase 2 (testing) before implementing agents.

**Consequences**:
- ✅ PRO: Core features become stable first
- ✅ PRO: Can properly test agent integration
- ✅ PRO: Avoid compounding complexity
- ⚠️ CON: Agent features delayed
- ⚠️ CON: Manual document processing continues

**Status**: Accepted

**Date**: 2025-11-11

---

## Next Steps

1. **Complete Phase 2 first** (testing & observability)
2. Write detailed agent specifications
3. Get team buy-in on agent approach
4. Create proof-of-concept for one agent
5. If successful, proceed with Phase 3

---

## Conclusion

Agent support will be a powerful addition to the system, but only AFTER the foundation is solid. Following the architecture review's core principle: **Stability first, features second.**

**Current Status**: Planning only. Do NOT implement until Phase 2 is complete and verified.

---

## References

- Architecture Review: `/ARCHITECTURE_REVIEW.md`
- Phase 1 Complete: `/REFACTORING_COMPLETE.md`
- Developer Guide: `/DEVELOPER_QUICK_START.md`
- Original Agent Tables: See architecture review (9 tables archived)
