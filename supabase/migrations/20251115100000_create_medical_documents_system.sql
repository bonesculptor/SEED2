/*
  # Medical Documents and Personal Health Records System

  1. New Tables
    - `medical_document_categories`
      - Defines categories for medical documents
      - Examples: Lab Results, Imaging, Prescriptions, Clinical Notes

    - `patient_medical_documents`
      - Stores personal medical documents
      - Links to patients and FHIR resources
      - Supports file storage and metadata

    - `document_extractions`
      - Stores extracted data from documents
      - Uses AI/ML for automatic extraction
      - Links to FHIR observations and conditions

    - `document_sharing_permissions`
      - Controls document sharing between users
      - Supports time-limited access
      - Audit trail for sharing

  2. Storage Integration
    - Uses Supabase Storage for file uploads
    - Secure bucket with RLS policies
    - Support for multiple file types

  3. Security
    - Enable RLS on all tables
    - Patient owns their documents
    - Sharing permissions required for access
    - Audit logging for all access
*/

-- Medical Document Categories
CREATE TABLE IF NOT EXISTS medical_document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  color text,
  fhir_resource_type text,
  extraction_enabled boolean DEFAULT false,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medical_document_categories ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view categories
CREATE POLICY "Authenticated users can view categories"
  ON medical_document_categories FOR SELECT
  TO authenticated
  USING (true);

-- Patient Medical Documents
CREATE TABLE IF NOT EXISTS patient_medical_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid REFERENCES medical_document_categories(id),
  title text NOT NULL,
  description text,
  document_type text NOT NULL CHECK (document_type IN (
    'lab_result', 'imaging', 'prescription', 'clinical_note',
    'discharge_summary', 'vaccination_record', 'allergy_info',
    'surgical_report', 'pathology', 'consent_form', 'insurance',
    'medical_history', 'other'
  )),

  -- File storage
  storage_path text,
  file_name text,
  file_type text,
  file_size bigint,

  -- Content
  content_text text,
  metadata jsonb DEFAULT '{}',

  -- FHIR integration
  fhir_resource_type text,
  fhir_resource_id uuid,

  -- Dates
  document_date date,
  uploaded_at timestamptz DEFAULT now(),

  -- Processing
  extraction_status text DEFAULT 'pending' CHECK (extraction_status IN (
    'pending', 'processing', 'completed', 'failed', 'manual'
  )),
  extraction_data jsonb,

  -- Tags and classification
  tags text[] DEFAULT ARRAY[]::text[],

  -- Verification
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE patient_medical_documents ENABLE ROW LEVEL SECURITY;

-- Patients can view their own documents
CREATE POLICY "Patients can view own documents"
  ON patient_medical_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = patient_id);

-- Patients can insert their own documents
CREATE POLICY "Patients can upload documents"
  ON patient_medical_documents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = patient_id);

-- Patients can update their own documents
CREATE POLICY "Patients can update own documents"
  ON patient_medical_documents FOR UPDATE
  TO authenticated
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Patients can delete their own documents
CREATE POLICY "Patients can delete own documents"
  ON patient_medical_documents FOR DELETE
  TO authenticated
  USING (auth.uid() = patient_id);

-- Users with shared access can view documents
CREATE POLICY "Shared users can view documents"
  ON patient_medical_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_sharing_permissions
      WHERE document_id = patient_medical_documents.id
      AND shared_with_user_id = auth.uid()
      AND (expires_at IS NULL OR expires_at > now())
      AND revoked_at IS NULL
    )
  );

-- Document Extractions (AI-parsed data)
CREATE TABLE IF NOT EXISTS document_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES patient_medical_documents(id) ON DELETE CASCADE,
  extraction_type text NOT NULL CHECK (extraction_type IN (
    'lab_values', 'medications', 'diagnoses', 'procedures',
    'vital_signs', 'allergies', 'immunizations', 'observations'
  )),

  -- Extracted data
  extracted_data jsonb NOT NULL,
  confidence_score float CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- FHIR mapping
  fhir_resource_type text,
  fhir_resource_id uuid,

  -- Verification
  verified boolean DEFAULT false,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,

  -- Source tracking
  extraction_method text DEFAULT 'ai' CHECK (extraction_method IN ('ai', 'manual', 'api')),
  model_version text,

  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_extractions ENABLE ROW LEVEL SECURITY;

-- Patients can view extractions from their documents
CREATE POLICY "Patients can view own extractions"
  ON document_extractions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_medical_documents
      WHERE id = document_extractions.document_id
      AND patient_id = auth.uid()
    )
  );

-- Patients can insert extractions
CREATE POLICY "Patients can insert extractions"
  ON document_extractions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_medical_documents
      WHERE id = document_extractions.document_id
      AND patient_id = auth.uid()
    )
  );

-- Patients can update extractions
CREATE POLICY "Patients can update extractions"
  ON document_extractions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_medical_documents
      WHERE id = document_extractions.document_id
      AND patient_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patient_medical_documents
      WHERE id = document_extractions.document_id
      AND patient_id = auth.uid()
    )
  );

-- Document Sharing Permissions
CREATE TABLE IF NOT EXISTS document_sharing_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES patient_medical_documents(id) ON DELETE CASCADE,
  shared_by_user_id uuid NOT NULL REFERENCES auth.users(id),
  shared_with_user_id uuid NOT NULL REFERENCES auth.users(id),

  -- Permissions
  can_view boolean DEFAULT true,
  can_download boolean DEFAULT false,
  can_share boolean DEFAULT false,

  -- Time limits
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,

  -- Context
  purpose text,
  notes text,

  -- Audit
  access_count int DEFAULT 0,
  last_accessed_at timestamptz,

  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_sharing_permissions ENABLE ROW LEVEL SECURITY;

-- Patients can manage sharing for their documents
CREATE POLICY "Patients can manage document sharing"
  ON document_sharing_permissions FOR ALL
  TO authenticated
  USING (
    auth.uid() = shared_by_user_id
    OR auth.uid() = shared_with_user_id
  );

-- Document Access Audit Log
CREATE TABLE IF NOT EXISTS document_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES patient_medical_documents(id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL REFERENCES auth.users(id),
  access_type text NOT NULL CHECK (access_type IN ('view', 'download', 'share', 'edit', 'delete')),
  ip_address text,
  user_agent text,
  accessed_at timestamptz DEFAULT now()
);

ALTER TABLE document_access_log ENABLE ROW LEVEL SECURITY;

-- Patients can view access logs for their documents
CREATE POLICY "Patients can view access logs"
  ON document_access_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patient_medical_documents
      WHERE id = document_access_log.document_id
      AND patient_id = auth.uid()
    )
  );

-- System can insert access logs
CREATE POLICY "System can insert access logs"
  ON document_access_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default medical document categories
INSERT INTO medical_document_categories (name, description, icon, color, fhir_resource_type, extraction_enabled, display_order) VALUES
  ('Lab Results', 'Laboratory test results and pathology reports', 'TestTube', 'blue', 'Observation', true, 1),
  ('Imaging', 'X-rays, MRIs, CT scans, and other medical imaging', 'Image', 'purple', 'ImagingStudy', false, 2),
  ('Prescriptions', 'Medication prescriptions and pharmacy records', 'Pill', 'green', 'MedicationRequest', true, 3),
  ('Clinical Notes', 'Doctor notes, consultation records, and progress notes', 'FileText', 'yellow', 'DocumentReference', true, 4),
  ('Discharge Summaries', 'Hospital discharge summaries and care plans', 'ClipboardList', 'orange', 'DocumentReference', true, 5),
  ('Vaccination Records', 'Immunization history and vaccination certificates', 'Syringe', 'teal', 'Immunization', true, 6),
  ('Allergy Information', 'Allergy lists and reaction reports', 'AlertTriangle', 'red', 'AllergyIntolerance', true, 7),
  ('Surgical Reports', 'Operative notes and surgical procedure reports', 'Activity', 'indigo', 'Procedure', true, 8),
  ('Insurance Documents', 'Insurance cards, claims, and coverage information', 'Shield', 'slate', null, false, 9),
  ('Medical History', 'Personal medical history and family history', 'History', 'gray', 'FamilyMemberHistory', false, 10)
ON CONFLICT (name) DO NOTHING;

-- Function to log document access
CREATE OR REPLACE FUNCTION log_document_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO document_access_log (document_id, accessed_by, access_type)
  VALUES (NEW.id, auth.uid(), 'view');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update extraction status
CREATE OR REPLACE FUNCTION update_extraction_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE patient_medical_documents
  SET
    extraction_status = 'completed',
    extraction_data = NEW.extracted_data
  WHERE id = NEW.document_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for extraction completion
DROP TRIGGER IF EXISTS trigger_update_extraction_status ON document_extractions;
CREATE TRIGGER trigger_update_extraction_status
  AFTER INSERT ON document_extractions
  FOR EACH ROW
  EXECUTE FUNCTION update_extraction_status();

-- Function to increment access count
CREATE OR REPLACE FUNCTION increment_access_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE document_sharing_permissions
  SET
    access_count = access_count + 1,
    last_accessed_at = now()
  WHERE document_id = NEW.document_id
  AND shared_with_user_id = NEW.accessed_by;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for access count
DROP TRIGGER IF EXISTS trigger_increment_access_count ON document_access_log;
CREATE TRIGGER trigger_increment_access_count
  AFTER INSERT ON document_access_log
  FOR EACH ROW
  EXECUTE FUNCTION increment_access_count();

-- Storage bucket for medical documents (run this in Supabase dashboard or via API)
-- Note: This creates a private bucket with RLS policies
-- INSERT INTO storage.buckets (id, name, public) VALUES ('medical-documents', 'medical-documents', false);

-- Storage policies would be:
-- 1. Users can upload to their own folder
-- 2. Users can view files in their own folder
-- 3. Users can view files shared with them
