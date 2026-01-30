'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Upload, CheckCircle2, XCircle, Clock, AlertTriangle,
  FileText, File, Trash2, Eye, Download, RefreshCw,
  ChevronDown, ChevronRight, Plus
} from 'lucide-react';

interface Section {
  id: number;
  type: string;
  title: string;
  content: string;
  pageLimit: number;
  pageCount: number;
  isValid: boolean;
  isComplete: boolean;
}

interface Attachment {
  id: number;
  name: string;
  fileUrl: string | null;
  required: boolean;
  status: string;
}

interface DocumentUpload {
  id: number;
  documentType: string;
  originalFilename: string;
  fileUrl: string;
  auditStatus: string;
  auditResults: any;
  mappedToSection: string | null;
}

// NIH SBIR/STTR Required Components
const NIH_REQUIREMENTS = {
  sections: [
    { type: 'specific_aims', title: 'Specific Aims', pageLimit: 1, required: true },
    { type: 'research_strategy', title: 'Research Strategy', pageLimit: 12, required: true },
    { type: 'significance', title: 'Significance', pageLimit: 0, required: true, parent: 'research_strategy' },
    { type: 'innovation', title: 'Innovation', pageLimit: 0, required: true, parent: 'research_strategy' },
    { type: 'approach', title: 'Approach', pageLimit: 0, required: true, parent: 'research_strategy' },
  ],
  attachments: [
    { name: 'Budget & Justification', required: true },
    { name: 'Facilities & Equipment', required: true },
    { name: 'Biographical Sketch (PI)', required: true },
    { name: 'Biographical Sketch (Key Personnel)', required: false },
    { name: 'Letters of Support', required: false },
    { name: 'Resource Sharing Plan', required: false },
    { name: 'Authentication of Key Resources', required: false },
    { name: 'Commercialization Plan', required: true },
    { name: 'Human Subjects', required: false },
    { name: 'Vertebrate Animals', required: false },
  ]
};

export default function SubmissionAssembly({ 
  applicationId, 
  userType 
}: { 
  applicationId: number;
  userType: 'scratch' | 'partial' | 'complete' | 'review';
}) {
  const [sections, setSections] = useState<Section[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sections', 'attachments']));
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [applicationId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sectionsRes, attachmentsRes, uploadsRes] = await Promise.all([
        fetch(`/api/sections?applicationId=${applicationId}`),
        fetch(`/api/attachments?applicationId=${applicationId}`),
        fetch(`/api/submission/uploads?applicationId=${applicationId}`)
      ]);

      if (sectionsRes.ok) {
        const data = await sectionsRes.json();
        setSections(data);
      }
      if (attachmentsRes.ok) {
        const data = await attachmentsRes.json();
        setAttachments(data);
      }
      if (uploadsRes.ok) {
        const data = await uploadsRes.json();
        setUploads(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = useCallback(async (files: FileList) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('applicationId', applicationId.toString());
    
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      const res = await fetch('/api/submission/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const result = await res.json();
        setUploads(prev => [...prev, ...result.uploads]);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  }, [applicationId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const createSnapshot = async () => {
    setSnapshotLoading(true);
    try {
      const res = await fetch('/api/submission/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          notes: `Snapshot created on ${new Date().toLocaleString()}`
        })
      });

      if (res.ok) {
        alert('Snapshot created successfully!');
      }
    } catch (error) {
      console.error('Error creating snapshot:', error);
    } finally {
      setSnapshotLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Calculate completion stats
  const completedSections = sections.filter(s => s.isComplete).length;
  const totalRequiredSections = NIH_REQUIREMENTS.sections.filter(s => s.required && !s.parent).length;
  const completedAttachments = attachments.filter(a => a.status === 'complete').length;
  const totalRequiredAttachments = NIH_REQUIREMENTS.attachments.filter(a => a.required).length;
  
  const overallProgress = Math.round(
    ((completedSections + completedAttachments) / (totalRequiredSections + totalRequiredAttachments)) * 100
  );

  if (loading) {
    return <div className="text-center py-8">Loading assembly data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Submission Readiness</h3>
          <button
            onClick={createSnapshot}
            disabled={snapshotLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {snapshotLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Save Snapshot
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">Overall Progress</span>
            <span className="font-medium text-slate-900">{overallProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all ${
                overallProgress >= 80 ? 'bg-green-500' :
                overallProgress >= 50 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{completedSections}/{totalRequiredSections}</p>
            <p className="text-sm text-slate-500">Required Sections</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{completedAttachments}/{totalRequiredAttachments}</p>
            <p className="text-sm text-slate-500">Required Attachments</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{uploads.length}</p>
            <p className="text-sm text-slate-500">Uploaded Documents</p>
          </div>
        </div>
      </div>

      {/* Document Upload Zone */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Documents</h3>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
              <p className="text-slate-600">Processing uploads...</p>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600 mb-2">
                Drag & drop your documents here, or{' '}
                <label className="text-indigo-600 hover:text-indigo-700 cursor-pointer">
                  browse
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  />
                </label>
              </p>
              <p className="text-sm text-slate-400">Supports PDF, DOC, DOCX, TXT</p>
            </>
          )}
        </div>

        {/* Uploaded Files List */}
        {uploads.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploads.map((upload) => (
              <div key={upload.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">{upload.originalFilename}</p>
                    <p className="text-sm text-slate-500">
                      {upload.mappedToSection ? `Mapped to: ${upload.mappedToSection}` : 'Pending classification'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    upload.auditStatus === 'passed' ? 'bg-green-100 text-green-700' :
                    upload.auditStatus === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {upload.auditStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sections Checklist */}
      <div className="bg-white rounded-lg border border-slate-200">
        <button
          onClick={() => toggleSection('sections')}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <h3 className="text-lg font-semibold text-slate-900">Required Sections</h3>
          {expandedSections.has('sections') ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </button>
        
        {expandedSections.has('sections') && (
          <div className="border-t border-slate-200 p-4 space-y-3">
            {NIH_REQUIREMENTS.sections.filter(s => !s.parent).map((req) => {
              const section = sections.find(s => s.type === req.type);
              const isComplete = section?.isComplete || false;
              const isValid = section?.isValid || false;
              
              return (
                <div 
                  key={req.type}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isComplete ? 'bg-green-50' : 'bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-500" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900">
                        {req.title}
                        {req.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      <p className="text-sm text-slate-500">
                        {section ? `${section.pageCount || 0}/${req.pageLimit} pages` : 'Not started'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isValid && section && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      isComplete ? 'bg-green-100 text-green-700' :
                      section ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isComplete ? 'Complete' : section ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attachments Checklist */}
      <div className="bg-white rounded-lg border border-slate-200">
        <button
          onClick={() => toggleSection('attachments')}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <h3 className="text-lg font-semibold text-slate-900">Required Attachments</h3>
          {expandedSections.has('attachments') ? (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-slate-400" />
          )}
        </button>
        
        {expandedSections.has('attachments') && (
          <div className="border-t border-slate-200 p-4 space-y-3">
            {NIH_REQUIREMENTS.attachments.map((req) => {
              const attachment = attachments.find(a => a.name === req.name);
              const isComplete = attachment?.status === 'complete';
              
              return (
                <div 
                  key={req.name}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isComplete ? 'bg-green-50' : req.required ? 'bg-slate-50' : 'bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : req.required ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-slate-400" />
                    )}
                    <p className="font-medium text-slate-900">
                      {req.name}
                      {req.required && <span className="text-red-500 ml-1">*</span>}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    isComplete ? 'bg-green-100 text-green-700' :
                    req.required ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isComplete ? 'Uploaded' : req.required ? 'Required' : 'Optional'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
