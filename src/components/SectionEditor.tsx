'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, AlertCircle, FileText, AlertTriangle } from 'lucide-react';
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

interface Props {
  section: Section;
  onUpdate: () => void;
}

// Strip HTML tags for text analysis
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export default function SectionEditor({ section, onUpdate }: Props) {
  const { token } = useAuth();
  const [content, setContent] = useState(section.content || '');
  const [saving, setSaving] = useState(false);
  const [pageCount, setPageCount] = useState(section.page_count || 0);

  const estimatePages = (html: string) => {
    if (!html) return 0;
    const text = stripHtml(html);
    return Math.ceil(text.length / 3000);
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

  const plainText = typeof window !== 'undefined' ? stripHtml(content) : content;
  const isOverLimit = pageCount > section.page_limit;
  const missingHeadings = section.required_headings?.filter(
    h => !plainText.toLowerCase().includes(h.toLowerCase())
  ) || [];

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-400" />
            <div>
              <h3 className="font-medium text-slate-900">{section.title}</h3>
              <p className="text-sm text-slate-500">
                Page limit: {section.page_limit} page{section.page_limit > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-sm text-slate-500">Saving...</span>}
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

      <div className="p-4">
        <RichTextEditor
          content={content}
          onChange={handleChange}
          placeholder={`Start writing your ${section.title} section here...${
            section.required_headings?.length
              ? `\n\nInclude the following headings:\n${section.required_headings.map(h => `- ${h}`).join('\n')}`
              : ''
          }`}
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
