import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud, Search, Filter, FileText, Image, Download,
  CheckCircle2, Clock, AlertTriangle, X, Plus, Upload, Check
} from 'lucide-react';
import EmptyState from './EmptyState';
import { TableSkeleton, ErrorState } from './SkeletonLoader';

interface EvidenceTabProps {
  vendorId: string;
}

export default function EvidenceTab({ vendorId }: EvidenceTabProps) {
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Form state
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('General Progress');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEvidence = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vendor/evidence/${vendorId}?search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Failed to load evidence records');
      const data = await res.json();
      if (data.success) {
        setEvidenceList(data.evidence || []);
      } else {
        throw new Error(data.detail || 'Could not fetch evidence');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/vendor/projects/${vendorId}`);
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
        if (data.projects.length > 0) {
          setSelectedProjectId(String(data.projects[0].id));
        }
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [vendorId]);

  useEffect(() => {
    fetchEvidence();
  }, [vendorId, searchQuery]);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size exceeds the 10MB limit.', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a file to upload.', 'error');
      return;
    }
    if (!selectedProjectId) {
      showToast('Please select a project.', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('project_id', selectedProjectId);
    formData.append('milestone_title', selectedMilestone);
    formData.append('description', description);

    try {
      setUploadProgress(60);
      const res = await fetch(`/api/vendor/evidence/${vendorId}/upload`, {
        method: 'POST',
        body: formData
      });

      setUploadProgress(90);
      const data = await res.json();

      if (res.ok && data.success) {
        setUploadProgress(100);
        showToast('Evidence file uploaded successfully!', 'success');
        setSelectedFile(null);
        setDescription('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchEvidence();
      } else {
        showToast(data.detail || 'Failed to upload evidence.', 'error');
      }
    } catch (err: any) {
      showToast('Network error during file upload.', 'error');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const currentProjectObj = projects.find(p => String(p.id) === selectedProjectId);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-sm ${
          toastMsg.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span>{toastMsg.text}</span>
          <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Evidence Upload</h2>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Upload photos, documents, and reports as evidence for project milestones
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search evidence files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 w-56 shadow-2xs"
            />
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-2xs"
          >
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Upload Box / Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6">
        <h3 className="text-sm font-extrabold text-slate-900 mb-4">Submit New Evidence</h3>

        {projects.length === 0 ? (
          <div className="py-8 text-center bg-violet-50/40 rounded-2xl border border-violet-100 p-6 space-y-2">
            <UploadCloud className="w-10 h-10 text-violet-400 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No assigned projects</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You must have an assigned project to attach milestone evidence. Projects assigned to you will appear here.
            </p>
          </div>
        ) : (
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Milestone / Phase
                </label>
                {currentProjectObj?.milestones && currentProjectObj.milestones.length > 0 ? (
                  <select
                    value={selectedMilestone}
                    onChange={(e) => setSelectedMilestone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
                  >
                    {currentProjectObj.milestones.map((m: any, idx: number) => (
                      <option key={idx} value={m.title}>{m.title}</option>
                    ))}
                    <option value="General Inspection">General Inspection & Site Log</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedMilestone}
                    onChange={(e) => setSelectedMilestone(e.target.value)}
                    placeholder="Enter milestone title or phase..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500"
                  />
                )}
              </div>
            </div>

            {/* Drag & Drop File Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Attachment File
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
                className="hidden"
                id="evidence-file-input"
              />
              <label
                htmlFor="evidence-file-input"
                className="border-2 border-dashed border-violet-200 hover:border-violet-500 rounded-2xl p-6 text-center bg-violet-50/20 hover:bg-violet-50/40 transition-colors cursor-pointer block"
              >
                <UploadCloud className="w-10 h-10 text-violet-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700">
                  {selectedFile ? selectedFile.name : 'Drop files here or click to browse'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Photos (JPG, PNG), Documents (PDF, DOCX) up to 10MB
                </div>
                {selectedFile && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-700 text-[11px] font-bold rounded-lg">
                    <Check className="w-3 h-3" /> {(selectedFile.size / 1024).toFixed(0)} KB Selected
                  </div>
                )}
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Description / Notes
              </label>
              <textarea
                rows={2}
                placeholder="Provide notes on the evidence, quality testing, or site conditions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-violet-500 resize-none"
              ></textarea>
            </div>

            {/* Progress bar during upload */}
            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-violet-700">
                  <span>Uploading Evidence...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-violet-600 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-violet-200 transition-all text-xs flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Submit Evidence'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Uploaded Evidence Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xs p-6 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900">Uploaded Evidence Records</h3>

        {loading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEvidence} />
        ) : evidenceList.length === 0 ? (
          <EmptyState
            icon="upload"
            title="No files uploaded yet"
            description="Your uploaded evidence will appear here."
            compact
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">File Name</th>
                  <th className="pb-3">Project</th>
                  <th className="pb-3">Milestone</th>
                  <th className="pb-3">Upload Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {evidenceList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                          {item.file_type?.includes('image') ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 truncate max-w-[180px]">{item.filename}</div>
                          <div className="text-[10px] text-slate-400">{item.file_size_formatted}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-medium text-slate-700 max-w-[160px] truncate">
                      {item.project_title}
                    </td>
                    <td className="py-3 text-slate-500 font-medium">
                      {item.milestone_title}
                    </td>
                    <td className="py-3 text-slate-400 font-medium whitespace-nowrap">
                      {item.uploaded_at}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        <Clock className="w-3 h-3" /> {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-2">
                      <a
                        href={`/api/vendor/evidence/download/${item.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-800"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
