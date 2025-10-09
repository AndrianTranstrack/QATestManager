export type Priority = 'Low' | 'Medium' | 'High';
export type TestCaseStatus = 'Draft' | 'Active' | 'Deprecated';
export type TestResultStatus = 'Pass' | 'Fail' | 'Blocked';
export type TestCaseType = 'Functional' | 'Regression' | 'Integration' | 'Performance' | 'Security';
export type DefectSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type DefectStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TimeFilter = 'Today' | 'This Week' | 'This Month' | 'All Time';

export interface TestCase {
  id: string;
  project_id: string;
  suite_id: string;
  user_id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  priority: Priority;
  status: TestCaseStatus;
  type: TestCaseType;
  module: string;
  createdAt: string;
}

export interface TestResult {
  id: string;
  testCaseId: string;
  testCaseTitle: string;
  testerName: string;
  status: TestResultStatus;
  actualResult: string;
  evidenceUrl?: string;
  evidenceName?: string;
  timestamp: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalTestCases: number;
  totalTestRuns: number;
  passRate: number;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface TestSuite {
  id: string;
  project_id: string;
  parent_suite_id?: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Defect {
  id: string;
  project_id: string;
  test_case_id?: string;
  test_run_id?: string;
  user_id: string;
  title: string;
  description: string;
  severity: DefectSeverity;
  status: DefectStatus;
  assigned_to?: string;
  evidence_url?: string;
  evidence_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TestRun {
  id: string;
  user_id: string;
  project_id: string;
  suite_id: string;
  title: string;
  status: string;
  executed_by: string;
  runner_name?: string;
  started_at: string;
  finished_at?: string;
  completed_at?: string;
  total_cases?: number;
  passed_count?: number;
  failed_count?: number;
  blocked_count?: number;
  created_at: string;
}

export interface TestRunResult {
  id: string;
  test_run_id: string;
  test_case_id: string;
  user_id: string;
  status: string;
  actual_result?: string;
  remarks?: string;
  evidence_url?: string;
  evidence_name?: string;
  defect_id?: string;
  test_case_snapshot?: any;
  executed_at: string;
  created_at: string;
}

export interface ReportShare {
  id: string;
  test_run_id: string;
  share_token: string;
  created_by: string;
  created_at: string;
  expires_at?: string;
}
