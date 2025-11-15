import React, { useState } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Pill,
  Heart,
  Target,
} from 'lucide-react';
import { PredictiveState, TreatmentScenario } from '../../services/predictiveWorkflowService';

interface PredictiveWorkflowViewProps {
  states: PredictiveState[];
  scenarios?: TreatmentScenario[];
  onScenarioSelect?: (scenarioId: string) => void;
}

const STATE_CONFIG = {
  baseline: { icon: Minus, color: 'text-slate-400', bg: 'bg-slate-900', label: 'Baseline' },
  improving: { icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-900/30', label: 'Improving' },
  stable: { icon: Minus, color: 'text-blue-400', bg: 'bg-blue-900/30', label: 'Stable' },
  declining: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-900/30', label: 'Declining' },
  recovered: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-900/30', label: 'Recovered' },
};

const RISK_COLORS = {
  low: 'text-green-400 bg-green-900/30',
  medium: 'text-amber-400 bg-amber-900/30',
  high: 'text-red-400 bg-red-900/30',
  critical: 'text-rose-400 bg-rose-900/30',
};

export function PredictiveWorkflowView({ states, scenarios, onScenarioSelect }: PredictiveWorkflowViewProps) {
  const [selectedState, setSelectedState] = useState<PredictiveState | null>(states[0] || null);
  const [selectedScenario, setSelectedScenario] = useState<string>('optimal');
  const [viewMode, setViewMode] = useState<'timeline' | 'scenarios'>('timeline');

  const currentScenario = scenarios?.find((s) => s.id === selectedScenario);
  const displayStates = viewMode === 'scenarios' && currentScenario ? currentScenario.states : states;

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    onScenarioSelect?.(scenarioId);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Predictive Workflow & Digital Twin
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            AI-powered trajectory prediction based on treatment plan
          </p>
        </div>

        {scenarios && scenarios.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Timeline View
            </button>
            <button
              onClick={() => setViewMode('scenarios')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'scenarios'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Compare Scenarios
            </button>
          </div>
        )}
      </div>

      {/* Scenario Selector */}
      {viewMode === 'scenarios' && scenarios && scenarios.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-400 mb-3">Select Scenario:</label>
          <div className="grid grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleScenarioChange(scenario.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedScenario === scenario.id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <h3 className="font-semibold text-white mb-1">{scenario.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{scenario.description}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Success Rate:</span>
                    <span className="text-white font-medium">
                      {(scenario.outcome.success_probability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recovery:</span>
                    <span className="text-white font-medium">{scenario.outcome.recovery_time_weeks} weeks</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">QoL Score:</span>
                    <span className="text-white font-medium">{scenario.outcome.quality_of_life_score}/10</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Predicted Timeline
        </h3>

        <div className="space-y-4">
          {displayStates.map((state, index) => {
            const config = STATE_CONFIG[state.state];
            const Icon = config.icon;
            const isSelected = selectedState?.timestamp === state.timestamp;
            const weeksFromNow = index === 0 ? 0 : Math.floor((state.timestamp.getTime() - displayStates[0].timestamp.getTime()) / (7 * 24 * 60 * 60 * 1000));

            return (
              <div
                key={index}
                onClick={() => setSelectedState(state)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        {weeksFromNow === 0 ? 'Current State' : `Week ${weeksFromNow}`}
                      </h4>
                      <p className="text-sm text-slate-400">
                        {state.timestamp.toLocaleDateString()} - {config.label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Confidence</div>
                    <div className="text-lg font-bold text-white">{(state.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 space-y-4 border-t border-slate-700 pt-4">
                    {/* Conditions */}
                    {state.conditions.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          Conditions
                        </h5>
                        <div className="space-y-2">
                          {state.conditions.map((condition, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 bg-slate-800/50 rounded text-sm"
                            >
                              <div>
                                <span className="text-white">{condition.conditionName}</span>
                                <span className="ml-2 text-xs text-slate-400 capitalize">
                                  ({condition.status})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded capitalize ${
                                  condition.severity === 'severe' ? 'bg-red-900/30 text-red-400' :
                                  condition.severity === 'moderate' ? 'bg-amber-900/30 text-amber-400' :
                                  'bg-green-900/30 text-green-400'
                                }`}>
                                  {condition.severity}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {(condition.probability * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medications */}
                    {state.medications.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <Pill className="w-4 h-4" />
                          Medication Changes
                        </h5>
                        <div className="space-y-2">
                          {state.medications
                            .filter((m) => m.action !== 'continue')
                            .map((medication, idx) => (
                              <div key={idx} className="p-2 bg-slate-800/50 rounded text-sm">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-white font-medium">{medication.medicationName}</span>
                                  <span className={`text-xs px-2 py-1 rounded capitalize ${
                                    medication.action === 'add' ? 'bg-green-900/30 text-green-400' :
                                    medication.action === 'adjust' ? 'bg-blue-900/30 text-blue-400' :
                                    'bg-red-900/30 text-red-400'
                                  }`}>
                                    {medication.action}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400">{medication.reason}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {state.activities.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Scheduled Activities
                        </h5>
                        <div className="space-y-2">
                          {state.activities.map((activity, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2 bg-slate-800/50 rounded text-sm">
                              <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-white font-medium">{activity.description}</div>
                                <div className="text-xs text-slate-400 capitalize">{activity.type}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observations */}
                    {state.observations.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Expected Observations
                        </h5>
                        <div className="space-y-2">
                          {state.observations.map((obs, idx) => (
                            <div key={idx} className="p-2 bg-slate-800/50 rounded text-sm">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-white font-medium">{obs.type}</span>
                                <span className="text-xs text-slate-400">
                                  {(obs.likelihood * 100).toFixed(0)}% likely
                                </span>
                              </div>
                              <div className="text-xs text-slate-400">
                                Expected: {obs.expectedValue} ({obs.expectedRange})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risks */}
                    {state.risks.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Risk Factors
                        </h5>
                        <div className="space-y-2">
                          {state.risks.map((risk, idx) => (
                            <div key={idx} className="p-2 bg-slate-800/50 rounded text-sm">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-white font-medium">{risk.factor}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-1 rounded capitalize ${RISK_COLORS[risk.level]}`}>
                                    {risk.level}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {(risk.probability * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-400">{risk.mitigation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Milestones */}
                    {state.milestones.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Milestones
                        </h5>
                        <div className="space-y-2">
                          {state.milestones.map((milestone, idx) => (
                            <div key={idx} className="p-3 bg-blue-900/20 border border-blue-800 rounded text-sm">
                              <div className="font-semibold text-white mb-1">{milestone.title}</div>
                              <p className="text-xs text-slate-400 mb-2">{milestone.description}</p>
                              <div className="space-y-1">
                                {milestone.indicators.map((indicator, i) => (
                                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                                    <CheckCircle className="w-3 h-3 text-blue-400" />
                                    {indicator}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Outcome Summary (for scenario comparison) */}
      {viewMode === 'scenarios' && currentScenario && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Predicted Outcome</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Success Probability</div>
              <div className="text-2xl font-bold text-white">
                {(currentScenario.outcome.success_probability * 100).toFixed(0)}%
              </div>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Recovery Time</div>
              <div className="text-2xl font-bold text-white">{currentScenario.outcome.recovery_time_weeks} weeks</div>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Quality of Life</div>
              <div className="text-2xl font-bold text-white">{currentScenario.outcome.quality_of_life_score}/10</div>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Complications</div>
              <div className="text-2xl font-bold text-white">{currentScenario.outcome.complications.length}</div>
            </div>
          </div>
          {currentScenario.outcome.complications.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-slate-400 mb-2">Expected Complications:</h4>
              <ul className="space-y-1">
                {currentScenario.outcome.complications.map((comp, idx) => (
                  <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    {comp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
