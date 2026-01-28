'use client';

import { useState } from 'react';
import { AlertCircle, Copy, Check, Download, FileText } from 'lucide-react';
import type { CoverLetter } from '../types';
import { DISCLAIMER } from '../types';

interface Props {
  data: CoverLetter | null;
  onGenerate: () => Promise<void>;
  loading: boolean;
}

export default function CoverLetterGenerator({ data, onGenerate, loading }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!data) return;
    const blob = new Blob([data.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Introduction_to_Resubmission.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{DISCLAIMER}</span>
      </div>

      {/* Instructions */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 className="font-medium text-indigo-900 mb-2">Introduction to Application</h3>
        <p className="text-sm text-indigo-700">
          NIH requires a 1-page introduction for resubmissions that summarizes substantial additions, 
          deletions, and changes. This section should address reviewer concerns without exceeding 1 page.
        </p>
      </div>

      {/* Generate Button */}
      {!data && (
        <button
          onClick={onGenerate}
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Cover Letter...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Generate Introduction to Application
            </>
          )}
        </button>
      )}

      {/* Generated Letter */}
      {data && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-900">Introduction to Application</h4>
              <p className="text-xs text-slate-500">
                {data.wordCount} words | ~{data.pageEstimate} page(s)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-slate-50 flex items-center gap-1"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
          <div className="p-4 bg-white">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                {data.content}
              </pre>
            </div>
          </div>
          {data.pageEstimate > 1 && (
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-200">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Warning: This exceeds the 1-page limit. Please edit to reduce length.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Regenerate */}
      {data && (
        <button
          onClick={onGenerate}
          disabled={loading}
          className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Regenerate Letter
        </button>
      )}
    </div>
  );
}
