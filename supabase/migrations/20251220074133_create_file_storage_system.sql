/*
  # File Storage System for Project Export

  ## Overview
  This migration creates a comprehensive file storage system to capture the entire project structure,
  including all files, their content, and metadata. This enables full project export to zip files.

  ## New Tables
  
  ### `project_files`
  Stores all project files with their complete content and metadata
  - `id` (uuid, primary key) - Unique identifier for each file record
  - `file_path` (text, unique) - Full path of the file relative to project root
  - `file_name` (text) - Name of the file
  - `file_extension` (text) - File extension (e.g., 'ts', 'tsx', 'json')
  - `content` (text) - Full content of the file
  - `content_type` (text) - MIME type of the file
  - `file_size` (bigint) - Size of the file in bytes
  - `is_binary` (boolean) - Whether the file is binary
  - `directory_path` (text) - Directory path containing the file
  - `created_at` (timestamptz) - When the record was created
  - `updated_at` (timestamptz) - When the record was last updated
  
  ### `project_structure`
  Stores the directory structure of the project
  - `id` (uuid, primary key) - Unique identifier
  - `path` (text, unique) - Directory path
  - `parent_path` (text) - Parent directory path
  - `depth` (integer) - Depth level in directory tree
  - `created_at` (timestamptz) - When created
  
  ### `export_snapshots`
  Tracks export/snapshot operations
  - `id` (uuid, primary key) - Unique identifier
  - `snapshot_name` (text) - Name of the snapshot
  - `file_count` (integer) - Number of files in snapshot
  - `total_size` (bigint) - Total size of all files
  - `created_at` (timestamptz) - When snapshot was created
  - `metadata` (jsonb) - Additional metadata about the snapshot

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to manage their project files
*/

-- Create project_files table
CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text UNIQUE NOT NULL,
  file_name text NOT NULL,
  file_extension text,
  content text,
  content_type text,
  file_size bigint DEFAULT 0,
  is_binary boolean DEFAULT false,
  directory_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_structure table
CREATE TABLE IF NOT EXISTS project_structure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text UNIQUE NOT NULL,
  parent_path text,
  depth integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create export_snapshots table
CREATE TABLE IF NOT EXISTS export_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_name text NOT NULL,
  file_count integer DEFAULT 0,
  total_size bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies for project_files
CREATE POLICY "Authenticated users can view project files"
  ON project_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert project files"
  ON project_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update project files"
  ON project_files FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project files"
  ON project_files FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for project_structure
CREATE POLICY "Authenticated users can view project structure"
  ON project_structure FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert project structure"
  ON project_structure FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update project structure"
  ON project_structure FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project structure"
  ON project_structure FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for export_snapshots
CREATE POLICY "Authenticated users can view export snapshots"
  ON export_snapshots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create export snapshots"
  ON export_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_files_path ON project_files(file_path);
CREATE INDEX IF NOT EXISTS idx_project_files_directory ON project_files(directory_path);
CREATE INDEX IF NOT EXISTS idx_project_files_extension ON project_files(file_extension);
CREATE INDEX IF NOT EXISTS idx_project_structure_path ON project_structure(path);
CREATE INDEX IF NOT EXISTS idx_project_structure_parent ON project_structure(parent_path);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_project_files_updated_at
  BEFORE UPDATE ON project_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();