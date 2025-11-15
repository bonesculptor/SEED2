import { SupabaseClient } from '@supabase/supabase-js';

export interface PredictiveState {
  timestamp: Date;
  state: 'baseline' | 'improving' | 'stable' | 'declining' | 'recovered';
  confidence: number;
  conditions: ConditionPrediction[];
  medications: MedicationPrediction[];
  observations: ObservationPrediction[];
  activities: ActivityPrediction[];
  risks: RiskFactor[];
  milestones: Milestone[];
}

export interface ConditionPrediction {
  conditionId: string;
  conditionName: string;
  status: 'active' | 'improving' | 'resolved' | 'worsening';
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  probability: number;
}

export interface MedicationPrediction {
  medicationId?: string;
  medicationName: string;
  action: 'continue' | 'adjust' | 'discontinue' | 'add';
  dosage?: string;
  reason: string;
}

export interface ObservationPrediction {
  type: string;
  expectedValue: string;
  expectedRange: string;
  likelihood: number;
}

export interface ActivityPrediction {
  date: Date;
  type: 'appointment' | 'test' | 'procedure' | 'milestone' | 'review';
  description: string;
  required: boolean;
}

export interface RiskFactor {
  factor: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  mitigation: string;
}

export interface Milestone {
  date: Date;
  title: string;
  description: string;
  achieved: boolean;
  indicators: string[];
}

export interface TreatmentScenario {
  id: string;
  name: string;
  description: string;
  states: PredictiveState[];
  outcome: {
    success_probability: number;
    recovery_time_weeks: number;
    complications: string[];
    quality_of_life_score: number;
  };
}

export class PredictiveWorkflowService {
  constructor(private supabase: SupabaseClient) {}

  async generatePredictiveWorkflow(
    userId: string,
    patientId: string,
    treatmentPlanId: string,
    timeHorizonWeeks: number = 12
  ): Promise<PredictiveState[]> {
    const { data: treatmentPlan } = await this.supabase
      .from('treatment_plans')
      .select('*')
      .eq('id', treatmentPlanId)
      .single();

    if (!treatmentPlan) {
      throw new Error('Treatment plan not found');
    }

    const { data: currentConditions } = await this.supabase
      .from('conditions')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active');

    const { data: currentMedications } = await this.supabase
      .from('medications')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'active');

    const states: PredictiveState[] = [];
    const now = new Date();

    const baselineState: PredictiveState = {
      timestamp: now,
      state: 'baseline',
      confidence: 1.0,
      conditions: (currentConditions || []).map((c) => ({
        conditionId: c.id,
        conditionName: c.display,
        status: 'active',
        severity: c.severity || 'moderate',
        probability: 1.0,
      })),
      medications: (currentMedications || []).map((m) => ({
        medicationId: m.id,
        medicationName: m.display,
        action: 'continue',
        dosage: m.dosage,
        reason: 'Current medication regimen',
      })),
      observations: [],
      activities: [],
      risks: this.assessCurrentRisks(currentConditions || []),
      milestones: [],
    };

    states.push(baselineState);

    const weeksToProject = [1, 2, 4, 6, 8, 12].filter((w) => w <= timeHorizonWeeks);

    weeksToProject.forEach((week) => {
      const futureDate = new Date(now);
      futureDate.setDate(futureDate.getDate() + week * 7);

      const state = this.projectStateAtWeek(
        week,
        treatmentPlan,
        currentConditions || [],
        currentMedications || [],
        baselineState
      );

      state.timestamp = futureDate;
      states.push(state);
    });

    return states;
  }

  private projectStateAtWeek(
    week: number,
    treatmentPlan: any,
    currentConditions: any[],
    currentMedications: any[],
    baseline: PredictiveState
  ): PredictiveState {
    const improvementRate = 0.15;
    const stabilizationWeek = 6;

    let state: 'baseline' | 'improving' | 'stable' | 'declining' | 'recovered' = 'improving';
    let confidence = 0.9 - week * 0.05;

    if (week >= stabilizationWeek) {
      state = 'stable';
    }
    if (week >= 10) {
      state = 'recovered';
      confidence = 0.75;
    }

    const conditions: ConditionPrediction[] = currentConditions.map((c) => {
      let status: 'active' | 'improving' | 'resolved' | 'worsening' = 'active';
      let severity = c.severity || 'moderate';
      let probability = 1.0 - week * improvementRate;

      if (week <= 2) {
        status = 'active';
      } else if (week <= 6) {
        status = 'improving';
        if (severity === 'severe') severity = 'moderate';
        probability = 0.8;
      } else if (week <= 10) {
        status = 'improving';
        if (severity === 'moderate') severity = 'mild';
        probability = 0.6;
      } else {
        status = 'resolved';
        severity = 'mild';
        probability = 0.3;
      }

      return {
        conditionId: c.id,
        conditionName: c.display,
        status,
        severity,
        probability: Math.max(0.1, probability),
      };
    });

    const medications: MedicationPrediction[] = currentMedications.map((m) => {
      let action: 'continue' | 'adjust' | 'discontinue' | 'add' = 'continue';
      let reason = 'Continue current regimen';

      if (week === 2) {
        if (m.display.includes('Bisoprolol')) {
          action = 'adjust';
          reason = 'Titrate dose based on heart rate and blood pressure';
        }
      } else if (week === 4) {
        if (m.display.includes('Pantoprazole')) {
          action = 'adjust';
          reason = 'Consider reducing if no GI symptoms';
        }
      } else if (week >= 8) {
        if (m.display.includes('Clopidogrel')) {
          action = 'discontinue';
          reason = 'Complete dual antiplatelet therapy (DAPT) duration';
        }
      }

      return {
        medicationId: m.id,
        medicationName: m.display,
        action,
        dosage: m.dosage,
        reason,
      };
    });

    const observations: ObservationPrediction[] = [];
    if (week === 1) {
      observations.push({
        type: 'Blood Pressure',
        expectedValue: '135/85 mmHg',
        expectedRange: '120-140/80-90',
        likelihood: 0.8,
      });
      observations.push({
        type: 'Heart Rate',
        expectedValue: '68 bpm',
        expectedRange: '60-75',
        likelihood: 0.85,
      });
    } else if (week === 4) {
      observations.push({
        type: 'Lipid Panel',
        expectedValue: 'LDL <1.8 mmol/L',
        expectedRange: 'Target achieved',
        likelihood: 0.75,
      });
      observations.push({
        type: 'Troponin',
        expectedValue: 'Normal (<14 ng/L)',
        expectedRange: 'Normalized',
        likelihood: 0.9,
      });
    } else if (week >= 6) {
      observations.push({
        type: 'Exercise Tolerance',
        expectedValue: '8 METs',
        expectedRange: '6-10 METs',
        likelihood: 0.8,
      });
    }

    const activities: ActivityPrediction[] = [];
    if (week === 1) {
      activities.push({
        date: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000),
        type: 'review',
        description: 'Post-discharge follow-up with cardiologist',
        required: true,
      });
    } else if (week === 2) {
      activities.push({
        date: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000),
        type: 'test',
        description: 'ECG and blood pressure monitoring',
        required: true,
      });
    } else if (week === 4) {
      activities.push({
        date: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000),
        type: 'test',
        description: 'Blood tests (lipids, troponin, renal function)',
        required: true,
      });
      activities.push({
        date: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000),
        type: 'milestone',
        description: 'Begin phase 2 cardiac rehabilitation',
        required: true,
      });
    } else if (week === 6) {
      activities.push({
        date: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000),
        type: 'appointment',
        description: 'Occupational health assessment for return to work',
        required: true,
      });
    } else if (week === 8) {
      activities.push({
        date: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000),
        type: 'milestone',
        description: 'Complete cardiac rehabilitation program',
        required: true,
      });
    } else if (week === 12) {
      activities.push({
        date: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000),
        type: 'review',
        description: 'Comprehensive cardiac review and imaging',
        required: true,
      });
    }

    const risks: RiskFactor[] = [];
    if (week <= 2) {
      risks.push({
        factor: 'Post-operative infection',
        level: 'medium',
        probability: 0.15,
        mitigation: 'Monitor wound site, continue antibiotics if prescribed',
      });
      risks.push({
        factor: 'Sternal instability',
        level: 'low',
        probability: 0.08,
        mitigation: 'Avoid heavy lifting, follow sternal precautions',
      });
    } else if (week <= 6) {
      risks.push({
        factor: 'Medication non-adherence',
        level: 'medium',
        probability: 0.25,
        mitigation: 'Regular follow-up, medication review, patient education',
      });
      risks.push({
        factor: 'Recurrent angina',
        level: 'low',
        probability: 0.1,
        mitigation: 'Monitor symptoms, GTN spray available, seek help if needed',
      });
    } else {
      risks.push({
        factor: 'Long-term cardiovascular events',
        level: 'low',
        probability: 0.12,
        mitigation: 'Continue medications, lifestyle modifications, regular monitoring',
      });
    }

    const milestones: Milestone[] = [];
    if (week === 2) {
      milestones.push({
        date: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000),
        title: 'Wound healing complete',
        description: 'Sternal and leg wounds healed, sutures/staples removed',
        achieved: false,
        indicators: ['No signs of infection', 'Reduced pain', 'Normal mobility'],
      });
    } else if (week === 4) {
      milestones.push({
        date: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000),
        title: 'Cardiac biomarkers normalized',
        description: 'Troponin and inflammatory markers return to baseline',
        achieved: false,
        indicators: ['Troponin <14 ng/L', 'CRP normalized', 'Normal ECG'],
      });
    } else if (week === 6) {
      milestones.push({
        date: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000),
        title: 'Return to modified duties',
        description: 'Cleared for light work activities',
        achieved: false,
        indicators: ['Good exercise tolerance', 'No angina', 'Stable medications'],
      });
    } else if (week === 12) {
      milestones.push({
        date: new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000),
        title: 'Full recovery achieved',
        description: 'Complete functional recovery with optimal management',
        achieved: false,
        indicators: [
          'Return to full work duties',
          'Excellent exercise capacity',
          'Optimal medical therapy',
          'Normal cardiac function',
        ],
      });
    }

    return {
      timestamp: new Date(),
      state,
      confidence: Math.max(0.5, confidence),
      conditions,
      medications,
      observations,
      activities,
      risks,
      milestones,
    };
  }

  private assessCurrentRisks(conditions: any[]): RiskFactor[] {
    const risks: RiskFactor[] = [];

    const hasCAD = conditions.some((c) => c.code === 'I25.1' || c.display.includes('coronary'));
    const hasRecentMI = conditions.some((c) => c.code === 'I21.4' || c.display.includes('NSTEMI'));

    if (hasRecentMI) {
      risks.push({
        factor: 'Early post-MI complications',
        level: 'high',
        probability: 0.3,
        mitigation: 'Close monitoring, optimal medical therapy, cardiac rehabilitation',
      });
    }

    if (hasCAD) {
      risks.push({
        factor: 'Recurrent cardiovascular events',
        level: 'medium',
        probability: 0.2,
        mitigation: 'Secondary prevention, lifestyle modification, medication adherence',
      });
    }

    return risks;
  }

  async compareScenarios(
    userId: string,
    patientId: string,
    treatmentPlanId: string
  ): Promise<TreatmentScenario[]> {
    const scenarios: TreatmentScenario[] = [];

    const optimalStates = await this.generatePredictiveWorkflow(userId, patientId, treatmentPlanId, 12);
    scenarios.push({
      id: 'optimal',
      name: 'Optimal Adherence',
      description: 'Patient follows all recommendations, attends all appointments, takes all medications',
      states: optimalStates,
      outcome: {
        success_probability: 0.85,
        recovery_time_weeks: 12,
        complications: ['Minor wound discomfort (resolved)'],
        quality_of_life_score: 8.5,
      },
    });

    const subOptimalStates = await this.generatePredictiveWorkflow(userId, patientId, treatmentPlanId, 16);
    subOptimalStates.forEach((state, index) => {
      if (index > 0) {
        state.confidence *= 0.8;
        state.conditions.forEach((c) => {
          c.probability *= 1.2;
          if (c.status === 'improving' && index > 4) {
            c.status = 'active';
          }
        });
      }
    });

    scenarios.push({
      id: 'suboptimal',
      name: 'Partial Adherence',
      description: 'Patient misses some appointments, occasional medication non-adherence',
      states: subOptimalStates,
      outcome: {
        success_probability: 0.65,
        recovery_time_weeks: 16,
        complications: ['Delayed wound healing', 'Medication adjustment needed'],
        quality_of_life_score: 7.0,
      },
    });

    const complicatedStates = await this.generatePredictiveWorkflow(userId, patientId, treatmentPlanId, 20);
    complicatedStates.forEach((state, index) => {
      if (index > 0) {
        state.confidence *= 0.6;
        state.state = index < 8 ? 'declining' : 'improving';
        state.risks.forEach((r) => {
          if (r.level === 'low') r.level = 'medium';
          if (r.level === 'medium') r.level = 'high';
          r.probability *= 1.5;
        });
      }
    });

    scenarios.push({
      id: 'complicated',
      name: 'Complications',
      description: 'Post-operative infection, medication side effects, requires intervention',
      states: complicatedStates,
      outcome: {
        success_probability: 0.45,
        recovery_time_weeks: 20,
        complications: ['Wound infection (treated)', 'Medication intolerance', 'Additional procedures required'],
        quality_of_life_score: 6.0,
      },
    });

    return scenarios;
  }

  async savePredictiveWorkflow(
    userId: string,
    patientId: string,
    treatmentPlanId: string,
    workflow: PredictiveState[]
  ): Promise<void> {
    const { error } = await this.supabase.from('predictive_workflows').insert({
      user_id: userId,
      patient_id: patientId,
      treatment_plan_id: treatmentPlanId,
      workflow_data: workflow,
      generated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error saving predictive workflow:', error);
    }
  }
}
