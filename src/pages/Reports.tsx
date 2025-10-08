import React, { useState, useMemo } from 'react';
import { useTestContext } from '../context/TestContext';
import { Download, Share2, Filter, CheckCircle, XCircle, AlertCircle, Eye, ExternalLink } from 'lucide-react';
import { TestResultStatus } from '../types';

const Reports: React.FC = () => {
  const { testResults, getTestCaseById } = useTestContext();
  const [filterStatus, setFilterStatus] = useState<TestResultStatus | 'All'>('All');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');

  const filteredResults = useMemo(() => {
    if (filterStatus === 'All') return testResults;
    return testResults.filter((r) => r.status === filterStatus);
  }, [testResults, filterStatus]);

  const handleExportCSV = () => {
    const headers = ['Test Case ID', 'Test Title', 'Tester Name', 'Status', 'Actual Result', 'Timestamp'];
    const rows = filteredResults.map((result) => [
      result.testCaseId,
      result.testCaseTitle,
      result.testerName,
      result.status,
      result.actualResult,
      new Date(result.timestamp).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-results-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleShareResults = () => {
    const shareId = Math.random().toString(36).substring(2, 15);
    const link = `${window.location.origin}/report/demo/${shareId}`;
    setShareLink(link);
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
  };

  const getStatusIcon = (status: TestResultStatus) => {
    switch (status) {
      case 'Pass':
        return <CheckCircle className="text-green-600" size={18} />;
      case 'Fail':
        return <XCircle className="text-red-600" size={18} />;
      case 'Blocked':
        return <AlertCircle className="text-amber-600" size={18} />;
    }
  };

  const getStatusBadge = (status: TestResultStatus) => {
    const colors = {
      Pass: 'bg-green-100 text-green-700',
      Fail: 'bg-red-100 text-red-700',
      Blocked: 'bg-amber-100 text-amber-700',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]} flex items-center gap-1 w-fit`}>
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  const stats = useMemo(() => {
    const passed = filteredResults.filter((r) => r.status === 'Pass').length;
    const failed = filteredResults.filter((r) => r.status === 'Fail').length;
    const blocked = filteredResults.filter((r) => r.status === 'Blocked').length;
    return { passed, failed, blocked };
  }, [filteredResults]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Test Reports</h1>
          <p className="text-slate-500 mt-1">View and export test results</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredResults.length === 0}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button
            onClick={handleShareResults}
            disabled={filteredResults.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 size={18} />
            Share Results
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Passed</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.passed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Failed</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.failed}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Blocked</p>
              <p className="text-3xl font-bold text-amber-600 mt-2">{stats.blocked}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="text-amber-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6">
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Filter size={18} className="text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TestResultStatus | 'All')}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Results</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
            <option value="Blocked">Blocked</option>
          </select>
          <span className="text-sm text-slate-500">
            {filteredResults.length} result(s) found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Test Case ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Test Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Tester
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Actual Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Evidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No test results available. Run tests to see results here.
                  </td>
                </tr>
              ) : (
                filteredResults
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((result) => (
                    <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">
                        {result.testCaseId}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-800">
                          {result.testCaseTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{result.testerName}</td>
                      <td className="px-6 py-4">{getStatusBadge(result.status)}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 max-w-xs truncate">
                          {result.actualResult}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {result.evidenceUrl ? (
                          <a
                            href={result.evidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            <Eye size={14} />
                            {result.evidenceName}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(result.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Share Test Results</h2>
              <p className="text-sm text-slate-500 mt-1">
                Share this read-only link with your team
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-3">
                <ExternalLink size={20} className="text-slate-400 flex-shrink-0" />
                <code className="text-sm text-slate-700 flex-1 break-all">{shareLink}</code>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
              <p className="text-xs text-slate-500 text-center">
                This is a demo link. In production, this would provide secure, read-only access to test results.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
