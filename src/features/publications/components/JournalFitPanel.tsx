'use client';

import { useState } from 'react';

interface JournalFitScore {
  journalName: string;
  overallScore: number;
  scopeMatch: number;
  impactScore: number;
  acceptanceChance: number;
  timeToDecision: number;
  openAccess: boolean;
  impactFactor: number;
  reasoning: string;
}

interface Props {
  onFindFit: (manuscript: { title: string; abstract: string; keywords: string[] }) => Promise<{ rankings: JournalFitScore[] }>;
  loading: boolean;
}

export default function JournalFitPanel({ onFindFit, loading }: Props) {
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [rankings, setRankings] = useState<JournalFitScore[]>([]);

  const handleAnalyze = async () => {
    if (!title.trim() || !abstract.trim()) return;
    const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const result = await onFindFit({ title, abstract, keywords: keywordList });
    setRankings(result.rankings);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Journal Fit Engine</h3>
        <p className="text-sm text-slate-600 mb-4">
          Find the best journals for your manuscript based on scope, impact factor, and acceptance rates.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Manuscript Title</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter manuscript title"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Abstract</label>
          <textarea
            value={abstract}
            onChange={e => setAbstract(e.target.value)}
            placeholder="Paste your abstract"
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Keywords (comma-separated)</label>
          <input
            type="text"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="e.g., cancer, immunotherapy, clinical trial"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !title.trim() || !abstract.trim()}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Find Best Journals'}
        </button>
      </div>

      {rankings.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-slate-900">Recommended Journals</h4>
          {rankings.map((journal, idx) => (
            <div key={journal.journalName} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                    {idx + 1}
                  </span>
                  <div>
                    <h5 className="font-semibold text-slate-900">{journal.journalName}</h5>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>IF: {journal.impactFactor}</span>
                      {journal.openAccess && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">Open Access</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full font-semibold ${getScoreColor(journal.overallScore)}`}>
                  {journal.overallScore}%
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center p-2 bg-slate-50 rounded">
                  <div className="text-xs text-slate-500">Scope</div>
                  <div className="font-semibold text-slate-700">{journal.scopeMatch}%</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded">
                  <div className="text-xs text-slate-500">Impact</div>
                  <div className="font-semibold text-slate-700">{journal.impactScore}%</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded">
                  <div className="text-xs text-slate-500">Acceptance</div>
                  <div className="font-semibold text-slate-700">{journal.acceptanceChance}%</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded">
                  <div className="text-xs text-slate-500">Review</div>
                  <div className="font-semibold text-slate-700">{journal.timeToDecision}d</div>
                </div>
              </div>

              <p className="text-sm text-slate-600">{journal.reasoning}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
