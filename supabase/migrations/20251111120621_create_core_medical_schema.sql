/*
  # Create Core Medical Records Schema
  
  ## Overview
  This migration creates the minimal, secure foundation for the medical records system.
  Following the architecture review, we focus on:
  - FHIR-compliant medical data only
  - Strict user ownership via user_id
  - NO anonymous access
  - NOT NULL constraints with sensible defaults
  - Proper indexing for performance
  
  ## New Tables
  
  ### 1. fhir_patient_protocols
  Core patient demographic and identity information
  - id: Unique identifier
  - user_id: Owner (REQUIRED, authenticated users only)
  - given_name: First name (default: 'Unknown')
  - family_name: Last name (default: 'Unknown')
  - birth_date: Date of birth (optional)
  - gender: Patient gender (optional)
  - nhs_number: UK NHS number (optional)
  - created_at, updated_at: Audit timestamps
  
  ### 2. fhir_medication_protocols
  Medication records
  - id, user_id (REQUIRED)
  - medication_text: Medication name/description (REQUIRED)
  - medication_code: Structured code (optional)
  - dosage, frequency, status (optional with defaults)
  
  ### 3. fhir_condition_protocols
  Medical conditions/diagnoses
  - id, user_id (REQUIRED)
  - condition_text: Condition description (REQUIRED)
  - condition_code: Structured code (optional)
  - clinical_status: Current status (default: 'active')
  
  ### 4. fhir_observation_protocols
  Clinical observations and measurements
  - id, user_id (REQUIRED)
  - observation_text: What was observed (REQUIRED)
  - value, unit: Measurement details
  - observation_date: When observed
  
  ### 5. fhir_allergy_protocols
  Allergy and intolerance records
  - id, user_id (REQUIRED)
  - allergy_text: Allergen description (REQUIRED)
  - allergy_code: Structured code (optional)
  - criticality: Severity level (default: 'low')
  
  ### 6. document_files
  Uploaded medical documents
  - id, user_id (REQUIRED)
  - filename, storage_path, mime_type
  - extraction_status: Processing state
  - Stores PDFs, images of medical records
  
  ### 7. graph_nodes
  Graph visualization nodes
  - id, user_id (REQUIRED)
  - label: Display label (REQUIRED, default: 'Unknown')
  - node_type: Type of node (patient, medication, etc.)
  
  ### 8. graph_edges
  Graph visualization relationships
  - id, user_id (REQUIRED)
  - source, target: Node IDs
  - relationship: Type of connection
  
  ## Security (RLS)
  
  ALL tables have Row Level Security enabled with:
  - NO anonymous access whatsoever
  - Users can only SELECT their own data (user_id = auth.uid())
  - Users can only INSERT their own data
  - Users can only UPDATE their own data
  - Users can only DELETE their own data
  
  ## Performance
  
  Indexes created on:
  - user_id for all tables (primary filter)
  - Foreign keys for graph edges
  - created_at for time-based queries
*/

-- =============================================
-- FHIR Patient Demographics
-- =============================================

CREATE TABLE IF NOT EXISTS fhir_patient_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  given_name text NOT NULL DEFAULT 'Unknown',
  family_name text NOT NULL DEFAULT 'Unknown',
  birth_date date,
  gender text,
  nhs_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE fhir_patient_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patient records"
  ON fhir_patient_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own patient records"
  ON fhir_patient_protocols FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patient records"
  ON fhir_patient_protocols FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own patient records"
  ON fhir_patient_protocols FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_fhir_patient_user_id ON fhir_patient_protocols(user_id);
CREATE INDEX idx_fhir_patient_created ON fhir_patient_protocols(created_at DESC);

-- =============================================
-- FHIR Medications
-- =============================================

CREATE TABLE IF NOT EXISTS fhir_medication_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES fhir_patient_protocols(id) ON DELETE CASCADE,
  medication_text text NOT NULL,
  medication_code jsonb,
  dosage text,
  frequency text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medication_text_not_empty CHECK (length(medication_text) > 0)
);

ALTER TABLE fhir_medication_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medications"
  ON fhir_medication_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own medications"
  ON fhir_medication_protocols FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medications"
  ON fhir_medication_protocols FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medications"
  ON fhir_medication_protocols FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_fhir_medication_user_id ON fhir_medication_protocols(user_id);
CREATE INDEX idx_fhir_medication_patient_id ON fhir_medication_protocols(patient_id);

-- =============================================
-- FHIR Conditions
-- =============================================

CREATE TABLE IF NOT EXISTS fhir_condition_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES fhir_patient_protocols(id) ON DELETE CASCADE,
  condition_text text NOT NULL,
  condition_code jsonb,
  clinical_status text NOT NULL DEFAULT 'active',
  onset_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT condition_text_not_empty CHECK (length(condition_text) > 0)
);

ALTER TABLE fhir_condition_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conditions"
  ON fhir_condition_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conditions"
  ON fhir_condition_protocols FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conditions"
  ON fhir_condition_protocols FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conditions"
  ON fhir_condition_protocols FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_fhir_condition_user_id ON fhir_condition_protocols(user_id);
CREATE INDEX idx_fhir_condition_patient_id ON fhir_condition_protocols(patient_id);

-- =============================================
-- FHIR Observations
-- =============================================

CREATE TABLE IF NOT EXISTS fhir_observation_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES fhir_patient_protocols(id) ON DELETE CASCADE,
  observation_text text NOT NULL,
  observation_code jsonb,
  value text,
  unit text,
  observation_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT observation_text_not_empty CHECK (length(observation_text) > 0)
);

ALTER TABLE fhir_observation_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own observations"
  ON fhir_observation_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own observations"
  ON fhir_observation_protocols FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own observations"
  ON fhir_observation_protocols FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own observations"
  ON fhir_observation_protocols FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_fhir_observation_user_id ON fhir_observation_protocols(user_id);
CREATE INDEX idx_fhir_observation_patient_id ON fhir_observation_protocols(patient_id);

-- =============================================
-- FHIR Allergies
-- =============================================

CREATE TABLE IF NOT EXISTS fhir_allergy_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES fhir_patient_protocols(id) ON DELETE CASCADE,
  allergy_text text NOT NULL,
  allergy_code jsonb,
  criticality text NOT NULL DEFAULT 'low',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT allergy_text_not_empty CHECK (length(allergy_text) > 0)
);

ALTER TABLE fhir_allergy_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own allergies"
  ON fhir_allergy_protocols FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own allergies"
  ON fhir_allergy_protocols FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own allergies"
  ON fhir_allergy_protocols FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own allergies"
  ON fhir_allergy_protocols FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_fhir_allergy_user_id ON fhir_allergy_protocols(user_id);
CREATE INDEX idx_fhir_allergy_patient_id ON fhir_allergy_protocols(patient_id);

-- =============================================
-- Document Storage
-- =============================================

CREATE TABLE IF NOT EXISTS document_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  file_size bigint,
  extraction_status text NOT NULL DEFAULT 'pending',
  extracted_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON document_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents"
  ON document_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON document_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON document_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_document_user_id ON document_files(user_id);
CREATE INDEX idx_document_status ON document_files(extraction_status);

-- =============================================
-- Graph Visualization
-- =============================================

CREATE TABLE IF NOT EXISTS graph_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Unknown',
  node_type text NOT NULL,
  properties jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT label_not_empty CHECK (length(label) > 0)
);

ALTER TABLE graph_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own graph nodes"
  ON graph_nodes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own graph nodes"
  ON graph_nodes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own graph nodes"
  ON graph_nodes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own graph nodes"
  ON graph_nodes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_graph_node_user_id ON graph_nodes(user_id);
CREATE INDEX idx_graph_node_type ON graph_nodes(node_type);

-- =============================================
-- Graph Edges/Relationships
-- =============================================

CREATE TABLE IF NOT EXISTS graph_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source uuid NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
  target uuid NOT NULL REFERENCES graph_nodes(id) ON DELETE CASCADE,
  relationship text NOT NULL,
  properties jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own graph edges"
  ON graph_edges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own graph edges"
  ON graph_edges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own graph edges"
  ON graph_edges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own graph edges"
  ON graph_edges FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_graph_edge_user_id ON graph_edges(user_id);
CREATE INDEX idx_graph_edge_source ON graph_edges(source);
CREATE INDEX idx_graph_edge_target ON graph_edges(target);

-- =============================================
-- Updated At Trigger Function
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_fhir_patient_updated_at BEFORE UPDATE ON fhir_patient_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fhir_medication_updated_at BEFORE UPDATE ON fhir_medication_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fhir_condition_updated_at BEFORE UPDATE ON fhir_condition_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fhir_observation_updated_at BEFORE UPDATE ON fhir_observation_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fhir_allergy_updated_at BEFORE UPDATE ON fhir_allergy_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_files_updated_at BEFORE UPDATE ON document_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();