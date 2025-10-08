/*
  # Test Management Application Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `test_cases`
      - `id` (text, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `steps` (jsonb array)
      - `expected_result` (text)
      - `priority` (text: Low, Medium, High)
      - `status` (text: Draft, Active, Deprecated)
      - `module` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `test_results`
      - `id` (text, primary key)
      - `user_id` (uuid, references profiles)
      - `test_case_id` (text, references test_cases)
      - `test_case_title` (text)
      - `tester_name` (text)
      - `status` (text: Pass, Fail, Blocked)
      - `actual_result` (text)
      - `evidence_url` (text)
      - `evidence_name` (text)
      - `timestamp` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Policies for SELECT, INSERT, UPDATE, DELETE on all tables
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS test_cases (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  steps jsonb DEFAULT '[]'::jsonb,
  expected_result text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
  status text NOT NULL CHECK (status IN ('Draft', 'Active', 'Deprecated')),
  module text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own test cases"
  ON test_cases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test cases"
  ON test_cases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test cases"
  ON test_cases FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own test cases"
  ON test_cases FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS test_results (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  test_case_id text NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
  test_case_title text NOT NULL,
  tester_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('Pass', 'Fail', 'Blocked')),
  actual_result text NOT NULL,
  evidence_url text,
  evidence_name text,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own test results"
  ON test_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test results"
  ON test_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own test results"
  ON test_results FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own test results"
  ON test_results FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_test_cases_user_id ON test_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_case_id ON test_results(test_case_id);
