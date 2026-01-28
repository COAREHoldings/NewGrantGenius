'use client';

import { useState } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, BookOpen } from 'lucide-react';

interface NoveltyRiskProps {
  title: string;
  content: string;
}

export default function NoveltyRisk({ title, content }: NoveltyRiskProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runAnalysis = async () => {
    if (!content) return;
    setLoading(true);
    try {
      const res = await fetch('/api/novelty-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content })
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Novelty analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'low':
        return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Low Risk</span>;
      case 'moderate':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Moderate</span>;
      default:
        return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> High Risk</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-600" />
          <span className="font-medium text-slate-900 text-sm">Novelty Risk</span>
        </div>
      </div>
      <div className="p-3">
        {!analysis ? (
          <button
            onClick={runAnalysis}
            disabled={loading || !content}
            className="w-full py-2 text-sm bg-yellow-600 text-white font-medium rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Check Novelty Risk'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Novelty Score</span>
              <span className="text-lg font-bold">{analysis.noveltyScore}</span>
            </div>
            <div className="text-center">
              {getRiskBadge(analysis.riskLevel)}
            </div>

            {analysis.reviewerPerception && (
              <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded">
                "{analysis.reviewerPerception}"
              </p>
            )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-xs text-yellow-600 hover:underline"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>

            {showDetails && (
              <div className="space-y-2 text-xs">
                {analysis.textbookStatements?.length > 0 && (
                  <div className="bg-red-50 p-2 rounded">
                    <div className="flex items-center gap-1 text-red-700 font-medium mb-1">
                      <BookOpen className="w-3 h-3" /> Textbook Statements
                    </div>
                    <ul className="text-red-600 space-y-0.5">
                      {analysis.textbookStatements.slice(0, 3).map((s: string, i: number) => (
                        <li key={i}>• "{s}"</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.innovativeElements?.length > 0 && (
                  <div className="bg-green-50 p-2 rounded">
                    <span className="font-medium text-green-700">Innovative Elements</span>
                    <ul className="text-green-600 mt-1 space-y-0.5">
                      {analysis.innovativeElements.map((e: string, i: number) => (
                        <li key={i}>• {e}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.suggestionsToStrengthen?.length > 0 && (
                  <div className="bg-blue-50 p-2 rounded">
                    <span className="font-medium text-blue-700">Suggestions</span>
                    <ul className="text-blue-600 mt-1 space-y-0.5">
                      {analysis.suggestionsToStrengthen.map((s: string, i: number) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
