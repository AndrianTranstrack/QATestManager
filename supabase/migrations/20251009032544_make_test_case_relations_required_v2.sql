/*
  # Make Test Case Relations Required

  1. Changes
    - Make project_id and suite_id NOT NULL in test_cases table
    - This ensures every test case MUST belong to a project and a suite
    - Maintains referential integrity with cascading deletes

  2. Important Notes
    - Any existing test cases without project_id or suite_id will be deleted
*/

-- First, delete any test cases that don't have proper relations
DELETE FROM test_cases WHERE project_id IS NULL OR suite_id IS NULL;

-- Now make the columns NOT NULL
DO $$
BEGIN
  -- Make project_id NOT NULL if it isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_cases' 
    AND column_name = 'project_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE test_cases ALTER COLUMN project_id SET NOT NULL;
  END IF;

  -- Make suite_id NOT NULL if it isn't already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_cases' 
    AND column_name = 'suite_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE test_cases ALTER COLUMN suite_id SET NOT NULL;
  END IF;
END $$;
