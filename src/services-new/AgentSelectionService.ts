import { SupabaseClient } from '@supabase/supabase-js';
import { ProtocolRepository, ProtocolType } from '../domain/repositories/ProtocolRepository';
import { AgentGovernanceRepository, AgentDefinition } from '../domain/repositories/AgentGovernanceRepository';

/**
 * Agent Selection Service
 *
 * Implements the three-tier protocol-based agent selection according to SEED architecture:
 *
 * Tier 1: Domain & Human Context Layer (HCP, ACP)
 * - User identity, preferences, and roles
 * - Agent capabilities and constraints
 *
 * Tier 2: Business & Organizational Layer (BCP, MCP)
 * - Business model and value propositions
 * - Machine learning pipelines and models
 *
 * Tier 3: Infrastructure & Environment Layer (GeoCP, DCP, TCP, GCP)
 * - Geographical and jurisdictional constraints
 * - Data governance and quality requirements
 * - Testing and monitoring requirements
 * - Industry/ecosystem constraints (GICS)
 */

export interface AgentSelectionCriteria {
  // Required: User context
  userId: string;

  // Tier 1: Domain & Human Context
  hcpId?: string;  // Human context - who is making the request
  acpId?: string;  // Agent context - what type of agent is needed

  // Tier 2: Business & Organizational
  bcpId?: string;  // Business context - for what business purpose
  mcpId?: string;  // Machine context - what ML capabilities needed

  // Tier 3: Infrastructure & Environment
  geocpId?: string;  // Geographical context - where can it operate
  dcpId?: string;    // Data context - what data can it access
  tcpId?: string;    // Test context - what quality standards apply
  ecosystemId?: string;  // Which ecosystem (GCP) to select from

  // Additional filters
  agentType?: string;
  requiredCapabilities?: string[];
  maxRiskScore?: number;
}

export interface AgentSelectionResult {
  agent: AgentDefinition;
  matchScore: number;
  constraintsApplied: string[];
  policiesEvaluated: string[];
  selectionReasoning: string;
}

export interface PolicyEvaluationResult {
  passed: boolean;
  violatedPolicies: string[];
  appliedConstraints: string[];
  riskAssessment: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
  };
}

export class AgentSelectionService {
  private protocolRepo: ProtocolRepository;
  private governanceRepo: AgentGovernanceRepository;

  constructor(supabaseClient: SupabaseClient) {
    this.protocolRepo = new ProtocolRepository(supabaseClient);
    this.governanceRepo = new AgentGovernanceRepository(supabaseClient);
  }

  /**
   * Select an agent based on three-tier protocol hierarchy
   */
  async selectAgent(criteria: AgentSelectionCriteria): Promise<AgentSelectionResult | null> {
    // Step 1: Load all relevant protocols (three-tier selection)
    const protocols = await this.loadProtocols(criteria);

    // Step 2: Get candidate agents from ecosystem
    const candidates = await this.getCandidateAgents(criteria);

    if (candidates.length === 0) {
      return null;
    }

    // Step 3: Apply domain constraints (from GICS if healthcare)
    const domainFiltered = await this.applyDomainConstraints(candidates, protocols);

    // Step 4: Apply protocol-based constraints (three-tier)
    const constrainedCandidates = await this.applyProtocolConstraints(
      domainFiltered,
      protocols,
      criteria
    );

    if (constrainedCandidates.length === 0) {
      return null;
    }

    // Step 5: Score and rank candidates
    const rankedCandidates = this.scoreAndRankCandidates(
      constrainedCandidates,
      protocols,
      criteria
    );

    // Step 6: Select best candidate
    return rankedCandidates[0] || null;
  }

  /**
   * Select multiple agents for an ensemble
   */
  async selectEnsemble(
    criteria: AgentSelectionCriteria,
    ensembleSize: number
  ): Promise<AgentSelectionResult[]> {
    const protocols = await this.loadProtocols(criteria);
    const candidates = await this.getCandidateAgents(criteria);

    const domainFiltered = await this.applyDomainConstraints(candidates, protocols);
    const constrainedCandidates = await this.applyProtocolConstraints(
      domainFiltered,
      protocols,
      criteria
    );

    const rankedCandidates = this.scoreAndRankCandidates(
      constrainedCandidates,
      protocols,
      criteria
    );

    // Select complementary agents for ensemble
    return this.selectComplementaryAgents(rankedCandidates, ensembleSize);
  }

  /**
   * Evaluate if an agent can execute a specific operation
   */
  async evaluatePolicies(
    agentId: string,
    userId: string,
    operation: string,
    criteria: AgentSelectionCriteria
  ): Promise<PolicyEvaluationResult> {
    const agent = await this.governanceRepo.getAgent(agentId, userId);
    if (!agent) {
      return {
        passed: false,
        violatedPolicies: ['Agent not found'],
        appliedConstraints: [],
        riskAssessment: {
          score: 100,
          level: 'critical',
          factors: ['Agent does not exist'],
        },
      };
    }

    const protocols = await this.loadProtocols(criteria);
    const violations: string[] = [];
    const constraints: string[] = [];
    const riskFactors: string[] = [];

    // Check HCP (Human Context) - Domain Layer
    if (criteria.hcpId && protocols.hcp) {
      const hcpViolations = this.checkHCPConstraints(agent, protocols.hcp, operation);
      violations.push(...hcpViolations);
      if (hcpViolations.length > 0) {
        riskFactors.push('Human context policy violations');
      }
      constraints.push('HCP: User identity and preferences validated');
    }

    // Check ACP (Agent Context) - Domain Layer
    if (criteria.acpId && protocols.acp) {
      const acpViolations = this.checkACPConstraints(agent, protocols.acp, operation);
      violations.push(...acpViolations);
      if (acpViolations.length > 0) {
        riskFactors.push('Agent capability constraints violated');
      }
      constraints.push('ACP: Agent capabilities and constraints validated');
    }

    // Check GeoCP (Geographical Context) - Infrastructure Layer
    if (criteria.geocpId && protocols.geocp) {
      const geoViolations = this.checkGeoConstraints(agent, protocols.geocp);
      violations.push(...geoViolations);
      if (geoViolations.length > 0) {
        riskFactors.push('Geographical/jurisdictional violations');
      }
      constraints.push('GeoCP: Geographical and compliance constraints validated');
    }

    // Check DCP (Data Context) - Infrastructure Layer
    if (criteria.dcpId && protocols.dcp) {
      const dcpViolations = this.checkDCPConstraints(agent, protocols.dcp, operation);
      violations.push(...dcpViolations);
      if (dcpViolations.length > 0) {
        riskFactors.push('Data governance policy violations');
      }
      constraints.push('DCP: Data access and quality policies validated');
    }

    // Calculate risk score
    const riskScore = this.calculateRiskScore(agent, violations, protocols);
    const riskLevel = this.getRiskLevel(riskScore);

    return {
      passed: violations.length === 0 && riskScore <= (criteria.maxRiskScore || 70),
      violatedPolicies: violations,
      appliedConstraints: constraints,
      riskAssessment: {
        score: riskScore,
        level: riskLevel,
        factors: riskFactors,
      },
    };
  }

  // =============================================
  // Private Helper Methods
  // =============================================

  private async loadProtocols(criteria: AgentSelectionCriteria) {
    const protocols: any = {};

    // Load domain layer protocols
    if (criteria.hcpId) {
      protocols.hcp = await this.protocolRepo.getHCP(criteria.hcpId, criteria.userId);
    }
    if (criteria.acpId) {
      protocols.acp = await this.protocolRepo.getACP(criteria.acpId, criteria.userId);
    }

    // Load business layer protocols
    if (criteria.bcpId) {
      protocols.bcp = await this.protocolRepo.getBCP(criteria.bcpId, criteria.userId);
    }

    // Load infrastructure layer protocols
    if (criteria.geocpId) {
      protocols.geocp = await this.protocolRepo.getGeoCP(criteria.geocpId, criteria.userId);
    }
    if (criteria.dcpId) {
      protocols.dcp = await this.protocolRepo.getDCP(criteria.dcpId, criteria.userId);
    }
    if (criteria.tcpId) {
      protocols.tcp = await this.protocolRepo.getTCP(criteria.tcpId, criteria.userId);
    }

    // Load ecosystem context
    if (criteria.ecosystemId) {
      const ecosystems = await this.governanceRepo.listEcosystems(criteria.userId);
      protocols.ecosystem = ecosystems.find(e => e.id === criteria.ecosystemId);
    }

    return protocols;
  }

  private async getCandidateAgents(criteria: AgentSelectionCriteria): Promise<AgentDefinition[]> {
    return this.governanceRepo.listAgents(criteria.userId, {
      ecosystemId: criteria.ecosystemId,
      agentType: criteria.agentType,
      isActive: true,
    });
  }

  private async applyDomainConstraints(
    candidates: AgentDefinition[],
    protocols: any
  ): Promise<AgentDefinition[]> {
    // If healthcare domain (GICS sector 35), apply healthcare-specific constraints
    if (protocols.ecosystem?.domainClassification === 'healthcare') {
      return candidates.filter(agent => {
        // Check if agent is authorized for healthcare domain
        const hasHealthcareAuth = agent.domainRestrictions.some(
          (restriction: any) => restriction.domain === 'healthcare' && restriction.authorized === true
        );
        return hasHealthcareAuth || agent.domainRestrictions.length === 0;
      });
    }

    return candidates;
  }

  private async applyProtocolConstraints(
    candidates: AgentDefinition[],
    protocols: any,
    criteria: AgentSelectionCriteria
  ): Promise<AgentDefinition[]> {
    return candidates.filter(agent => {
      // Check protocol support
      const requiredProtocols = [
        criteria.hcpId ? ProtocolType.HCP : null,
        criteria.acpId ? ProtocolType.ACP : null,
        criteria.bcpId ? ProtocolType.BCP : null,
        criteria.geocpId ? ProtocolType.GeoCP : null,
        criteria.dcpId ? ProtocolType.DCP : null,
        criteria.tcpId ? ProtocolType.TCP : null,
      ].filter(Boolean);

      const supportsAllProtocols = requiredProtocols.every(
        protocol => agent.supportedProtocols.includes(protocol!)
      );

      if (!supportsAllProtocols) {
        return false;
      }

      // Check capability requirements
      if (criteria.requiredCapabilities && criteria.requiredCapabilities.length > 0) {
        const agentCapabilities = agent.capabilities.map((c: any) => c.name || c);
        const hasAllCapabilities = criteria.requiredCapabilities.every(
          required => agentCapabilities.includes(required)
        );
        if (!hasAllCapabilities) {
          return false;
        }
      }

      // Check risk score
      if (criteria.maxRiskScore && agent.metadata?.riskScore) {
        if ((agent.metadata.riskScore as number) > criteria.maxRiskScore) {
          return false;
        }
      }

      return true;
    });
  }

  private scoreAndRankCandidates(
    candidates: AgentDefinition[],
    protocols: any,
    criteria: AgentSelectionCriteria
  ): AgentSelectionResult[] {
    const scored = candidates.map(agent => {
      let score = 100; // Start with perfect score
      const constraintsApplied: string[] = [];
      const policiesEvaluated: string[] = [];
      const reasoning: string[] = [];

      // Score based on capability match
      if (criteria.requiredCapabilities) {
        const capabilityMatch = this.calculateCapabilityMatch(
          agent.capabilities,
          criteria.requiredCapabilities
        );
        score *= capabilityMatch;
        reasoning.push(`Capability match: ${(capabilityMatch * 100).toFixed(0)}%`);
      }

      // Score based on risk
      const riskPenalty = agent.metadata?.riskScore ? (agent.metadata.riskScore as number) / 100 : 0;
      score *= (1 - riskPenalty * 0.5); // Risk can reduce score by up to 50%
      reasoning.push(`Risk score: ${agent.metadata?.riskScore || 0}`);

      // Score based on protocol alignment
      if (protocols.hcp) {
        constraintsApplied.push('HCP');
        policiesEvaluated.push(...(protocols.hcp.rules || []).map((r: any) => r.name || 'HCP rule'));
        reasoning.push('Human context protocols applied');
      }

      if (protocols.geocp) {
        constraintsApplied.push('GeoCP');
        reasoning.push(`Jurisdiction: ${protocols.geocp.jurisdiction}`);
      }

      return {
        agent,
        matchScore: Math.max(0, Math.min(100, score)),
        constraintsApplied,
        policiesEvaluated,
        selectionReasoning: reasoning.join('; '),
      };
    });

    // Sort by score descending
    return scored.sort((a, b) => b.matchScore - a.matchScore);
  }

  private selectComplementaryAgents(
    rankedCandidates: AgentSelectionResult[],
    ensembleSize: number
  ): AgentSelectionResult[] {
    const selected: AgentSelectionResult[] = [];
    const capabilities = new Set<string>();

    for (const candidate of rankedCandidates) {
      if (selected.length >= ensembleSize) {
        break;
      }

      // Check if this agent adds new capabilities
      const agentCaps = candidate.agent.capabilities.map((c: any) => c.name || c);
      const addsNewCapability = agentCaps.some(cap => !capabilities.has(cap));

      if (selected.length === 0 || addsNewCapability) {
        selected.push(candidate);
        agentCaps.forEach(cap => capabilities.add(cap));
      }
    }

    return selected;
  }

  private calculateCapabilityMatch(
    agentCapabilities: unknown[],
    requiredCapabilities: string[]
  ): number {
    const agentCaps = agentCapabilities.map((c: any) => c.name || c);
    const matches = requiredCapabilities.filter(req => agentCaps.includes(req)).length;
    return matches / requiredCapabilities.length;
  }

  private checkHCPConstraints(agent: AgentDefinition, hcp: any, operation: string): string[] {
    const violations: string[] = [];

    // Check if operation is allowed by HCP rules
    if (hcp.rules && Array.isArray(hcp.rules)) {
      for (const rule of hcp.rules) {
        if (rule.operation === operation && rule.allowed === false) {
          violations.push(`HCP rule prohibits operation: ${operation}`);
        }
      }
    }

    // Check delegation constraints
    if (hcp.delegation && hcp.delegation.maxRiskScore) {
      if (agent.metadata?.riskScore && (agent.metadata.riskScore as number) > hcp.delegation.maxRiskScore) {
        violations.push(`Agent risk score exceeds HCP delegation limit`);
      }
    }

    return violations;
  }

  private checkACPConstraints(agent: AgentDefinition, acp: any, operation: string): string[] {
    const violations: string[] = [];

    // Check if agent type matches ACP
    if (acp.agentType !== agent.agentType) {
      violations.push(`Agent type mismatch: expected ${acp.agentType}, got ${agent.agentType}`);
    }

    // Check risk score
    if (acp.riskScore < (agent.metadata?.riskScore || 0)) {
      violations.push(`Agent risk score exceeds ACP limit`);
    }

    return violations;
  }

  private checkGeoConstraints(agent: AgentDefinition, geocp: any): string[] {
    const violations: string[] = [];

    // Check geographical restrictions
    if (geocp.prohibitedRegions && geocp.prohibitedRegions.length > 0) {
      const agentRegion = agent.metadata?.region;
      if (agentRegion && geocp.prohibitedRegions.includes(agentRegion)) {
        violations.push(`Agent operates in prohibited region: ${agentRegion}`);
      }
    }

    return violations;
  }

  private checkDCPConstraints(agent: AgentDefinition, dcp: any, operation: string): string[] {
    const violations: string[] = [];

    // Check data access policies
    if (dcp.policies && Array.isArray(dcp.policies)) {
      for (const policy of dcp.policies) {
        if (policy.type === 'access_control' && policy.restrictedOperations) {
          if (policy.restrictedOperations.includes(operation)) {
            violations.push(`DCP policy restricts operation: ${operation}`);
          }
        }
      }
    }

    return violations;
  }

  private calculateRiskScore(agent: AgentDefinition, violations: string[], protocols: any): number {
    let riskScore = agent.metadata?.riskScore as number || 50;

    // Add risk for each violation
    riskScore += violations.length * 10;

    // Add risk if no protocols defined (operating without constraints)
    if (!protocols.hcp && !protocols.acp) {
      riskScore += 20;
    }

    // Cap at 100
    return Math.min(100, riskScore);
  }

  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 30) return 'low';
    if (score < 60) return 'medium';
    if (score < 80) return 'high';
    return 'critical';
  }
}
