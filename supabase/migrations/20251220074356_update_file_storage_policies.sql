/*
  # Update File Storage Policies

  ## Changes
  - Update RLS policies to allow public access for system operations
  - This enables import scripts to populate the file storage system
  
  ## Security Notes
  - These policies allow unrestricted access for data import/export operations
  - In production, you may want to restrict these based on specific roles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view project files" ON project_files;
DROP POLICY IF EXISTS "Authenticated users can insert project files" ON project_files;
DROP POLICY IF EXISTS "Authenticated users can update project files" ON project_files;
DROP POLICY IF EXISTS "Authenticated users can delete project files" ON project_files;

DROP POLICY IF EXISTS "Authenticated users can view project structure" ON project_structure;
DROP POLICY IF EXISTS "Authenticated users can insert project structure" ON project_structure;
DROP POLICY IF EXISTS "Authenticated users can update project structure" ON project_structure;
DROP POLICY IF EXISTS "Authenticated users can delete project structure" ON project_structure;

DROP POLICY IF EXISTS "Authenticated users can view export snapshots" ON export_snapshots;
DROP POLICY IF EXISTS "Authenticated users can create export snapshots" ON export_snapshots;

-- Create new policies with public access
CREATE POLICY "Public can view project files"
  ON project_files FOR SELECT
  USING (true);

CREATE POLICY "Public can insert project files"
  ON project_files FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update project files"
  ON project_files FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete project files"
  ON project_files FOR DELETE
  USING (true);

CREATE POLICY "Public can view project structure"
  ON project_structure FOR SELECT
  USING (true);

CREATE POLICY "Public can insert project structure"
  ON project_structure FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update project structure"
  ON project_structure FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete project structure"
  ON project_structure FOR DELETE
  USING (true);

CREATE POLICY "Public can view export snapshots"
  ON export_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Public can create export snapshots"
  ON export_snapshots FOR INSERT
  WITH CHECK (true);