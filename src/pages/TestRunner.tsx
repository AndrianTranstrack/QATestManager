import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useTestContext } from '../context/TestContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Play, Check, AlertTriangle, Circle, ChevronRight, Upload, X } from 'lucide-react';
import { TestCase, DefectSeverity } from '../types';

type TestRunStatus = 'Pass' | 'Issue' | 'Not Run';

interface TestRunResult {
  testCaseId: string;
  status: TestRunStatus;
  notes?: string;
  defectId?: string;
}

const TestRunner: React.FC = () => {
  const { projects, testSuites, addDefect } = useData();
  const { testCases, getTestCasesBySuite } = useTestContext();
  const { user } = useAuth();

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedSuite, setSelectedSuite] = useState<string>('');
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testResults, setTestResults] = useState<TestRunResult[]>([]);
  const [showDefectForm, setShowDefectForm] = useState(false);
  const [currentTestCase, setCurrentTestCase] = useState<TestCase | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [currentTestRunId, setCurrentTestRunId] = useState<string | null>(null);
  const [runnerName, setRunnerName] = useState<string>('');

  const [defectFormData, setDefectFormData] = useState({
    title: '',
    description: '',
    severity: 'Medium' as DefectSeverity,
    assigned_to: '',
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const availableTestCases = useMemo(() => {
    if (!selectedSuite) return [];
    return getTestCasesBySuite(selectedSuite);
  }, [selectedSuite, getTestCasesBySuite]);

  const projectSuites = useMemo(() => {
    if (!selectedProject) return [];
    return testSuites.filter(s => s.project_id === selectedProject);
  }, [selectedProject, testSuites]);

  const selectedTestCasesList = useMemo(() => {
    return availableTestCases.filter(tc => selectedTestCases.has(tc.id));
  }, [availableTestCases, selectedTestCases]);

  const handleToggleTestCase = (testCaseId: string) => {
    const newSelected = new Set(selectedTestCases);
    if (newSelected.has(testCaseId)) {
      newSelected.delete(testCaseId);
    } else {
      newSelected.add(testCaseId);
    }
    setSelectedTestCases(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedTestCases(new Set(availableTestCases.map(tc => tc.id)));
  };

  const handleDeselectAll = () => {
    setSelectedTestCases(new Set());
  };

  const handleStartRun = async () => {
    if (selectedTestCasesList.length === 0 || !user) return;

    const suite = testSuites.find(s => s.id === selectedSuite);
    const project = projects.find(p => p.id === selectedProject);

    const testRunData = {
      user_id: user.id,
      project_id: selectedProject,
      suite_id: selectedSuite,
      title: `Test Run - ${suite?.name || 'Unknown'} - ${new Date().toLocaleString()}`,
      status: 'In Progress',
      executed_by: user.email || 'Unknown',
      runner_name: runnerName || user.email || 'Unknown',
      total_cases: selectedTestCasesList.length,
      passed_count: 0,
      failed_count: 0,
      blocked_count: 0,
    };

    const { data, error } = await supabase
      .from('test_runs')
      .insert(testRunData)
      .select()
      .single();

    if (!error && data) {
      setCurrentTestRunId(data.id);
      setIsRunning(true);
      setCurrentTestIndex(0);
      setTestResults([]);
      setShowSummary(false);
    }
  };

  const handleTestResult = async (status: TestRunStatus) => {
    const currentTest = selectedTestCasesList[currentTestIndex];

    if (status === 'Issue') {
      setCurrentTestCase(currentTest);
      setDefectFormData({
        title: `Issue in ${currentTest.title}`,
        description: '',
        severity: 'Medium',
        assigned_to: '',
      });
      setShowDefectForm(true);
    } else {
      const mappedStatus = status === 'Pass' ? 'Pass' : status === 'Issue' ? 'Failed' : 'Blocked';

      if (currentTestRunId && user) {
        await supabase.from('test_run_results').insert({
          test_run_id: currentTestRunId,
          test_case_id: currentTest.id,
          user_id: user.id,
          status: mappedStatus,
          test_case_snapshot: currentTest,
        });
      }

      const result: TestRunResult = {
        testCaseId: currentTest.id,
        status,
      };
      setTestResults([...testResults, result]);
      moveToNextTest();
    }
  };

  const moveToNextTest = async () => {
    if (currentTestIndex < selectedTestCasesList.length - 1) {
      setCurrentTestIndex(currentTestIndex + 1);
    } else {
      if (currentTestRunId) {
        const stats = {
          passed_count: testResults.filter(r => r.status === 'Pass').length + (testResults[testResults.length - 1]?.status === 'Pass' ? 1 : 0),
          failed_count: testResults.filter(r => r.status === 'Issue').length,
          blocked_count: testResults.filter(r => r.status === 'Not Run').length,
        };

        await supabase
          .from('test_runs')
          .update({
            status: 'Completed',
            completed_at: new Date().toISOString(),
            ...stats,
          })
          .eq('id', currentTestRunId);
      }
      setIsRunning(false);
      setShowSummary(true);
    }
  };

  const handleDefectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentTestCase || !selectedProject || !user) return;

    let evidenceUrl = '';
    let evidenceName = '';

    if (evidenceFile) {
      evidenceUrl = URL.createObjectURL(evidenceFile);
      evidenceName = evidenceFile.name;
    }

    const defect = await addDefect({
      project_id: selectedProject,
      test_case_id: currentTestCase.id,
      test_run_id: currentTestRunId || undefined,
      title: defectFormData.title,
      description: defectFormData.description,
      severity: defectFormData.severity,
      status: 'Open',
      assigned_to: defectFormData.assigned_to || undefined,
      evidence_url: evidenceUrl || undefined,
      evidence_name: evidenceName || undefined,
    });

    if (currentTestRunId) {
      const { data: defectData } = await supabase
        .from('defects')
        .select('id')
        .eq('test_case_id', currentTestCase.id)
        .eq('test_run_id', currentTestRunId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      await supabase.from('test_run_results').insert({
        test_run_id: currentTestRunId,
        test_case_id: currentTestCase.id,
        user_id: user.id,
        status: 'Failed',
        test_case_snapshot: currentTestCase,
        evidence_url: evidenceUrl || undefined,
        evidence_name: evidenceName || undefined,
        defect_id: defectData?.id,
        remarks: defectFormData.description,
      });
    }

    const result: TestRunResult = {
      testCaseId: currentTestCase.id,
      status: 'Issue',
      defectId: 'DEF-' + Date.now(),
    };

    setTestResults([...testResults, result]);
    setShowDefectForm(false);
    setCurrentTestCase(null);
    setEvidenceFile(null);
    moveToNextTest();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceFile(e.target.files[0]);
    }
  };

  const getStatusColor = (status: TestRunStatus) => {
    switch (status) {
      case 'Pass':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Issue':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Not Run':
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: TestRunStatus) => {
    switch (status) {
      case 'Pass':
        return <Check size={18} />;
      case 'Issue':
        return <AlertTriangle size={18} />;
      case 'Not Run':
        return <Circle size={18} />;
    }
  };

  const summaryStats = useMemo(() => {
    const passed = testResults.filter(r => r.status === 'Pass').length;
    const issues = testResults.filter(r => r.status === 'Issue').length;
    const notRun = testResults.filter(r => r.status === 'Not Run').length;
    const total = testResults.length;

    return { passed, issues, notRun, total };
  }, [testResults]);

  if (showSummary) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Test Run Summary</h1>
            <p className="text-slate-500 mb-8">Results for the completed test run</p>

            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                <div className="text-3xl font-bold text-slate-800 mb-1">{summaryStats.total}</div>
                <div className="text-sm text-slate-600">Total Tests</div>
              </div>
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-1">{summaryStats.passed}</div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <div className="text-3xl font-bold text-red-600 mb-1">{summaryStats.issues}</div>
                <div className="text-sm text-red-700">Issues</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                <div className="text-3xl font-bold text-amber-600 mb-1">{summaryStats.notRun}</div>
                <div className="text-sm text-amber-700">Not Run</div>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <h3 className="font-semibold text-slate-700 mb-4">Detailed Results</h3>
              {testResults.map((result) => {
                const testCase = selectedTestCasesList.find(tc => tc.id === result.testCaseId);
                if (!testCase) return null;

                return (
                  <div key={result.testCaseId} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <div className="font-medium text-slate-800">{testCase.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{testCase.id}</div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor(result.status)}`}>
                      {getStatusIcon(result.status)}
                      <span className="text-sm font-medium">{result.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSummary(false);
                  setSelectedSuite('');
                  setSelectedTestCases(new Set());
                  setTestResults([]);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Run
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isRunning) {
    const currentTest = selectedTestCasesList[currentTestIndex];
    const progress = ((currentTestIndex / selectedTestCasesList.length) * 100).toFixed(0);

    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-slate-800">Test Run in Progress</h2>
                <span className="text-sm text-slate-600">
                  {currentTestIndex + 1} of {selectedTestCasesList.length}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
                  {currentTest.id}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentTest.priority === 'High' ? 'bg-red-100 text-red-700' :
                  currentTest.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {currentTest.priority}
                </span>
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-4">{currentTest.title}</h3>
              <p className="text-slate-600 mb-6">{currentTest.description}</p>

              <div className="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200">
                <h4 className="font-semibold text-slate-700 mb-3">Steps to Execute:</h4>
                <ol className="space-y-2">
                  {currentTest.steps.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-slate-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Expected Result:</h4>
                <p className="text-green-700">{currentTest.expectedResult}</p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleTestResult('Pass')}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Check size={20} />
                Pass
              </button>
              <button
                onClick={() => handleTestResult('Issue')}
                className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
              >
                <AlertTriangle size={20} />
                Issue
              </button>
              <button
                onClick={() => handleTestResult('Not Run')}
                className="px-8 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Circle size={20} />
                Not Run
              </button>
            </div>
          </div>
        </div>

        {showDefectForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-2xl w-full my-8">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-slate-800">Report Defect</h2>
                <button
                  onClick={() => {
                    setShowDefectForm(false);
                    setCurrentTestCase(null);
                    setEvidenceFile(null);
                  }}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleDefectSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={defectFormData.title}
                    onChange={(e) => setDefectFormData({ ...defectFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    required
                    value={defectFormData.description}
                    onChange={(e) => setDefectFormData({ ...defectFormData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the issue, steps to reproduce, expected vs actual behavior..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Severity</label>
                  <select
                    value={defectFormData.severity}
                    onChange={(e) => setDefectFormData({ ...defectFormData, severity: e.target.value as DefectSeverity })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assigned To (Optional)
                  </label>
                  <input
                    type="text"
                    value={defectFormData.assigned_to}
                    onChange={(e) => setDefectFormData({ ...defectFormData, assigned_to: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Developer name or email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Upload Evidence (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept="image/*,video/*,.pdf"
                      className="hidden"
                      id="defect-evidence-upload"
                    />
                    <label
                      htmlFor="defect-evidence-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                    >
                      <Upload size={20} className="text-slate-400" />
                      <span className="text-sm text-slate-600">
                        {evidenceFile ? evidenceFile.name : 'Click to upload screenshot, video or document'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDefectForm(false);
                      setCurrentTestCase(null);
                      setEvidenceFile(null);
                    }}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Report Defect
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Test Runner</h1>
        <p className="text-slate-500 mt-1">Execute test cases and track results</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Configure Test Run</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Runner Name
                </label>
                <input
                  type="text"
                  value={runnerName}
                  onChange={(e) => setRunnerName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  1. Select Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    setSelectedSuite('');
                    setSelectedTestCases(new Set());
                  }}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  2. Select Test Suite
                </label>
                <select
                  value={selectedSuite}
                  onChange={(e) => {
                    setSelectedSuite(e.target.value);
                    setSelectedTestCases(new Set());
                  }}
                  disabled={!selectedProject}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Choose Test Suite</option>
                  {projectSuites.map((suite) => (
                    <option key={suite.id} value={suite.id}>
                      {suite.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedSuite && availableTestCases.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    3. Select Test Cases
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={handleSelectAll}
                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                  <div className="text-sm text-slate-600 mb-2">
                    {selectedTestCases.size} of {availableTestCases.length} selected
                  </div>
                </div>
              )}
            </div>

            {selectedTestCases.size > 0 && (
              <button
                onClick={handleStartRun}
                className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Play size={20} />
                Start Test Run
              </button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Available Test Cases</h3>

            {!selectedSuite ? (
              <div className="text-center py-12">
                <ChevronRight size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">Select a test suite to view available test cases</p>
              </div>
            ) : availableTestCases.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">No test cases found in this suite</p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableTestCases.map((testCase) => (
                  <div
                    key={testCase.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedTestCases.has(testCase.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => handleToggleTestCase(testCase.id)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTestCases.has(testCase.id)}
                        onChange={() => handleToggleTestCase(testCase.id)}
                        className="mt-1 w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-500">{testCase.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            testCase.priority === 'High' ? 'bg-red-100 text-red-700' :
                            testCase.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {testCase.priority}
                          </span>
                        </div>
                        <h4 className="font-medium text-slate-800">{testCase.title}</h4>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-1">{testCase.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRunner;
