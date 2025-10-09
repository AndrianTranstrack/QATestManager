import React, { useState, useMemo } from 'react';
import { useTestContext } from '../context/TestContext';
import { useData } from '../context/DataContext';
import { Plus, Search, Edit2, Trash2, X, Eye } from 'lucide-react';
import { TestCase, Priority, TestCaseStatus, TestCaseType } from '../types';

const TestCases: React.FC = () => {
  const { testCases, addTestCase, updateTestCase, deleteTestCase } = useTestContext();
  const { projects, testSuites } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<TestCaseStatus | 'All'>('All');
  const [viewingCase, setViewingCase] = useState<TestCase | null>(null);

  const [formData, setFormData] = useState({
    project_id: '',
    suite_id: '',
    title: '',
    description: '',
    steps: [''],
    expectedResult: '',
    priority: 'Medium' as Priority,
    status: 'Active' as TestCaseStatus,
    type: 'Functional' as TestCaseType,
    module: '',
  });

  const filteredTestCases = useMemo(() => {
    return testCases.filter((tc) => {
      const matchesSearch =
        tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tc.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'All' || tc.priority === filterPriority;
      const matchesStatus = filterStatus === 'All' || tc.status === filterStatus;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [testCases, searchTerm, filterPriority, filterStatus]);

  const handleOpenModal = (testCase?: TestCase) => {
    if (testCase) {
      setEditingId(testCase.id);
      setFormData({
        project_id: testCase.project_id || '',
        suite_id: testCase.suite_id || '',
        title: testCase.title,
        description: testCase.description,
        steps: testCase.steps,
        expectedResult: testCase.expectedResult,
        priority: testCase.priority,
        status: testCase.status,
        type: testCase.type,
        module: testCase.module,
      });
    } else {
      setEditingId(null);
      setFormData({
        project_id: '',
        suite_id: '',
        title: '',
        description: '',
        steps: [''],
        expectedResult: '',
        priority: 'Medium',
        status: 'Active',
        type: 'Functional',
        module: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const filteredSteps = formData.steps.filter((s) => s.trim() !== '');

    if (editingId) {
      await updateTestCase(editingId, {
        ...formData,
        steps: filteredSteps,
      });
    } else {
      await addTestCase({
        ...formData,
        steps: filteredSteps,
      });
    }

    handleCloseModal();
  };

  const handleAddStep = () => {
    setFormData({ ...formData, steps: [...formData.steps, ''] });
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    setFormData({ ...formData, steps: newSteps });
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = value;
    setFormData({ ...formData, steps: newSteps });
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700';
      case 'Medium':
        return 'bg-amber-100 text-amber-700';
      case 'Low':
        return 'bg-green-100 text-green-700';
    }
  };

  const getStatusColor = (status: TestCaseStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-blue-100 text-blue-700';
      case 'Draft':
        return 'bg-slate-100 text-slate-700';
      case 'Deprecated':
        return 'bg-red-100 text-red-700';
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Test Cases</h1>
          <p className="text-slate-500 mt-1">Manage your test cases</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Add Test Case
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search test cases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as Priority | 'All')}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TestCaseStatus | 'All')}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
            <option value="Deprecated">Deprecated</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Suite</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTestCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No test cases found. Click "Add Test Case" to create one.
                  </td>
                </tr>
              ) : (
                filteredTestCases.map((testCase) => {
                  const project = projects.find(p => p.id === testCase.project_id);
                  const suite = testSuites.find(s => s.id === testCase.suite_id);
                  return (
                  <tr key={testCase.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{testCase.id}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">{testCase.title}</div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {testCase.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {project ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {project.code}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{suite?.name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(testCase.priority)}`}>
                        {testCase.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(testCase.status)}`}>
                        {testCase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingCase(testCase)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleOpenModal(testCase)}
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteTestCase(testCase.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Test Case' : 'Add Test Case'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value, suite_id: '' })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingId}
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Test Suite <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.suite_id}
                  onChange={(e) => setFormData({ ...formData, suite_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!formData.project_id || !!editingId}
                >
                  <option value="">Select Test Suite</option>
                  {testSuites
                    .filter(s => s.project_id === formData.project_id)
                    .map((suite) => (
                      <option key={suite.id} value={suite.id}>
                        {suite.name}
                      </option>
                    ))}
                </select>
                {formData.project_id && testSuites.filter(s => s.project_id === formData.project_id).length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No test suites available for this project. Create a test suite first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Test Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TestCaseType })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Functional">Functional</option>
                  <option value="Regression">Regression</option>
                  <option value="Integration">Integration</option>
                  <option value="Performance">Performance</option>
                  <option value="Security">Security</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Module</label>
                <input
                  type="text"
                  value={formData.module}
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional module name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Steps to Reproduce</label>
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Add Step
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Expected Result</label>
                <textarea
                  required
                  value={formData.expectedResult}
                  onChange={(e) => setFormData({ ...formData, expectedResult: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TestCaseStatus })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">{viewingCase.id} - {viewingCase.title}</h2>
              <button
                onClick={() => setViewingCase(null)}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                <p className="text-slate-600">{viewingCase.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Module</h3>
                <p className="text-slate-600">{viewingCase.module || '-'}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Steps to Reproduce</h3>
                <ol className="list-decimal list-inside space-y-1">
                  {viewingCase.steps.map((step, index) => (
                    <li key={index} className="text-slate-600">{step}</li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Expected Result</h3>
                <p className="text-slate-600">{viewingCase.expectedResult}</p>
              </div>

              <div className="flex gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Priority</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(viewingCase.priority)}`}>
                    {viewingCase.priority}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Status</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingCase.status)}`}>
                    {viewingCase.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCases;
