import React, { useMemo, useState } from 'react';
import { useTestContext } from '../context/TestContext';
import { FileText, Play, CheckCircle2, XCircle, Plus, TrendingUp } from 'lucide-react';
import PieChart from '../components/charts/PieChart';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import { TimeFilter } from '../types';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { testCases, testResults } = useTestContext();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All Time');

  const filteredResults = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return testResults.filter((result) => {
      const resultDate = new Date(result.timestamp);

      switch (timeFilter) {
        case 'Today':
          return resultDate >= today;
        case 'This Week': {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return resultDate >= weekAgo;
        }
        case 'This Month': {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return resultDate >= monthAgo;
        }
        default:
          return true;
      }
    });
  }, [testResults, timeFilter]);

  const stats = useMemo(() => {
    const passed = filteredResults.filter((r) => r.status === 'Pass').length;
    const failed = filteredResults.filter((r) => r.status === 'Fail').length;
    const blocked = filteredResults.filter((r) => r.status === 'Blocked').length;
    const total = filteredResults.length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    return { passed, failed, blocked, total, passRate };
  }, [filteredResults]);

  const modules = useMemo(() => {
    const moduleSet = new Set(testCases.map((tc) => tc.module));
    return moduleSet.size;
  }, [testCases]);

  const barChartData = useMemo(() => {
    const moduleCounts: Record<string, { passed: number; failed: number; blocked: number }> = {};

    filteredResults.forEach((result) => {
      const testCase = testCases.find((tc) => tc.id === result.testCaseId);
      const module = testCase?.module || 'Other';

      if (!moduleCounts[module]) {
        moduleCounts[module] = { passed: 0, failed: 0, blocked: 0 };
      }

      if (result.status === 'Pass') moduleCounts[module].passed++;
      else if (result.status === 'Fail') moduleCounts[module].failed++;
      else moduleCounts[module].blocked++;
    });

    return Object.entries(moduleCounts).map(([label, counts]) => ({
      label,
      ...counts,
    }));
  }, [filteredResults, testCases]);

  const lineChartData = useMemo(() => {
    const dateMap: Record<string, number> = {};

    filteredResults.forEach((result) => {
      const date = new Date(result.timestamp);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
    });

    const sortedDates = Object.entries(dateMap)
      .sort(([a], [b]) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-7);

    return sortedDates.map(([label, value]) => ({ label, value }));
  }, [filteredResults]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 mt-1">Test management overview</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('testcases')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            Add Test Case
          </button>
          <button
            onClick={() => onNavigate('runner')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Play size={18} />
            Run Tests
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(['Today', 'This Week', 'This Month', 'All Time'] as TimeFilter[]).map((filter) => (
          <button
            key={filter}
            onClick={() => setTimeFilter(filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeFilter === filter
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Projects</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{modules}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Test Cases</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{testCases.length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="text-indigo-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Test Runs</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Play className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 font-medium">Pass Rate</p>
              <p className="text-3xl font-bold text-slate-800 mt-2">
                {stats.passRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Test Results Distribution</h2>
          <PieChart passed={stats.passed} failed={stats.failed} blocked={stats.blocked} />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Results by Module</h2>
          <BarChart data={barChartData} />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Test Execution Trend</h2>
        <LineChart data={lineChartData} color="#3b82f6" />
      </div>
    </div>
  );
};

export default Dashboard;
