'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Circle, Paperclip, Sparkles, Loader2, X, Copy, Check, Upload, FileText, Trash2 } from 'lucide-react';

interface Attachment {
  id: number;
  name: string;
  required: boolean;
  status: string;
  file_url: string | null;
  file_name?: string;
  file_size?: number;
}

interface Props {
  attachments: Attachment[];
  onUpdate: () => void;
  applicationTitle?: string;
  specificAims?: string;
  researchStrategy?: string;
  mechanism?: string;
}

export default function AttachmentChecklist({ 
  attachments, 
  onUpdate,
  applicationTitle = '',
  specificAims = '',
  researchStrategy = '',
  mechanism = ''
}: Props) {
  const { token } = useAuth();
  const [draftingId, setDraftingId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [draftModal, setDraftModal] = useState<{ name: string; content: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);

  const handleStatusToggle = async (att: Attachment) => {
    const newStatus = att.status === 'uploaded' ? 'pending' : 'uploaded';
    try {
      await fetch(`/api/attachments/${att.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to update attachment:', error);
    }
  };

  const handleFileUpload = async (att: Attachment, file: File) => {
    setUploadingId(att.id);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('attachmentId', att.id.toString());

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      
      const { url, filename, size } = await uploadRes.json();

      // Update attachment record
      await fetch(`/api/attachments/${att.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'uploaded',
          file_url: url,
          file_name: filename,
          file_size: size
        })
      });
      
      onUpdate();
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteFile = async (att: Attachment) => {
    if (!att.file_url) return;
    
    try {
      // Delete from blob storage
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: att.file_url })
      });

      // Update attachment record
      await fetch(`/api/attachments/${att.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: 'pending',
          file_url: null,
          file_name: null,
          file_size: null
        })
      });
      
      onUpdate();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleDraftWithAI = async (att: Attachment) => {
    setDraftingId(att.id);
    try {
      const response = await fetch('/api/draft-attachment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachmentName: att.name,
          title: applicationTitle,
          specificAims,
          researchStrategy,
          mechanism
        })
      });

      if (!response.ok) throw new Error('Failed to draft');
      
      const data = await response.json();
      setDraftModal({ name: att.name, content: data.draft });
    } catch (error) {
      console.error('Failed to draft attachment:', error);
    } finally {
      setDraftingId(null);
    }
  };

  const handleCopy = async () => {
    if (draftModal) {
      await navigator.clipboard.writeText(draftModal.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const triggerFileInput = (att: Attachment) => {
    setSelectedAttachment(att);
    fileInputRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedAttachment) {
      handleFileUpload(selectedAttachment, file);
    }
    e.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const required = attachments.filter(a => a.required);
  const optional = attachments.filter(a => !a.required);
  const uploadedCount = attachments.filter(a => a.status === 'uploaded').length;
  const requiredUploaded = required.filter(a => a.status === 'uploaded').length;

  const canDraft = (name: string) => {
    const draftable = [
      'Project Summary/Abstract', 'Project Narrative', 'Facilities & Other Resources',
      'Equipment', 'Budget Justification', 'Authentication of Key Resources',
      'Data Management Plan', 'Commercialization Plan', 'Commercialization Strategy'
    ];
    return draftable.some(d => name.toLowerCase().includes(d.toLowerCase()));
  };

  const AttachmentItem = ({ att }: { att: Attachment }) => (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition group">
      <button onClick={() => handleStatusToggle(att)} className="flex-shrink-0">
        {att.status === 'uploaded' ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <Circle className="w-5 h-5 text-slate-300" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <span className={`text-sm block truncate ${att.status === 'uploaded' ? 'text-slate-500' : 'text-slate-900'}`}>
          {att.name}
        </span>
        {att.file_url && att.file_name && (
          <div className="flex items-center gap-2 mt-1">
            <FileText className="w-3 h-3 text-indigo-500" />
            <a href={att.file_url} target="_blank" rel="noopener noreferrer" 
               className="text-xs text-indigo-600 hover:underline truncate max-w-[120px]">
              {att.file_name}
            </a>
            <span className="text-xs text-slate-400">{att.file_size ? formatFileSize(att.file_size) : ''}</span>
            <button onClick={() => handleDeleteFile(att)} className="p-0.5 hover:bg-red-100 rounded">
              <Trash2 className="w-3 h-3 text-red-500" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Upload button */}
        <button
          onClick={() => triggerFileInput(att)}
          disabled={uploadingId === att.id}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
        >
          {uploadingId === att.id ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Upload className="w-3 h-3" />
          )}
          Upload
        </button>

        {/* Draft button */}
        {canDraft(att.name) && att.status !== 'uploaded' && (
          <button
            onClick={() => handleDraftWithAI(att)}
            disabled={draftingId === att.id}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center gap-1"
          >
            {draftingId === att.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Draft
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelected}
        className="hidden"
        accept=".pdf,.doc,.docx"
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <Paperclip className="w-5 h-5 text-slate-400" />
            <div>
              <h3 className="font-medium text-slate-900">Attachment Checklist</h3>
              <p className="text-sm text-slate-500">
                {uploadedCount}/{attachments.length} complete ({requiredUploaded}/{required.length} required)
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Hover to upload files or draft with AI
          </p>
        </div>

        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {required.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Required</h4>
              <div className="space-y-1">
                {required.map(att => <AttachmentItem key={att.id} att={att} />)}
              </div>
            </div>
          )}
          {optional.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Optional</h4>
              <div className="space-y-1">
                {optional.map(att => <AttachmentItem key={att.id} att={att} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Draft Modal */}
      {draftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">AI Draft: {draftModal.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleCopy}
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => setDraftModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                {draftModal.content}
              </pre>
            </div>
            <div className="p-4 border-t bg-amber-50">
              <p className="text-xs text-amber-700">
                <strong>Note:</strong> Review and customize before submitting. Save as PDF for upload.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
