import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useTestContext } from '../context/TestContext';
import { Plus, Edit2, Trash2, X, FolderTree, ChevronRight, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { TestSuite } from '../types';

const TestSuites: React.FC = () => {
  const { testSuites, projects, addTestSuite, updateTestSuite, deleteTestSuite, getSubSuites } = useData();
  const { testCases, loading: testCasesLoading } = useTestContext();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());

  console.log('TestSuites - testCases:', testCases);

  const [formData, setFormData] = useState({
    project_id: '',
    parent_suite_id: '',
    name: '',
    description: '',
  });

  const filteredSuites = useMemo(() => {
    if (!selectedProject) return testSuites;
    return testSuites.filter(suite => suite.project_id === selectedProject);
  }, [testSuites, selectedProject]);

  const rootSuites = useMemo(() => {
    return filteredSuites.filter(suite => !suite.parent_suite_id);
  }, [filteredSuites]);

  const handleOpenModal = (suite?: TestSuite, parentId?: string) => {
    if (suite) {
      setEditingId(suite.id);
      setFormData({
        project_id: suite.project_id,
        parent_suite_id: suite.parent_suite_id || '',
        name: suite.name,
        description: suite.description,
      });
    } else {
      setEditingId(null);
      setFormData({
        project_id: selectedProject || '',
        parent_suite_id: parentId || '',
        name: '',
        description: '',
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

    const data = {
      ...formData,
      parent_suite_id: formData.parent_suite_id || undefined,
    };

    if (editingId) {
      await updateTestSuite(editingId, data);
    } else {
      await addTestSuite(data);
    }

    handleCloseModal();
  };

  const toggleSuiteExpansion = (suiteId: string) => {
    const newExpanded = new Set(expandedSuites);
    if (newExpanded.has(suiteId)) {
      newExpanded.delete(suiteId);
    } else {
      newExpanded.add(suiteId);
    }
    setExpandedSuites(newExpanded);
  };

  const getSuiteTestCases = (suiteId: string) => {
    return testCases.filter(tc => tc.suite_id === suiteId);
  };

  const renderSuiteTree = (suite: TestSuite, level: number = 0) => {
    const subSuites = getSubSuites(suite.id);
    const project = projects.find(p => p.id === suite.project_id);
    const suiteTestCases = getSuiteTestCases(suite.id);
    const isExpanded = expandedSuites.has(suite.id);

    return (
      <div key={suite.id} className="mb-2">
        <div
          className="bg-white rounded-lg p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          style={{ marginLeft: `${level * 24}px` }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {level > 0 && <ChevronRight size={16} className="text-slate-400" />}
                <button
                  onClick={() => toggleSuiteExpansion(suite.id)}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <h3 className="text-base font-semibold text-slate-800">{suite.name}</h3>
                {project && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                    {project.code}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">{suite.description}</p>
              <div className="flex items-center gap-4 mt-2">
                {subSuites.length > 0 && (
                  <p className="text-xs text-slate-400">{subSuites.length} sub-suite(s)</p>
                )}
                {suiteTestCases.length > 0 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <FileText size={12} />
                    {suiteTestCases.length} test case(s)
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => handleOpenModal(undefined, suite.id)}
                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Add Sub-Suite"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => handleOpenModal(suite)}
                className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => deleteSuite(suite.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {isExpanded && suiteTestCases.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 mt-2 border border-slate-200" style={{ marginLeft: `${level * 24}px` }}>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FileText size={14} />
              Test Cases in this Suite
            </h4>
            <div className="space-y-2">
              {suiteTestCases.map((tc) => (
                <div key={tc.id} className="bg-white rounded p-3 border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-slate-500">{tc.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          tc.priority === 'High' ? 'bg-red-100 text-red-700' :
                          tc.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {tc.priority}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800">{tc.title}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{tc.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subSuites.map(subSuite => renderSuiteTree(subSuite, level + 1))}
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Test Suites</h1>
          <p className="text-slate-500 mt-1">Organize test cases into suites and sub-suites</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={projects.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Create Suite
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Project</label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} ({project.code})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <FolderTree size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">Create a project first before adding test suites.</p>
          </div>
        ) : rootSuites.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <FolderTree size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">
              {selectedProject ? 'No test suites in this project.' : 'No test suites yet. Create your first suite.'}
            </p>
          </div>
        ) : (
          rootSuites.map(suite => renderSuiteTree(suite))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Test Suite' : formData.parent_suite_id ? 'Create Sub-Suite' : 'Create Test Suite'}
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Project</label>
                <select
                  required
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
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

              {formData.project_id && !editingId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Parent Suite (Optional)
                  </label>
                  <select
                    value={formData.parent_suite_id}
                    onChange={(e) => setFormData({ ...formData, parent_suite_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None (Root Suite)</option>
                    {testSuites
                      .filter(s => s.project_id === formData.project_id && !s.parent_suite_id)
                      .map((suite) => (
                        <option key={suite.id} value={suite.id}>
                          {suite.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Suite Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Login Module"
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
                  placeholder="Describe this test suite..."
                />
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
    </div>
  );
};

export default TestSuites;
