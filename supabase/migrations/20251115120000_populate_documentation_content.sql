/*
  # Populate Documentation System with Content

  This migration reads the markdown files and populates the documentation table
  so users can actually download and read the system specifications.

  This solves the "0 docs" problem shown in the UI.
*/

-- First, ensure we have a default admin user profile for testing
-- (In production, this would be created through proper auth flow)
DO $$
DECLARE
  default_user_id uuid;
BEGIN
  -- Get the first user ID or create a placeholder
  SELECT id INTO default_user_id FROM auth.users LIMIT 1;

  IF default_user_id IS NULL THEN
    -- Create a placeholder user_id for the documentation creator
    default_user_id := gen_random_uuid();
  END IF;

  -- Insert/update documentation entries
  -- Complete System Specification
  INSERT INTO documentation (
    title, description, category, file_path, file_type, content,
    required_role, required_access_level, version, is_public, created_by
  ) VALUES (
    'Complete System Specification',
    'Comprehensive 25,000-word specification covering architecture, database schema, components, services, security, features, known issues, deployment, and roadmap.',
    'architecture',
    '/COMPLETE_SYSTEM_SPECIFICATION.md',
    'markdown',
    (SELECT pg_read_file('/tmp/cc-agent/60021502/project/COMPLETE_SYSTEM_SPECIFICATION.md')),
    ARRAY['admin', 'developer'],
    1,
    '1.0.0',
    true,
    default_user_id
  ) ON CONFLICT (title) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = now();

  -- Architecture Review
  INSERT INTO documentation (
    title, description, category, file_path, file_type, content,
    required_role, required_access_level, version, is_public, created_by
  ) VALUES (
    'System Architecture Review',
    'Root and branch architecture review identifying 78 tables, 27 services, critical security issues, and stabilization plan.',
    'architecture',
    '/ARCHITECTURE_REVIEW.md',
    'markdown',
    (SELECT pg_read_file('/tmp/cc-agent/60021502/project/ARCHITECTURE_REVIEW.md')),
    ARRAY['admin', 'developer'],
    2,
    '1.0.0',
    false,
    default_user_id
  ) ON CONFLICT (title) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = now();

  -- Executive Summary
  INSERT INTO documentation (
    title, description, category, file_path, file_type, content,
    required_role, required_access_level, version, is_public, created_by
  ) VALUES (
    'Executive Summary',
    'High-level overview for decision makers with status, recommendations, and next steps.',
    'governance',
    '/EXECUTIVE_SUMMARY.md',
    'markdown',
    (SELECT pg_read_file('/tmp/cc-agent/60021502/project/EXECUTIVE_SUMMARY.md')),
    ARRAY['admin', 'researcher'],
    1,
    '1.0.0',
    false,
    default_user_id
  ) ON CONFLICT (title) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = now();

  -- Immediate Action Plan
  INSERT INTO documentation (
    title, description, category, file_path, file_type, content,
    required_role, required_access_level, version, is_public, created_by
  ) VALUES (
    'Immediate Action Plan',
    'Stabilization roadmap with concrete fixes for critical issues and success criteria.',
    'governance',
    '/IMMEDIATE_ACTION_PLAN.md',
    'markdown',
    (SELECT pg_read_file('/tmp/cc-agent/60021502/project/IMMEDIATE_ACTION_PLAN.md')),
    ARRAY['admin', 'developer'],
    2,
    '1.0.0',
    false,
    default_user_id
  ) ON CONFLICT (title) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = now();

  -- Complete User Guide
  INSERT INTO documentation (
    title, description, category, file_path, file_type, content,
    required_role, required_access_level, version, is_public, created_by
  ) VALUES (
    'Complete User Guide',
    'Comprehensive guide for patients and users covering all system features.',
    'user_guide',
    '/COMPLETE_USER_GUIDE.md',
    'markdown',
    (SELECT pg_read_file('/tmp/cc-agent/60021502/project/COMPLETE_USER_GUIDE.md')),
    ARRAY['viewer', 'clinician', 'researcher', 'developer', 'admin'],
    1,
    '1.0.0',
    true,
    default_user_id
  ) ON CONFLICT (title) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = now();

  -- How to Use System
  INSERT INTO documentation (
    title, description, category, file_path, file_type, content,
    required_role, required_access_level, version, is_public, created_by
  ) VALUES (
    'How to Use the System',
    'Step-by-step instructions for main features and workflows.',
    'user_guide',
    '/HOW_TO_USE_SYSTEM.md',
    'markdown',
    (SELECT pg_read_file('/tmp/cc-agent/60021502/project/HOW_TO_USE_SYSTEM.md')),
    ARRAY['viewer', 'clinician', 'researcher', 'developer', 'admin'],
    1,
    '1.0.0',
    true,
    default_user_id
  ) ON CONFLICT (title) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = now();

  -- Dashboard Quick Start
  INSERT INTO documentation (
    title, description, category, file_path, file_type, content,
    required_role, required_access_level, version, is_public, created_by
  ) VALUES (
    'Dashboard Quick Start',
    'Quick start guide for navigating the dashboard interface.',
    'user_guide',
    '/DASHBOARD_QUICK_START.md',
    'markdown',
    (SELECT pg_read_file('/tmp/cc-agent/60021502/project/DASHBOARD_QUICK_START.md')),
    ARRAY['viewer', 'clinician', 'researcher', 'developer', 'admin'],
    1,
    '1.0.0',
    true,
    default_user_id
  ) ON CONFLICT (title) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = now();

  -- Add unique constraint on title if it doesn't exist
  ALTER TABLE documentation ADD CONSTRAINT IF NOT EXISTS documentation_title_unique UNIQUE (title);

END $$;
