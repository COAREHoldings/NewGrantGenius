'use client';

import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Circle, Upload, Paperclip } from 'lucide-react';

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
}

export default function AttachmentChecklist({ attachments, onUpdate }: Props) {
  const { token } = useAuth();

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

  const required = attachments.filter(a => a.required);
  const optional = attachments.filter(a => !a.required);
  const uploadedCount = attachments.filter(a => a.status === 'uploaded').length;
  const requiredUploaded = required.filter(a => a.status === 'uploaded').length;

  return (
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
      </div>

      <div className="p-4 space-y-4">
        {required.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Required Attachments</h4>
            <div className="space-y-2">
              {required.map(att => (
                <label
                  key={att.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                >
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
                  <span className={`text-sm ${att.status === 'uploaded' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                    {att.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {optional.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Optional Attachments</h4>
            <div className="space-y-2">
              {optional.map(att => (
                <label
                  key={att.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                >
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
                  <span className={`text-sm ${att.status === 'uploaded' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                    {att.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
