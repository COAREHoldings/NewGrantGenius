'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Circle, Paperclip, Sparkles, Loader2, X, Copy, Check } from 'lucide-react';

interface Attachment {
  id: number;
  name: string;
  required: boolean;
  status: string;
  file_url: string | null;
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
  const [draftModal, setDraftModal] = useState<{ name: string; content: string } | null>(null);
  const [copied, setCopied] = useState(false);

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

  const required = attachments.filter(a => a.required);
  const optional = attachments.filter(a => !a.required);
  const uploadedCount = attachments.filter(a => a.status === 'uploaded').length;
  const requiredUploaded = required.filter(a => a.status === 'uploaded').length;

  const canDraft = (name: string) => {
    const draftable = [
      'Project Summary/Abstract',
      'Project Narrative',
      'Facilities & Other Resources',
      'Equipment',
      'Budget Justification',
      'Authentication of Key Resources',
      'Data Management Plan',
      'Commercialization Plan',
      'Commercialization Strategy'
    ];
    return draftable.some(d => name.toLowerCase().includes(d.toLowerCase()));
  };

  const AttachmentItem = ({ att }: { att: Attachment }) => (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition group">
      <button
        onClick={() => handleStatusToggle(att)}
        className="flex-shrink-0"
      >
        {att.status === 'uploaded' ? (
          <CheckCircle className="w-5 h-5 text-green-600" />
        ) : (
          <Circle className="w-5 h-5 text-slate-300" />
        )}
      </button>
      <span className={`text-sm flex-1 ${att.status === 'uploaded' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
        {att.name}
      </span>
      {canDraft(att.name) && att.status !== 'uploaded' && (
        <button
          onClick={() => handleDraftWithAI(att)}
          disabled={draftingId === att.id}
          className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center gap-1 transition-opacity disabled:opacity-50"
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
  );

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Paperclip className="w-5 h-5 text-slate-400" />
              <div>
                <h3 className="font-medium text-slate-900">Attachment Checklist</h3>
                <p className="text-sm text-slate-500">
                  {uploadedCount} of {attachments.length} complete ({requiredUploaded}/{required.length} required)
                </p>
              </div>
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Hover over items to draft with AI
          </p>
        </div>

        <div className="p-4 space-y-4">
          {required.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Required Attachments</h4>
              <div className="space-y-1">
                {required.map(att => (
                  <AttachmentItem key={att.id} att={att} />
                ))}
              </div>
            </div>
          )}

          {optional.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Optional Attachments</h4>
              <div className="space-y-1">
                {optional.map(att => (
                  <AttachmentItem key={att.id} att={att} />
                ))}
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
                <h3 className="font-semibold text-lg">AI Draft: {draftModal.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setDraftModal(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg"
                >
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
                <strong>Note:</strong> This is an AI-generated draft. Review and customize before submitting. 
                Copy to a word processor, add your specific details, and save as PDF for upload.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
