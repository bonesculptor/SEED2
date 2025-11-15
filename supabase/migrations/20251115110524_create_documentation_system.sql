/*
  # Documentation Management System

  1. New Tables
    - `user_profiles` - User roles and access levels
    - `documentation` - Documentation files and metadata
    - `document_downloads` - Download tracking

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

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

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
  file_type text DEFAULT 'markdown',
  content text,
  required_role text[] DEFAULT ARRAY['viewer']::text[],
  required_access_level int DEFAULT 1,
  version text DEFAULT '1.0.0',
  is_public boolean DEFAULT false,
  download_count int DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documentation ENABLE ROW LEVEL SECURITY;

-- Public documents can be read by anyone authenticated
CREATE POLICY "Public documents readable"
  ON documentation FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Documents require role and access level
CREATE POLICY "Role-based document access"
  ON documentation FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = ANY(documentation.required_role)
      AND access_level >= documentation.required_access_level
    )
  );

-- Admins can insert documentation
CREATE POLICY "Admins can insert documentation"
  ON documentation FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update documentation
CREATE POLICY "Admins can update documentation"
  ON documentation FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete documentation
CREATE POLICY "Admins can delete documentation"
  ON documentation FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Document Downloads Table
CREATE TABLE IF NOT EXISTS document_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documentation(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  access_type text DEFAULT 'download' CHECK (access_type IN ('view', 'download')),
  ip_address text,
  user_agent text,
  accessed_at timestamptz DEFAULT now()
);

ALTER TABLE document_downloads ENABLE ROW LEVEL SECURITY;

-- Users can see their own downloads
CREATE POLICY "Users can view own downloads"
  ON document_downloads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can log downloads
CREATE POLICY "Users can log downloads"
  ON document_downloads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE documentation
  SET download_count = download_count + 1
  WHERE id = NEW.document_id AND NEW.access_type = 'download';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update download count
DROP TRIGGER IF EXISTS trigger_increment_download_count ON document_downloads;
CREATE TRIGGER trigger_increment_download_count
  AFTER INSERT ON document_downloads
  FOR EACH ROW
  EXECUTE FUNCTION increment_download_count();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_documentation_updated_at ON documentation;
CREATE TRIGGER trigger_documentation_updated_at
  BEFORE UPDATE ON documentation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
