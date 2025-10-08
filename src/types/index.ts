export type Priority = 'Low' | 'Medium' | 'High';
export type TestCaseStatus = 'Draft' | 'Active' | 'Deprecated';
export type TestResultStatus = 'Pass' | 'Fail' | 'Blocked';
export type TimeFilter = 'Today' | 'This Week' | 'This Month' | 'All Time';

export interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
  priority: Priority;
  status: TestCaseStatus;
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
