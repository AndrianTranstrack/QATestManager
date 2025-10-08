import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { TestCase, TestResult } from '../types';

interface TestContextType {
  testCases: TestCase[];
  testResults: TestResult[];
  loading: boolean;
  addTestCase: (testCase: Omit<TestCase, 'id' | 'createdAt'>) => Promise<void>;
  updateTestCase: (id: string, testCase: Partial<TestCase>) => Promise<void>;
  deleteTestCase: (id: string) => Promise<void>;
  addTestResult: (result: Omit<TestResult, 'id'>) => Promise<void>;
  getTestCaseById: (id: string) => TestCase | undefined;
  refreshData: () => Promise<void>;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

export const useTestContext = () => {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTestContext must be used within TestProvider');
  }
  return context;
};

export const TestProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTestCases = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('test_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedData = data.map((tc) => ({
        id: tc.id,
        title: tc.title,
        description: tc.description,
        steps: tc.steps as string[],
        expectedResult: tc.expected_result,
        priority: tc.priority,
        status: tc.status,
        module: tc.module,
        createdAt: tc.created_at,
      }));
      setTestCases(formattedData);
    }
  };

  const fetchTestResults = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .order('timestamp', { ascending: false });

    if (!error && data) {
      const formattedData = data.map((tr) => ({
        id: tr.id,
        testCaseId: tr.test_case_id,
        testCaseTitle: tr.test_case_title,
        testerName: tr.tester_name,
        status: tr.status,
        actualResult: tr.actual_result,
        evidenceUrl: tr.evidence_url,
        evidenceName: tr.evidence_name,
        timestamp: tr.timestamp,
      }));
      setTestResults(formattedData);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchTestCases(), fetchTestResults()]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setTestCases([]);
      setTestResults([]);
      setLoading(false);
    }
  }, [user]);

  const addTestCase = async (testCase: Omit<TestCase, 'id' | 'createdAt'>) => {
    if (!user) return;

    const testCaseCount = testCases.length + 1;
    const newId = `TC-${String(testCaseCount).padStart(3, '0')}`;

    const { error } = await supabase.from('test_cases').insert({
      id: newId,
      user_id: user.id,
      title: testCase.title,
      description: testCase.description,
      steps: testCase.steps,
      expected_result: testCase.expectedResult,
      priority: testCase.priority,
      status: testCase.status,
      module: testCase.module,
    });

    if (!error) {
      await fetchTestCases();
    }
  };

  const updateTestCase = async (id: string, updates: Partial<TestCase>) => {
    if (!user) return;

    const dbUpdates: any = {};
    if (updates.title) dbUpdates.title = updates.title;
    if (updates.description) dbUpdates.description = updates.description;
    if (updates.steps) dbUpdates.steps = updates.steps;
    if (updates.expectedResult) dbUpdates.expected_result = updates.expectedResult;
    if (updates.priority) dbUpdates.priority = updates.priority;
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.module) dbUpdates.module = updates.module;
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('test_cases')
      .update(dbUpdates)
      .eq('id', id);

    if (!error) {
      await fetchTestCases();
    }
  };

  const deleteTestCase = async (id: string) => {
    if (!user) return;

    const { error } = await supabase.from('test_cases').delete().eq('id', id);

    if (!error) {
      await fetchTestCases();
    }
  };

  const addTestResult = async (result: Omit<TestResult, 'id'>) => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const testerName = profileData?.full_name || 'QA User';

    const newId = `TR-${Date.now()}`;

    const { error } = await supabase.from('test_results').insert({
      id: newId,
      user_id: user.id,
      test_case_id: result.testCaseId,
      test_case_title: result.testCaseTitle,
      tester_name: testerName,
      status: result.status,
      actual_result: result.actualResult,
      evidence_url: result.evidenceUrl,
      evidence_name: result.evidenceName,
      timestamp: result.timestamp,
    });

    if (!error) {
      await fetchTestResults();
    }
  };

  const getTestCaseById = (id: string) => {
    return testCases.find((tc) => tc.id === id);
  };

  return (
    <TestContext.Provider
      value={{
        testCases,
        testResults,
        loading,
        addTestCase,
        updateTestCase,
        deleteTestCase,
        addTestResult,
        getTestCaseById,
        refreshData,
      }}
    >
      {children}
    </TestContext.Provider>
  );
};
