/*
  # Documentation Management System

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `role` (text) - admin, developer, clinician, researcher, viewer
      - `organization` (text)
      - `department` (text)
      - `access_level` (int) - 1-5 for different clearance levels
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `documentation`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `category` (text) - architecture, technical, user_guide, governance
      - `file_path` (text)
      - `file_type` (text) - markdown, pdf, docx
      - `content` (text) - for markdown files
      - `required_role` (text[]) - roles that can access
      - `required_access_level` (int) - minimum access level
      - `version` (text)
      - `is_public` (boolean)
      - `download_count` (int)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `document_downloads`
      - `id` (uuid, primary key)
      - `document_id` (uuid, references documentation)
      - `user_id` (uuid, references auth.users)
      - `ip_address` (text)
      - `user_agent` (text)
      - `downloaded_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
*/

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'developer', 'clinician', 'researcher', 'viewer')),
  organization text,
  department text,
  access_level int NOT NULL DEFAULT 1 CHECK (access_level >= 1 AND access_level <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own non-sensitive fields
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM user_profiles WHERE id = auth.uid())
  );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any profile
CREATE POLICY "Admins can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Documentation Table
CREATE TABLE IF NOT EXISTS documentation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('architecture', 'technical', 'user_guide', 'governance', 'api', 'deployment')),
  file_path text,
  file_type text NOT NULL CHECK (file_type IN ('markdown', 'pdf', 'docx')),
  content text,
  required_role text[] DEFAULT ARRAY['viewer'],
  required_access_level int NOT NULL DEFAULT 1 CHECK (required_access_level >= 1 AND required_access_level <= 5),
  version text DEFAULT '1.0.0',
  is_public boolean DEFAULT false,
  download_count int DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documentation ENABLE ROW LEVEL SECURITY;

-- Anyone can view public documentation
CREATE POLICY "Public documentation visible to all"
  ON documentation FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Users can view documentation matching their role and access level
CREATE POLICY "Users can view authorized documentation"
  ON documentation FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND (
        role = ANY(documentation.required_role)
        OR 'viewer' = ANY(documentation.required_role)
      )
      AND access_level >= documentation.required_access_level
    )
  );

-- Admins and developers can create documentation
CREATE POLICY "Admins and developers can create documentation"
  ON documentation FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'developer')
    )
  );

-- Admins and developers can update documentation
CREATE POLICY "Admins and developers can update documentation"
  ON documentation FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'developer')
    )
  );

-- Admins can delete documentation
CREATE POLICY "Admins can delete documentation"
  ON documentation FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Document Downloads Tracking
CREATE TABLE IF NOT EXISTS document_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documentation(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  downloaded_at timestamptz DEFAULT now()
);

ALTER TABLE document_downloads ENABLE ROW LEVEL SECURITY;

-- Users can view their own download history
CREATE POLICY "Users can view own download history"
  ON document_downloads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own downloads
CREATE POLICY "Users can record downloads"
  ON document_downloads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all download history
CREATE POLICY "Admins can view all downloads"
  ON document_downloads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update download count
CREATE OR REPLACE FUNCTION increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE documentation
  SET download_count = download_count + 1
  WHERE id = NEW.document_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically increment download count
DROP TRIGGER IF EXISTS trigger_increment_download_count ON document_downloads;
CREATE TRIGGER trigger_increment_download_count
  AFTER INSERT ON document_downloads
  FOR EACH ROW
  EXECUTE FUNCTION increment_download_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documentation_updated_at ON documentation;
CREATE TRIGGER update_documentation_updated_at
  BEFORE UPDATE ON documentation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial documentation entry for the governance specification
INSERT INTO documentation (
  title,
  description,
  category,
  file_path,
  file_type,
  content,
  required_role,
  required_access_level,
  version,
  is_public
) VALUES (
  'AI Healthcare Governance System - Technical Specification',
  'Complete technical specification for implementing an AI-driven healthcare governance system based on the 9-level hierarchical model. Includes Python implementation, DevSecOps practices, digital twin integration, and security compliance.',
  'architecture',
  '/AI_HEALTHCARE_GOVERNANCE_SPECIFICATION.md',
  'markdown',
  (SELECT pg_read_file('/tmp/cc-agent/60021502/project/AI_HEALTHCARE_GOVERNANCE_SPECIFICATION.md'::text)),
  ARRAY['admin', 'developer', 'researcher'],
  2,
  '1.0.0',
  false
) ON CONFLICT DO NOTHING;
