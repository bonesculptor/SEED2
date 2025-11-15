/*
  # Digital Twin Graph Database Schema
  
  ## Overview
  Creates a graph database structure for storing patient medical information
  as nodes and relationships, enabling digital twin baseline tracking.
  
  ## New Tables
  
  ### Core Entities (Nodes)
  1. **patients** - Patient demographics and identifiers
  2. **conditions** - Diagnoses and medical conditions
  3. **procedures** - Surgical and medical procedures
  4. **medications** - Medication prescriptions and regimens
  5. **observations** - Clinical observations and measurements
  6. **encounters** - Clinical encounters and appointments
  7. **practitioners** - Healthcare providers
  8. **organizations** - Healthcare organizations
  
  ### Relationships (Edges)
  9. **medical_relationships** - Graph edges connecting entities
  10. **treatment_plans** - Structured treatment plans
  11. **digital_twin_baselines** - Baseline snapshots for digital twin
  
  ## Security
  All tables have RLS enabled with authenticated-only access.
*/

-- =============================================
-- Core Entity: Patients
-- =============================================

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identifiers
  nhs_number text,
  hospital_number text,
  mrn text,
  
  -- Demographics
  given_name text NOT NULL,
  family_name text NOT NULL,
  middle_name text,
  date_of_birth date,
  gender text,
  
  -- Contact
  address_line1 text,
  address_line2 text,
  city text,
  county text,
  postcode text,
  phone text,
  email text,
  
  -- Clinical
  blood_type text,
  allergies jsonb DEFAULT '[]',
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patients"
  ON patients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own patients"
  ON patients FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_nhs_number ON patients(nhs_number);

-- =============================================
-- Core Entity: Conditions (Diagnoses)
-- =============================================

CREATE TABLE IF NOT EXISTS conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Clinical Coding
  code text,
  code_system text, -- 'ICD-10', 'SNOMED-CT', etc.
  display text NOT NULL,
  
  -- Status
  clinical_status text NOT NULL DEFAULT 'active', -- active, resolved, inactive
  verification_status text DEFAULT 'confirmed', -- confirmed, provisional, differential
  severity text, -- mild, moderate, severe
  
  -- Temporal
  onset_date timestamptz,
  recorded_date timestamptz NOT NULL DEFAULT now(),
  abatement_date timestamptz,
  
  -- Clinical Details
  body_site text,
  notes text,
  evidence jsonb DEFAULT '[]',
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conditions"
  ON conditions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own conditions"
  ON conditions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_conditions_patient ON conditions(patient_id);
CREATE INDEX idx_conditions_status ON conditions(clinical_status);

-- =============================================
-- Core Entity: Procedures
-- =============================================

CREATE TABLE IF NOT EXISTS procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Clinical Coding
  code text,
  code_system text, -- 'OPCS-4', 'SNOMED-CT', 'CPT', etc.
  display text NOT NULL,
  category text, -- surgical, diagnostic, therapeutic
  
  -- Status
  status text NOT NULL DEFAULT 'completed', -- preparation, in-progress, completed, entered-in-error
  
  -- Temporal
  performed_date timestamptz NOT NULL,
  duration_minutes integer,
  
  -- Clinical Details
  body_site text,
  approach text, -- open, laparoscopic, endoscopic, etc.
  outcome text,
  complications jsonb DEFAULT '[]',
  notes text,
  
  -- Performers
  primary_performer text,
  supporting_performers text[],
  location text,
  
  -- Related
  reason_codes text[],
  reason_references uuid[],
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own procedures"
  ON procedures FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own procedures"
  ON procedures FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_procedures_patient ON procedures(patient_id);
CREATE INDEX idx_procedures_date ON procedures(performed_date);

-- =============================================
-- Core Entity: Medications
-- =============================================

CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Medication Details
  medication_name text NOT NULL,
  generic_name text,
  brand_name text,
  
  -- Clinical Coding
  code text,
  code_system text, -- 'dm+d', 'RxNorm', 'SNOMED-CT'
  
  -- Dosage
  dose_quantity numeric,
  dose_unit text,
  route text, -- oral, IV, IM, etc.
  frequency text, -- OD, BD, TDS, QDS, etc.
  timing text,
  
  -- Status
  status text NOT NULL DEFAULT 'active', -- active, stopped, completed
  intent text DEFAULT 'order', -- proposal, plan, order
  
  -- Temporal
  prescribed_date timestamptz NOT NULL DEFAULT now(),
  start_date timestamptz,
  end_date timestamptz,
  duration_days integer,
  
  -- Clinical
  indication text,
  reason_codes text[],
  instructions text,
  notes text,
  
  -- Prescriber
  prescriber_name text,
  prescriber_id text,
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medications"
  ON medications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own medications"
  ON medications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_medications_patient ON medications(patient_id);
CREATE INDEX idx_medications_status ON medications(status);

-- =============================================
-- Core Entity: Observations
-- =============================================

CREATE TABLE IF NOT EXISTS observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Clinical Coding
  code text,
  code_system text, -- 'LOINC', 'SNOMED-CT'
  display text NOT NULL,
  category text, -- vital-signs, laboratory, imaging, survey, etc.
  
  -- Status
  status text NOT NULL DEFAULT 'final', -- registered, preliminary, final, amended
  
  -- Temporal
  effective_date timestamptz NOT NULL,
  issued_date timestamptz DEFAULT now(),
  
  -- Value
  value_quantity numeric,
  value_unit text,
  value_string text,
  value_boolean boolean,
  value_code text,
  
  -- Interpretation
  interpretation text, -- normal, high, low, critical
  reference_range_low numeric,
  reference_range_high numeric,
  reference_range_text text,
  
  -- Clinical Details
  body_site text,
  method text,
  device text,
  notes text,
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own observations"
  ON observations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own observations"
  ON observations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_observations_patient ON observations(patient_id);
CREATE INDEX idx_observations_category ON observations(category);
CREATE INDEX idx_observations_date ON observations(effective_date);

-- =============================================
-- Core Entity: Encounters
-- =============================================

CREATE TABLE IF NOT EXISTS encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Encounter Details
  encounter_type text NOT NULL, -- inpatient, outpatient, emergency, etc.
  status text NOT NULL DEFAULT 'finished', -- planned, arrived, in-progress, finished
  class text, -- ambulatory, emergency, inpatient
  
  -- Temporal
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  
  -- Location
  location_name text,
  location_type text,
  
  -- Clinical
  reason_text text,
  reason_codes text[],
  diagnosis jsonb DEFAULT '[]',
  
  -- Participants
  primary_practitioner text,
  practitioners text[],
  
  -- Administrative
  appointment_id text,
  admission_source text,
  discharge_disposition text,
  
  -- Documentation
  notes text,
  summary text,
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own encounters"
  ON encounters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own encounters"
  ON encounters FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_encounters_patient ON encounters(patient_id);
CREATE INDEX idx_encounters_date ON encounters(start_date);

-- =============================================
-- Relationships (Graph Edges)
-- =============================================

CREATE TABLE IF NOT EXISTS medical_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source Node
  source_type text NOT NULL, -- patient, condition, procedure, medication, observation
  source_id uuid NOT NULL,
  
  -- Target Node
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  
  -- Relationship
  relationship_type text NOT NULL, -- has_condition, underwent_procedure, takes_medication, etc.
  relationship_strength numeric DEFAULT 1.0, -- 0.0 to 1.0
  
  -- Temporal
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  
  -- Clinical Context
  context text,
  evidence jsonb DEFAULT '[]',
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE medical_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own relationships"
  ON medical_relationships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own relationships"
  ON medical_relationships FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_relationships_source ON medical_relationships(source_type, source_id);
CREATE INDEX idx_relationships_target ON medical_relationships(target_type, target_id);
CREATE INDEX idx_relationships_type ON medical_relationships(relationship_type);

-- =============================================
-- Treatment Plans
-- =============================================

CREATE TABLE IF NOT EXISTS treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Plan Details
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active', -- draft, active, completed, cancelled
  intent text DEFAULT 'plan', -- proposal, plan, order
  
  -- Temporal
  created_date timestamptz NOT NULL DEFAULT now(),
  start_date timestamptz,
  end_date timestamptz,
  
  -- Clinical Context
  conditions uuid[],
  goals jsonb DEFAULT '[]',
  activities jsonb DEFAULT '[]',
  
  -- Care Team
  primary_practitioner text,
  care_team jsonb DEFAULT '[]',
  
  -- Documentation
  notes text,
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own treatment plans"
  ON treatment_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own treatment plans"
  ON treatment_plans FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_treatment_plans_patient ON treatment_plans(patient_id);
CREATE INDEX idx_treatment_plans_status ON treatment_plans(status);

-- =============================================
-- Digital Twin Baselines
-- =============================================

CREATE TABLE IF NOT EXISTS digital_twin_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Baseline Details
  baseline_name text NOT NULL,
  baseline_type text NOT NULL, -- initial, post-treatment, follow-up
  baseline_date timestamptz NOT NULL,
  
  -- Clinical State
  conditions uuid[],
  procedures uuid[],
  medications uuid[],
  observations uuid[],
  
  -- Treatment Context
  treatment_plan_id uuid REFERENCES treatment_plans(id),
  clinical_summary text,
  
  -- State Snapshot
  vital_signs jsonb DEFAULT '{}',
  lab_results jsonb DEFAULT '{}',
  functional_status jsonb DEFAULT '{}',
  quality_of_life jsonb DEFAULT '{}',
  
  -- Documentation
  source_documents text[],
  notes text,
  
  -- Metadata
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE digital_twin_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own baselines"
  ON digital_twin_baselines FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own baselines"
  ON digital_twin_baselines FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_baselines_patient ON digital_twin_baselines(patient_id);
CREATE INDEX idx_baselines_date ON digital_twin_baselines(baseline_date);
CREATE INDEX idx_baselines_type ON digital_twin_baselines(baseline_type);

-- =============================================
-- Updated At Triggers
-- =============================================

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conditions_updated_at BEFORE UPDATE ON conditions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procedures_updated_at BEFORE UPDATE ON procedures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_observations_updated_at BEFORE UPDATE ON observations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_encounters_updated_at BEFORE UPDATE ON encounters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_plans_updated_at BEFORE UPDATE ON treatment_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baselines_updated_at BEFORE UPDATE ON digital_twin_baselines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
