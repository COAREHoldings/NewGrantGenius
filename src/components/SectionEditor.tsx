'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, AlertCircle, FileText, AlertTriangle, Plus, Trash2, GripVertical } from 'lucide-react';
import AISuggestions from './AISuggestions';
import VersionHistory from './VersionHistory';
import { debounce } from '@/lib/utils';

const RichTextEditor = dynamic(() => import('./RichTextEditor'), { ssr: false });

interface Section {
  id: number;
  type: string;
  title: string;
  content: string;
  page_limit: number;
  page_count: number;
  required_headings: string[] | null;
  is_valid: boolean;
  is_complete: boolean;
}

interface Milestone {
  id: string;
  task: string;
  subtasks: string[];
  deliverable: string;
  timeline: string;
}

interface Props {
  section: Section;
  onUpdate: () => void;
  format?: 'narrative' | 'milestone';
  grantType?: string;
}

// Strip HTML tags for text analysis
function stripHtml(html: string): string {
  if (typeof window === 'undefined') return html;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// Parse milestone JSON from content or return default structure
function parseMilestones(content: string): Milestone[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [{ id: '1', task: '', subtasks: [''], deliverable: '', timeline: '' }];
}

export default function SectionEditor({ section, onUpdate, format = 'narrative', grantType = 'Grant' }: Props) {
  const { token } = useAuth();
  const [content, setContent] = useState(section.content || '');
  const [milestones, setMilestones] = useState<Milestone[]>(() => 
    format === 'milestone' ? parseMilestones(section.content || '') : []
  );
  const [saving, setSaving] = useState(false);
  const [pageCount, setPageCount] = useState(section.page_count || 0);

  const estimatePages = (html: string) => {
    if (!html) return 0;
    const text = stripHtml(html);
    return Math.ceil(text.length / 3000);
  };

  const estimateMilestonePages = (ms: Milestone[]) => {
    const totalChars = ms.reduce((sum, m) => {
      return sum + m.task.length + m.subtasks.join('').length + m.deliverable.length + m.timeline.length;
    }, 0);
    return Math.ceil(totalChars / 3000);
  };

  const saveContent = useCallback(
    debounce(async (newContent: string) => {
      setSaving(true);
      try {
        await fetch(`/api/sections/${section.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content: newContent })
        });
        onUpdate();
      } catch (error) {
        console.error('Failed to save:', error);
      } finally {
        setSaving(false);
      }
    }, 1000),
    [section.id, token, onUpdate]
  );

  const handleChange = (newContent: string) => {
    setContent(newContent);
    setPageCount(estimatePages(newContent));
    saveContent(newContent);
  };

  const handleMilestoneChange = (newMilestones: Milestone[]) => {
    setMilestones(newMilestones);
    setPageCount(estimateMilestonePages(newMilestones));
    saveContent(JSON.stringify(newMilestones));
  };

  const addMilestone = () => {
    const newMs = [...milestones, { 
      id: Date.now().toString(), 
      task: '', 
      subtasks: [''], 
      deliverable: '', 
      timeline: '' 
    }];
    handleMilestoneChange(newMs);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length <= 1) return;
    handleMilestoneChange(milestones.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string | string[]) => {
    handleMilestoneChange(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addSubtask = (milestoneId: string) => {
    handleMilestoneChange(milestones.map(m => 
      m.id === milestoneId ? { ...m, subtasks: [...m.subtasks, ''] } : m
    ));
  };

  const updateSubtask = (milestoneId: string, index: number, value: string) => {
    handleMilestoneChange(milestones.map(m => 
      m.id === milestoneId 
        ? { ...m, subtasks: m.subtasks.map((s, i) => i === index ? value : s) }
        : m
    ));
  };

  const removeSubtask = (milestoneId: string, index: number) => {
    handleMilestoneChange(milestones.map(m => 
      m.id === milestoneId && m.subtasks.length > 1
        ? { ...m, subtasks: m.subtasks.filter((_, i) => i !== index) }
        : m
    ));
  };

  const plainText = typeof window !== 'undefined' ? stripHtml(content) : content;
  const isOverLimit = section.page_limit > 0 && pageCount > section.page_limit;
  const missingHeadings = section.required_headings?.filter(
    h => !plainText.toLowerCase().includes(h.toLowerCase())
  ) || [];

  // Milestone editor UI
  if (format === 'milestone') {
    return (
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-400" />
              <div>
                <h3 className="font-medium text-slate-900">{section.title}</h3>
                <p className="text-sm text-slate-500">
                  Milestone-driven format (tasks, subtasks, deliverables) | Limit: {section.page_limit} pages
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {saving && <span className="text-sm text-slate-500">Saving...</span>}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm ${
                isOverLimit ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {isOverLimit ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {pageCount}/{section.page_limit} pages
              </div>
            </div>
          </div>
          <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
            <strong>SOW Format:</strong> Use milestone-driven format with specific tasks, subtasks, deliverables, and timelines. Do not use narrative paragraphs.
          </div>
        </div>

        <div className="p-4 space-y-4">
          {milestones.map((milestone, mIndex) => (
            <div key={milestone.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex items-start gap-2 mb-3">
                <GripVertical className="w-5 h-5 text-slate-400 mt-1 cursor-move" />
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Major Task {mIndex + 1}
                  </label>
                  <input
                    type="text"
                    value={milestone.task}
                    onChange={e => updateMilestone(milestone.id, 'task', e.target.value)}
                    placeholder="e.g., Develop and validate prototype device"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={() => removeMilestone(milestone.id)}
                  disabled={milestones.length <= 1}
                  className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="ml-7 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Subtasks</label>
                  {milestone.subtasks.map((subtask, sIndex) => (
                    <div key={sIndex} className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-slate-400 w-8">{mIndex + 1}.{sIndex + 1}</span>
                      <input
                        type="text"
                        value={subtask}
                        onChange={e => updateSubtask(milestone.id, sIndex, e.target.value)}
                        placeholder="Subtask description"
                        className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => removeSubtask(milestone.id, sIndex)}
                        disabled={milestone.subtasks.length <= 1}
                        className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-30"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSubtask(milestone.id)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Subtask
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Deliverable</label>
                    <input
                      type="text"
                      value={milestone.deliverable}
                      onChange={e => updateMilestone(milestone.id, 'deliverable', e.target.value)}
                      placeholder="e.g., Working prototype with test results"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Timeline</label>
                    <input
                      type="text"
                      value={milestone.timeline}
                      onChange={e => updateMilestone(milestone.id, 'timeline', e.target.value)}
                      placeholder="e.g., Months 1-6"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addMilestone}
            className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-indigo-400 hover:text-indigo-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Major Task
          </button>
        </div>

        {isOverLimit && (
          <div className="p-4 border-t border-slate-200 bg-amber-50">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Page limit exceeded by {pageCount - section.page_limit} page(s). Reduce content to proceed with export.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standard narrative editor
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <div>
              <h3 className="font-medium text-slate-900">{section.title}</h3>
              <p className="text-sm text-slate-500">
                {section.page_limit === 0 ? 'No page limit' : `Page limit: ${section.page_limit} page${section.page_limit > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-sm text-slate-500">Saving...</span>}
            {section.page_limit > 0 && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm ${
                isOverLimit
                  ? 'bg-red-100 text-red-700'
                  : pageCount > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
              }`}>
                {isOverLimit ? (
                  <AlertCircle className="w-4 h-4" />
                ) : pageCount > 0 ? (
                  <CheckCircle className="w-4 h-4" />
                ) : null}
                {pageCount}/{section.page_limit} pages
              </div>
            )}
          </div>
        </div>

        {section.required_headings && section.required_headings.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Required headings:</span>
            {section.required_headings.map(heading => {
              const isPresent = plainText.toLowerCase().includes(heading.toLowerCase());
              return (
                <span
                  key={heading}
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isPresent
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {heading} {isPresent ? '(found)' : '(missing)'}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <RichTextEditor
          content={content}
          onChange={handleChange}
          placeholder={`Start writing your ${section.title} section here...${
            section.required_headings?.length
              ? `\n\nInclude the following headings:\n${section.required_headings.map(h => `- ${h}`).join('\n')}`
              : ''
          }`}
        />
        
        <AISuggestions
          content={stripHtml(content)}
          sectionType={section.title}
          grantType={grantType}
          onAccept={(original, suggested) => {
            const newContent = content.replace(original, suggested);
            handleChange(newContent);
          }}
        />

        <VersionHistory
          sectionId={section.id}
          currentContent={content}
          onRestore={(restoredContent) => {
            setContent(restoredContent);
            setPageCount(estimatePages(restoredContent));
          }}
        />
      </div>

      {(isOverLimit || missingHeadings.length > 0) && (
        <div className="p-4 border-t border-slate-200 bg-amber-50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              {isOverLimit && (
                <p>Page limit exceeded by {pageCount - section.page_limit} page(s). Reduce content to proceed with export.</p>
              )}
              {missingHeadings.length > 0 && (
                <p>Missing required heading(s): {missingHeadings.join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
