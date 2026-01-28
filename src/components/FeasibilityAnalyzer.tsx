'use client';

import { useState } from 'react';
import { Scale, AlertTriangle, CheckCircle, Clock, Link2 } from 'lucide-react';

interface FeasibilityAnalyzerProps {
  specificAims: string;
  researchStrategy: string;
}

export default function FeasibilityAnalyzer({ specificAims, researchStrategy }: FeasibilityAnalyzerProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (!specificAims && !researchStrategy) return;
    setLoading(true);
    try {
      const res = await fetch('/api/feasibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specificAims, researchStrategy })
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Feasibility analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'overloaded': return Scale;
      case 'interdependent': return Link2;
      case 'timeline': return Clock;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-orange-600" />
          <span className="font-medium text-slate-900 text-sm">Scope & Feasibility</span>
        </div>
      </div>
      <div className="p-3">
        {!analysis ? (
          <button
            onClick={runAnalysis}
            disabled={loading || (!specificAims && !researchStrategy)}
            className="w-full py-2 text-sm bg-orange-600 text-white font-medium rounded hover:bg-orange-700 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Feasibility'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Feasibility Score</span>
              <span className={`text-lg font-bold ${
                analysis.overallFeasibilityScore >= 70 ? 'text-green-600' :
                analysis.overallFeasibilityScore >= 50 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {analysis.overallFeasibilityScore}%
              </span>
            </div>

            {analysis.scopeIssues?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-700">Issues Detected</span>
                {analysis.scopeIssues.map((issue: any, i: number) => {
                  const Icon = getTypeIcon(issue.type);
                  return (
                    <div key={i} className={`p-2 rounded text-xs ${getSeverityColor(issue.severity)}`}>
                      <div className="flex items-center gap-1 font-medium mb-1">
                        <Icon className="w-3 h-3" />
                        <span className="capitalize">{issue.type}</span>
                      </div>
                      <p>{issue.description}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {analysis.recommendations?.length > 0 && (
              <div className="bg-green-50 p-2 rounded text-xs">
                <span className="font-medium text-green-700">Recommendations</span>
                <ul className="text-green-600 mt-1 space-y-0.5">
                  {analysis.recommendations.map((r: string, i: number) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={runAnalysis}
              className="w-full text-xs text-orange-600 hover:underline"
            >
              Re-analyze
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
