import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import {
  Download, Share2, Filter, Eye, ChevronDown, ChevronRight, FileText,
  ExternalLink, Copy, Check, AlertTriangle
} from 'lucide-react';
import { TestRun, TestRunResult, Defect } from '../types';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const { projects, testSuites } = useData();
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [runResults, setRunResults] = useState<TestRunResult[]>([]);
  const [runDefects, setRunDefects] = useState<Defect[]>([]);
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(new Set());
  const [shareLink, setShareLink] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTestRuns();
    }
  }, [user]);

  const fetchTestRuns = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('test_runs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTestRuns(data);
    }
    setLoading(false);
  };

  const fetchRunDetails = async (runId: string) => {
    const { data: results } = await supabase
      .from('test_run_results')
      .select('*')
      .eq('test_run_id', runId);

    const { data: defects } = await supabase
      .from('defects')
      .select('*')
      .eq('test_run_id', runId);

    if (results) setRunResults(results);
    if (defects) setRunDefects(defects);
  };

  const toggleRunExpansion = async (run: TestRun) => {
    const newExpanded = new Set(expandedRuns);
    if (newExpanded.has(run.id)) {
      newExpanded.delete(run.id);
      setSelectedRun(null);
    } else {
      newExpanded.add(run.id);
      setSelectedRun(run);
      await fetchRunDetails(run.id);
    }
    setExpandedRuns(newExpanded);
  };

  const handleGenerateShareLink = async (run: TestRun) => {
    if (!user) return;

    const shareToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const { error } = await supabase
      .from('report_shares')
      .insert({
        test_run_id: run.id,
        share_token: shareToken,
        created_by: user.id,
      });

    if (!error) {
      const link = `${window.location.origin}/shared-report/${shareToken}`;
      setShareLink(link);
      setShowShareModal(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async (run: TestRun) => {
    await fetchRunDetails(run.id);

    const project = projects.find(p => p.id === run.project_id);
    const suite = testSuites.find(s => s.id === run.suite_id);

    const pdfContent = `
      TEST RUN REPORT

      Project: ${project?.name || 'Unknown'}
      Test Suite: ${suite?.name || 'Unknown'}
      Executed By: ${run.executed_by}
      Date: ${new Date(run.started_at).toLocaleString()}

      SUMMARY:
      Total Cases: ${run.total_cases}
      Passed: ${run.passed_count}
      Failed: ${run.failed_count}
      Blocked: ${run.blocked_count}

      Pass Rate: ${((run.passed_count || 0) / (run.total_cases || 1) * 100).toFixed(1)}%
    `;

    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-report-${run.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Blocked':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-slate-500">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Test Reports</h1>
        <p className="text-slate-500 mt-1">View and manage test execution reports</p>
      </div>

      {testRuns.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <FileText size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Test Reports Yet</h3>
          <p className="text-slate-500">Execute test runs to see reports here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testRuns.map((run) => {
            const project = projects.find(p => p.id === run.project_id);
            const suite = testSuites.find(s => s.id === run.suite_id);
            const isExpanded = expandedRuns.has(run.id);
            const passRate = ((run.passed_count || 0) / (run.total_cases || 1) * 100).toFixed(1);

            return (
              <div key={run.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          onClick={() => toggleRunExpansion(run)}
                          className="p-1 hover:bg-slate-100 rounded transition-colors"
                        >
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </button>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">{run.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <strong>Project:</strong> {project?.name || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <strong>Suite:</strong> {suite?.name || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <strong>Runner:</strong> {run.runner_name || run.executed_by}
                            </span>
                            <span className="flex items-center gap-1">
                              <strong>Date:</strong> {new Date(run.started_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-4 mt-4">
                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="text-2xl font-bold text-slate-800">{run.total_cases || 0}</div>
                          <div className="text-xs text-slate-600">Total</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <div className="text-2xl font-bold text-green-600">{run.passed_count || 0}</div>
                          <div className="text-xs text-green-700">Passed</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                          <div className="text-2xl font-bold text-red-600">{run.failed_count || 0}</div>
                          <div className="text-xs text-red-700">Failed</div>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                          <div className="text-2xl font-bold text-amber-600">{run.blocked_count || 0}</div>
                          <div className="text-xs text-amber-700">Blocked</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="text-2xl font-bold text-blue-600">{passRate}%</div>
                          <div className="text-xs text-blue-700">Pass Rate</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => toggleRunExpansion(run)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleExportPDF(run)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Export PDF"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => handleGenerateShareLink(run)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Generate Share Link"
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && selectedRun?.id === run.id && (
                  <div className="border-t border-slate-200 bg-slate-50 p-6">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FileText size={16} />
                      Test Case Results
                    </h4>

                    {runResults.length === 0 ? (
                      <p className="text-slate-500 text-center py-8">No results found for this test run</p>
                    ) : (
                      <div className="space-y-3">
                        {runResults.map((result) => {
                          const testCase = result.test_case_snapshot;
                          const defect = runDefects.find(d => d.id === result.defect_id);

                          return (
                            <div key={result.id} className="bg-white rounded-lg p-4 border border-slate-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-mono text-slate-500">
                                      {testCase?.id || result.test_case_id}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(result.status)}`}>
                                      {result.status}
                                    </span>
                                    {testCase?.priority && (
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        testCase.priority === 'High' ? 'bg-red-100 text-red-700' :
                                        testCase.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {testCase.priority}
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="font-medium text-slate-800 mb-1">
                                    {testCase?.title || 'Unknown Test Case'}
                                  </h5>
                                  <p className="text-sm text-slate-600 mb-2">
                                    {testCase?.description || ''}
                                  </p>

                                  {result.remarks && (
                                    <div className="mt-2 p-2 bg-slate-50 rounded text-sm text-slate-700">
                                      <strong>Notes:</strong> {result.remarks}
                                    </div>
                                  )}

                                  {result.evidence_name && (
                                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                                      <FileText size={14} />
                                      <span>Evidence: {result.evidence_name}</span>
                                    </div>
                                  )}

                                  {defect && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                      <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle size={16} className="text-red-600" />
                                        <span className="font-semibold text-red-800">Linked Defect</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                          defect.severity === 'Critical' ? 'bg-red-200 text-red-900' :
                                          defect.severity === 'High' ? 'bg-orange-200 text-orange-900' :
                                          defect.severity === 'Medium' ? 'bg-amber-200 text-amber-900' :
                                          'bg-yellow-200 text-yellow-900'
                                        }`}>
                                          {defect.severity}
                                        </span>
                                      </div>
                                      <p className="text-sm font-medium text-red-900 mb-1">{defect.title}</p>
                                      <p className="text-xs text-red-700">{defect.description}</p>
                                      {defect.assigned_to && (
                                        <p className="text-xs text-red-600 mt-2">
                                          Assigned to: {defect.assigned_to}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-slate-400 mt-2">
                                Executed: {new Date(result.executed_at).toLocaleString()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Share Report</h3>
            <p className="text-sm text-slate-600 mb-4">
              Anyone with this link can view the full test report without logging in.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <ExternalLink size={16} />
                Open Link
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
