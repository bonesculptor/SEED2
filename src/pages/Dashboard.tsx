import React, { useState, useEffect } from 'react';
import { Activity, User, Pill, FileText, TrendingUp, Calendar, Network, LogOut, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { digitalTwinService } from '../services/digitalTwinService';
import { storeLetterDataInDigitalTwin } from '../services/medicalLetterParser';
import { DigitalTwinGraphView } from '../components/visualizations/DigitalTwinGraphView';
import { TimelineView } from '../components/visualizations/TimelineView';
import { GalaxyView } from '../components/visualizations/GalaxyView';
import { PredictiveWorkflowView } from '../components/visualizations/PredictiveWorkflowView';
import { PredictiveWorkflowService, PredictiveState, TreatmentScenario } from '../services/predictiveWorkflowService';

interface DashboardStats {
  totalPatients: number;
  totalConditions: number;
  totalMedications: number;
  totalProcedures: number;
  totalObservations: number;
  activeTreatmentPlans: number;
}

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    totalConditions: 0,
    totalMedications: 0,
    totalProcedures: 0,
    totalObservations: 0,
    activeTreatmentPlans: 0,
  });
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientGraph, setPatientGraph] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'timeline' | 'galaxy' | 'predictive'>('graph');
  const [user, setUser] = useState<any>(null);
  const [importResult, setImportResult] = useState<string>('');
  const [predictiveStates, setPredictiveStates] = useState<PredictiveState[]>([]);
  const [scenarios, setScenarios] = useState<TreatmentScenario[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) {
        console.log('No authenticated user');
        setLoading(false);
        return;
      }

      const [
        patientsResult,
        conditionsResult,
        medicationsResult,
        proceduresResult,
        observationsResult,
        treatmentPlansResult,
      ] = await Promise.all([
        supabase.from('patients').select('*').eq('user_id', currentUser.id),
        supabase.from('conditions').select('*').eq('user_id', currentUser.id),
        supabase
          .from('medications')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('status', 'active'),
        supabase.from('procedures').select('*').eq('user_id', currentUser.id),
        supabase.from('observations').select('*').eq('user_id', currentUser.id),
        supabase
          .from('treatment_plans')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('status', 'active'),
      ]);

      setStats({
        totalPatients: patientsResult.data?.length || 0,
        totalConditions: conditionsResult.data?.length || 0,
        totalMedications: medicationsResult.data?.length || 0,
        totalProcedures: proceduresResult.data?.length || 0,
        totalObservations: observationsResult.data?.length || 0,
        activeTreatmentPlans: treatmentPlansResult.data?.length || 0,
      });

      setPatients(patientsResult.data || []);

      if (patientsResult.data && patientsResult.data.length > 0) {
        const firstPatient = patientsResult.data[0];
        setSelectedPatient(firstPatient);
        await loadPatientGraph(currentUser.id, firstPatient.id);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPatientGraph(userId: string, patientId: string) {
    try {
      const dtService = digitalTwinService(supabase);
      const graphData = await dtService.getPatientGraph(userId, patientId);

      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      const { data: treatmentPlans } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patientId);

      setPatientGraph({
        patient,
        ...graphData,
        treatmentPlans: treatmentPlans || [],
      });
    } catch (error) {
      console.error('Error loading patient graph:', error);
    }
  }

  async function handleImportSimonGrange() {
    if (!user) {
      alert('Please log in first');
      return;
    }

    try {
      setImporting(true);
      setImportResult('Importing Simon Grange data...');

      const result = await storeLetterDataInDigitalTwin(user.id);

      setImportResult(result.summary);

      await loadDashboardData();

      alert('Data imported successfully! Check the console for details.');
    } catch (error) {
      console.error('Import error:', error);
      setImportResult(`Error: ${error}`);
      alert('Error importing data. Check console for details.');
    } finally {
      setImporting(false);
    }
  }

  async function loadPredictiveWorkflow() {
    if (!user || !selectedPatient || !patientGraph?.treatmentPlans?.length) {
      return;
    }

    try {
      setLoadingPredictions(true);
      const predictiveService = new PredictiveWorkflowService(supabase);
      const treatmentPlanId = patientGraph.treatmentPlans[0].id;

      const [states, scenarioData] = await Promise.all([
        predictiveService.generatePredictiveWorkflow(user.id, selectedPatient.id, treatmentPlanId, 12),
        predictiveService.compareScenarios(user.id, selectedPatient.id, treatmentPlanId),
      ]);

      setPredictiveStates(states);
      setScenarios(scenarioData);
    } catch (error) {
      console.error('Error loading predictive workflow:', error);
    } finally {
      setLoadingPredictions(false);
    }
  }

  useEffect(() => {
    if (viewMode === 'predictive' && predictiveStates.length === 0) {
      loadPredictiveWorkflow();
    }
  }, [viewMode, selectedPatient, patientGraph]);

  const getTimelineRecords = () => {
    if (!patientGraph) return [];

    const records = [
      ...patientGraph.conditions.map((c: any) => ({
        id: c.id,
        type: 'condition',
        date: c.onset_date || c.recorded_date,
        title: c.display,
        category: 'diagnosis',
        description: c.notes,
        metadata: c.metadata,
      })),
      ...patientGraph.procedures.map((p: any) => ({
        id: p.id,
        type: 'procedure',
        date: p.performed_date,
        title: p.display,
        category: 'procedure',
        description: p.notes,
        metadata: p.metadata,
      })),
      ...patientGraph.observations.map((o: any) => ({
        id: o.id,
        type: 'observation',
        date: o.effective_date,
        title: o.display,
        category: 'observation',
        description: o.notes,
        metadata: o.metadata,
      })),
      ...patientGraph.encounters.map((e: any) => ({
        id: e.id,
        type: 'encounter',
        date: e.start_date,
        title: `${e.encounter_type} - ${e.primary_practitioner}`,
        category: 'observation',
        description: e.summary,
        metadata: e.metadata,
      })),
    ];

    return records.filter((r) => r.date).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getGalaxyRecords = () => {
    if (!patientGraph) return [];

    return getTimelineRecords().map((r) => ({
      ...r,
      connections: [],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-slate-400 mb-6">
            Please log in to access the Digital Twin Dashboard
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Digital Twin Dashboard</h1>
              <p className="text-slate-400 text-sm mt-1">
                Personal Health Record & Medical Graph Database
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleImportSimonGrange}
                disabled={importing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import Simon Grange Data'}
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">{user.email}</span>
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.reload();
                }}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <User className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-white">{stats.totalPatients}</span>
            </div>
            <p className="text-sm text-slate-400">Patients</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold text-white">{stats.totalConditions}</span>
            </div>
            <p className="text-sm text-slate-400">Conditions</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Pill className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-white">{stats.totalMedications}</span>
            </div>
            <p className="text-sm text-slate-400">Active Meds</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-bold text-white">{stats.totalProcedures}</span>
            </div>
            <p className="text-sm text-slate-400">Procedures</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-cyan-500" />
              <span className="text-2xl font-bold text-white">{stats.totalObservations}</span>
            </div>
            <p className="text-sm text-slate-400">Observations</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold text-white">
                {stats.activeTreatmentPlans}
              </span>
            </div>
            <p className="text-sm text-slate-400">Active Plans</p>
          </div>
        </div>

        {/* Patient Selection */}
        {patients.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Selected Patient</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl">
                {selectedPatient?.given_name?.[0]}
                {selectedPatient?.family_name?.[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">
                  {selectedPatient?.given_name} {selectedPatient?.family_name}
                </h3>
                <div className="flex gap-4 mt-2 text-sm text-slate-400">
                  {selectedPatient?.date_of_birth && (
                    <span>DOB: {new Date(selectedPatient.date_of_birth).toLocaleDateString()}</span>
                  )}
                  {selectedPatient?.nhs_number && (
                    <span>NHS: {selectedPatient.nhs_number}</span>
                  )}
                  {selectedPatient?.hospital_number && (
                    <span>Hospital: {selectedPatient.hospital_number}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {patients.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 mb-6 text-center">
            <Network className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Patient Data Yet</h3>
            <p className="text-slate-400 mb-6">
              Import Simon Grange's medical letter to get started with the digital twin
            </p>
            <button
              onClick={handleImportSimonGrange}
              disabled={importing}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-700"
            >
              {importing ? 'Importing...' : 'Import Demo Data'}
            </button>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">Import Result</h3>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap overflow-x-auto">
              {importResult}
            </pre>
          </div>
        )}

        {/* Visualization */}
        {patientGraph && (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                Medical Graph Visualization
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('graph')}
                  className={`px-4 py-2 rounded-lg ${
                    viewMode === 'graph'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Network className="w-4 h-4 inline mr-2" />
                  Graph View
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-4 py-2 rounded-lg ${
                    viewMode === 'timeline'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Timeline View
                </button>
                <button
                  onClick={() => setViewMode('galaxy')}
                  className={`px-4 py-2 rounded-lg ${
                    viewMode === 'galaxy'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <Activity className="w-4 h-4 inline mr-2" />
                  Galaxy View
                </button>
                <button
                  onClick={() => setViewMode('predictive')}
                  disabled={!patientGraph?.treatmentPlans?.length}
                  className={`px-4 py-2 rounded-lg ${
                    viewMode === 'predictive'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Predictive
                </button>
              </div>
            </div>

            {viewMode === 'graph' && (
              <DigitalTwinGraphView
                patientData={patientGraph}
                width={1100}
                height={700}
                onNodeClick={(node) => console.log('Node clicked:', node)}
              />
            )}

            {viewMode === 'timeline' && (
              <TimelineView
                records={getTimelineRecords()}
                onRecordClick={(record) => console.log('Record clicked:', record)}
              />
            )}

            {viewMode === 'galaxy' && (
              <GalaxyView
                records={getGalaxyRecords()}
                width={1100}
                height={700}
                onRecordClick={(record) => console.log('Record clicked:', record)}
              />
            )}

            {viewMode === 'predictive' && (
              <>
                {loadingPredictions ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-400">Generating predictive workflow...</p>
                    </div>
                  </div>
                ) : predictiveStates.length > 0 ? (
                  <PredictiveWorkflowView
                    states={predictiveStates}
                    scenarios={scenarios}
                    onScenarioSelect={(scenarioId) => console.log('Scenario selected:', scenarioId)}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Predictive Data</h3>
                    <p className="text-slate-400">
                      Treatment plan required for predictive workflow generation
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
