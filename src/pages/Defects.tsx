import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useTestContext } from '../context/TestContext';
import { Plus, Edit2, Trash2, X, AlertTriangle, Upload, Eye } from 'lucide-react';
import { Defect, DefectSeverity, DefectStatus } from '../types';

const Defects: React.FC = () => {
  const { defects, projects, addDefect, updateDefect, deleteDefect } = useData();
  const { testCases } = useTestContext();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<DefectStatus | 'All'>('All');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    project_id: '',
    test_case_id: '',
    title: '',
    description: '',
    severity: 'Medium' as DefectSeverity,
    status: 'Open' as DefectStatus,
    assigned_to: '',
  });

  const filteredDefects = useMemo(() => {
    return defects.filter(defect => {
      const matchesProject = !filterProject || defect.project_id === filterProject;
      const matchesStatus = filterStatus === 'All' || defect.status === filterStatus;
      return matchesProject && matchesStatus;
    });
  }, [defects, filterProject, filterStatus]);

  const handleOpenModal = (defect?: Defect) => {
    if (defect) {
      setEditingId(defect.id);
      setFormData({
        project_id: defect.project_id,
        test_case_id: defect.test_case_id || '',
        title: defect.title,
        description: defect.description,
        severity: defect.severity,
        status: defect.status,
        assigned_to: defect.assigned_to || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        project_id: filterProject || '',
        test_case_id: '',
        title: '',
        description: '',
        severity: 'Medium',
        status: 'Open',
        assigned_to: '',
      });
    }
    setEvidenceFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setEvidenceFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let evidenceUrl = '';
    let evidenceName = '';

    if (evidenceFile) {
      evidenceUrl = URL.createObjectURL(evidenceFile);
      evidenceName = evidenceFile.name;
    }

    const defectData = {
      ...formData,
      test_case_id: formData.test_case_id || undefined,
      assigned_to: formData.assigned_to || undefined,
      evidence_url: evidenceUrl || undefined,
      evidence_name: evidenceName || undefined,
    };

    if (editingId) {
      await updateDefect(editingId, defectData);
    } else {
      await addDefect(defectData);
    }

    handleCloseModal();
  };

  const getSeverityColor = (severity: DefectSeverity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusColor = (status: DefectStatus) => {
    switch (status) {
      case 'Open':
        return 'bg-red-100 text-red-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Resolved':
        return 'bg-green-100 text-green-700';
      case 'Closed':
        return 'bg-slate-100 text-slate-700';
    }
  };

  const projectTestCases = useMemo(() => {
    if (!formData.project_id) return [];
    return testCases.filter(tc => tc.project_id === formData.project_id);
  }, [testCases, formData.project_id]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Defects</h1>
          <p className="text-slate-500 mt-1">Track and manage bugs</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={projects.length === 0}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Report Defect
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Project</label>
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as DefectStatus | 'All')}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredDefects.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <AlertTriangle size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">
              {projects.length === 0
                ? 'Create a project first before reporting defects.'
                : 'No defects found. Great job!'}
            </p>
          </div>
        ) : (
          filteredDefects.map((defect) => {
            const project = projects.find(p => p.id === defect.project_id);
            const testCase = testCases.find(tc => tc.id === defect.test_case_id);

            return (
              <div
                key={defect.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">{defect.title}</h3>
                      {project && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {project.code}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{defect.description}</p>
                    {testCase && (
                      <p className="text-xs text-slate-500 mb-2">
                        Test Case: {testCase.id} - {testCase.title}
                      </p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(defect.severity)}`}>
                        {defect.severity}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(defect.status)}`}>
                        {defect.status}
                      </span>
                      {defect.assigned_to && (
                        <span className="text-xs text-slate-500">Assigned to: {defect.assigned_to}</span>
                      )}
                      {defect.evidence_url && (
                        <a
                          href={defect.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Eye size={12} />
                          Evidence
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleOpenModal(defect)}
                      className="p-1 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteDefect(defect.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-400 pt-3 border-t border-slate-100">
                  Created: {new Date(defect.created_at).toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full my-8">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Defect' : 'Report Defect'}
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
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value, test_case_id: '' })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.code})
                    </option>
                  ))}
                </select>
              </div>

              {formData.project_id && projectTestCases.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Test Case (Optional)
                  </label>
                  <select
                    value={formData.test_case_id}
                    onChange={(e) => setFormData({ ...formData, test_case_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {projectTestCases.map((tc) => (
                      <option key={tc.id} value={tc.id}>
                        {tc.id} - {tc.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the defect"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description, steps to reproduce, expected vs actual behavior..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as DefectSeverity })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as DefectStatus })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assigned To (Optional)
                </label>
                <input
                  type="text"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
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
                    accept="image/*,.pdf"
                    className="hidden"
                    id="defect-evidence-upload"
                  />
                  <label
                    htmlFor="defect-evidence-upload"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                  >
                    <Upload size={20} className="text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {evidenceFile ? evidenceFile.name : 'Click to upload screenshot or document'}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: JPG, PNG, PDF
                </p>
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
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  {editingId ? 'Update' : 'Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Defects;
