import React, { useState } from 'react';
import { useTestContext } from '../context/TestContext';
import { Play, Upload, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { TestCase, TestResultStatus } from '../types';

const TestRunner: React.FC = () => {
  const { testCases, addTestResult } = useTestContext();
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [actualResult, setActualResult] = useState('');
  const [resultStatus, setResultStatus] = useState<TestResultStatus>('Pass');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const activeTestCases = testCases.filter((tc) => tc.status === 'Active');

  const handleRunTest = (testCase: TestCase) => {
    setSelectedTestCase(testCase);
    setActualResult('');
    setResultStatus('Pass');
    setEvidenceFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTestCase) return;

    let evidenceUrl = '';
    let evidenceName = '';

    if (evidenceFile) {
      evidenceUrl = URL.createObjectURL(evidenceFile);
      evidenceName = evidenceFile.name;
    }

    const result = {
      testCaseId: selectedTestCase.id,
      testCaseTitle: selectedTestCase.title,
      testerName: 'QA User',
      status: resultStatus,
      actualResult,
      evidenceUrl,
      evidenceName,
      timestamp: new Date().toISOString(),
    };

    await addTestResult(result);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    setSelectedTestCase(null);
    setActualResult('');
    setResultStatus('Pass');
    setEvidenceFile(null);
  };

  const getStatusIcon = (status: TestResultStatus) => {
    switch (status) {
      case 'Pass':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'Fail':
        return <XCircle className="text-red-600" size={20} />;
      case 'Blocked':
        return <AlertCircle className="text-amber-600" size={20} />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Test Runner</h1>
        <p className="text-slate-500 mt-1">Execute test cases and record results</p>
      </div>

      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
          <CheckCircle size={20} />
          <span>Result saved successfully</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Active Test Cases</h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeTestCases.length} test case(s) ready to run
            </p>
          </div>
          <div className="divide-y divide-slate-200 max-h-[calc(100vh-16rem)] overflow-y-auto">
            {activeTestCases.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No active test cases available. Create test cases first.
              </div>
            ) : (
              activeTestCases.map((testCase) => (
                <div
                  key={testCase.id}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleRunTest(testCase)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-blue-600">
                          {testCase.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            testCase.priority === 'High'
                              ? 'bg-red-100 text-red-700'
                              : testCase.priority === 'Medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {testCase.priority}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-slate-800 mt-1">
                        {testCase.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {testCase.description}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunTest(testCase);
                      }}
                      className="ml-4 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Play size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Test Execution</h2>
            <p className="text-sm text-slate-500 mt-1">
              {selectedTestCase ? 'Record test results' : 'Select a test case to run'}
            </p>
          </div>
          {selectedTestCase ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-blue-800">
                    {selectedTestCase.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedTestCase.priority === 'High'
                        ? 'bg-red-100 text-red-700'
                        : selectedTestCase.priority === 'Medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {selectedTestCase.priority}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-3">
                  {selectedTestCase.title}
                </h3>

                <div className="mb-3">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Description</h4>
                  <p className="text-sm text-slate-600">{selectedTestCase.description}</p>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    Steps to Reproduce
                  </h4>
                  <ol className="list-decimal list-inside space-y-1">
                    {selectedTestCase.steps.map((step, index) => (
                      <li key={index} className="text-sm text-slate-600">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    Expected Result
                  </h4>
                  <p className="text-sm text-slate-600">
                    {selectedTestCase.expectedResult}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Actual Result
                </label>
                <textarea
                  required
                  value={actualResult}
                  onChange={(e) => setActualResult(e.target.value)}
                  rows={4}
                  placeholder="Describe what actually happened during the test..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Test Result
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Pass', 'Fail', 'Blocked'] as TestResultStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setResultStatus(status)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        resultStatus === status
                          ? status === 'Pass'
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : status === 'Fail'
                            ? 'border-red-600 bg-red-50 text-red-700'
                            : 'border-amber-600 bg-amber-50 text-amber-700'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {getStatusIcon(status)}
                      <span className="font-medium">{status}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Upload Evidence
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                    id="evidence-upload"
                  />
                  <label
                    htmlFor="evidence-upload"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                  >
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {evidenceFile ? evidenceFile.name : 'Click to upload file'}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: JPG, PNG, PDF
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedTestCase(null)}
                  className="flex-1 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Submit Result
                </button>
              </div>
            </form>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <Play size={48} className="mx-auto mb-4 text-slate-300" />
              <p>Select a test case from the left to start testing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestRunner;
