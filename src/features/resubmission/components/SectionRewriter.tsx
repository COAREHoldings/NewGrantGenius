'use client';

import { useState } from 'react';
import { AlertCircle, RefreshCw, FileText, Plus, Minus } from 'lucide-react';
import type { SectionRewrite, ResponseStrategy } from '../types';
import { DISCLAIMER } from '../types';

interface Props {
  strategy: ResponseStrategy | null;
  rewrites: SectionRewrite[];
  onRewrite: (sectionName: string, originalText: string, critiques: string[]) => Promise<void>;
  loading: boolean;
}

const GRANT_SECTIONS = [
  'Specific Aims',
  'Significance',
  'Innovation',
  'Approach - Overview',
  'Approach - Preliminary Studies',
  'Approach - Research Design',
];

export default function SectionRewriter({ strategy, rewrites, onRewrite, loading }: Props) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState('');
  const [selectedCritiques, setSelectedCritiques] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'changes'>('side-by-side');

  const currentRewrite = selectedSection ? rewrites.find(r => r.sectionName === selectedSection) : null;

  const handleRewrite = async () => {
    if (!selectedSection || !originalText) return;
    await onRewrite(selectedSection, originalText, selectedCritiques);
  };

  const toggleCritique = (critique: string) => {
    setSelectedCritiques(prev =>
      prev.includes(critique)
        ? prev.filter(c => c !== critique)
        : [...prev, critique]
    );
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{DISCLAIMER}</span>
      </div>

      {/* Section Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Section to Rewrite</label>
        <div className="flex flex-wrap gap-2">
          {GRANT_SECTIONS.map((section) => {
            const hasRewrite = rewrites.some(r => r.sectionName === section);
            return (
              <button
                key={section}
                onClick={() => setSelectedSection(section)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  selectedSection === section
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : hasRewrite
                    ? 'bg-green-50 text-green-700 border-green-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400'
                }`}
              >
                {section}
                {hasRewrite && <span className="ml-1 text-xs">(done)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {selectedSection && (
        <>
          {/* Critiques to Address */}
          {strategy && strategy.suggestions.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-3">Select Critiques to Address</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {strategy.suggestions.map((s) => (
                  <label key={s.critiqueId} className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCritiques.includes(s.response)}
                      onChange={() => toggleCritique(s.response)}
                      className="mt-1 rounded"
                    />
                    <span className="text-sm text-slate-600">{s.response.slice(0, 100)}...</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Original Text Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Original {selectedSection} Text
            </label>
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Paste the original section text here..."
              rows={8}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          {/* Rewrite Button */}
          <button
            onClick={handleRewrite}
            disabled={!originalText || loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Generate Rewrite
              </>
            )}
          </button>

          {/* Rewrite Result */}
          {currentRewrite && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b flex items-center justify-between">
                <h4 className="font-medium text-slate-900">Rewritten: {currentRewrite.sectionName}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">~{currentRewrite.pageCount} pages</span>
                  <div className="flex border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('side-by-side')}
                      className={`px-2 py-1 text-xs ${viewMode === 'side-by-side' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}
                    >
                      Side by Side
                    </button>
                    <button
                      onClick={() => setViewMode('changes')}
                      className={`px-2 py-1 text-xs ${viewMode === 'changes' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}
                    >
                      Changes
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'side-by-side' ? (
                <div className="grid md:grid-cols-2 divide-x">
                  <div className="p-4">
                    <h5 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                      <Minus className="w-3 h-3 text-red-500" /> Original
                    </h5>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{currentRewrite.originalText}</p>
                  </div>
                  <div className="p-4 bg-green-50/50">
                    <h5 className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                      <Plus className="w-3 h-3 text-green-500" /> Revised
                    </h5>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{currentRewrite.revisedText}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <h5 className="text-xs font-medium text-slate-500 mb-3">Key Changes Made:</h5>
                  <ul className="space-y-2">
                    {currentRewrite.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Rewrites Summary */}
      {rewrites.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-slate-900 mb-2">Completed Rewrites ({rewrites.length})</h4>
          <div className="flex flex-wrap gap-2">
            {rewrites.map((r) => (
              <span key={r.sectionName} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg">
                {r.sectionName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
