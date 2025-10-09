/*
  # Update Test Runs Schema for Reports

  1. Changes to test_runs
    - Add test_case_snapshot column to test_run_results if not exists
    - Add share_token column to report_shares if not exists (it already exists)

  2. Security
    - Update RLS policies for public sharing via report_shares table
*/

-- Add test_case_snapshot column to test_run_results if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'test_run_results' AND column_name = 'test_case_snapshot'
  ) THEN
    ALTER TABLE test_run_results ADD COLUMN test_case_snapshot jsonb;
  END IF;
END $$;

-- Ensure report_shares has all necessary indexes
CREATE INDEX IF NOT EXISTS idx_report_shares_token ON report_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_report_shares_test_run ON report_shares(test_run_id);

-- Add RLS policy for public viewing via report_shares
DO $$
BEGIN
  -- Drop and recreate policy for test_runs public access
  DROP POLICY IF EXISTS "Public can view shared test runs via report_shares" ON test_runs;
  
  CREATE POLICY "Public can view shared test runs via report_shares"
    ON test_runs FOR SELECT
    TO anon, authenticated
    USING (
      EXISTS (
        SELECT 1 FROM report_shares
        WHERE report_shares.test_run_id = test_runs.id
      )
    );
END $$;

-- Add RLS policy for test_run_results public access via shares
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can view shared test run results via shares" ON test_run_results;
  
  CREATE POLICY "Public can view shared test run results via shares"
    ON test_run_results FOR SELECT
    TO anon, authenticated
    USING (
      EXISTS (
        SELECT 1 FROM report_shares
        WHERE report_shares.test_run_id = test_run_results.test_run_id
      )
    );
END $$;

-- Add RLS for report_shares itself
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can create report shares" ON report_shares;
  DROP POLICY IF EXISTS "Users can view own report shares" ON report_shares;
  DROP POLICY IF EXISTS "Public can view report shares by token" ON report_shares;
  
  CREATE POLICY "Users can create report shares"
    ON report_shares FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

  CREATE POLICY "Users can view own report shares"
    ON report_shares FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);

  CREATE POLICY "Public can view report shares by token"
    ON report_shares FOR SELECT
    TO anon, authenticated
    USING (share_token IS NOT NULL);
END $$;
