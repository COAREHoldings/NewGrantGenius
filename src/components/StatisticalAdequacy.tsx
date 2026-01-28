'use client';

import { useState } from 'react';
import { BarChart2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface StatisticalAdequacyProps {
  aims: { number: number; content: string }[];
}

interface AimAnalysis {
  hasSampleSize: boolean;
  hasControlGroups: boolean;
  hasRandomization: boolean;
  hasPrimaryEndpoints: boolean;
  hasStatisticalTests: boolean;
  adequacyScore: number;
  missingElements: string[];
  suggestions: string[];
}

export default function StatisticalAdequacy({ aims }: StatisticalAdequacyProps) {
  const [analyses, setAnalyses] = useState<Record<number, AimAnalysis>>({});
  const [loading, setLoading] = useState<number | null>(null);

  const analyzeAim = async (aimNumber: number, content: string) => {
    setLoading(aimNumber);
    try {
      const res = await fetch('/api/statistical-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, aimNumber })
      });
      const data = await res.json();
      setAnalyses(prev => ({ ...prev, [aimNumber]: data }));
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const CheckItem = ({ checked, label }: { checked: boolean; label: string }) => (
    <div className="flex items-center gap-1.5 text-xs">
      {checked ? (
        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-red-400" />
      )}
      <span className={checked ? 'text-green-700' : 'text-red-600'}>{label}</span>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-slate-900 text-sm">Statistical Adequacy</span>
        </div>
      </div>
      <div className="p-3 space-y-3">
        {aims.length === 0 ? (
          <p className="text-xs text-slate-500">No aims detected yet.</p>
        ) : (
          aims.map(aim => (
            <div key={aim.number} className="border border-slate-200 rounded p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Aim {aim.number}</span>
                {analyses[aim.number] ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    analyses[aim.number].adequacyScore >= 70 ? 'bg-green-100 text-green-700' :
                    analyses[aim.number].adequacyScore >= 40 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {analyses[aim.number].adequacyScore}%
                  </span>
                ) : (
                  <button
                    onClick={() => analyzeAim(aim.number, aim.content)}
                    disabled={loading === aim.number}
                    className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {loading === aim.number ? 'Checking...' : 'Check'}
                  </button>
                )}
              </div>
              {analyses[aim.number] && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1">
                    <CheckItem checked={analyses[aim.number].hasSampleSize} label="Sample Size" />
                    <CheckItem checked={analyses[aim.number].hasControlGroups} label="Controls" />
                    <CheckItem checked={analyses[aim.number].hasRandomization} label="Randomization" />
                    <CheckItem checked={analyses[aim.number].hasPrimaryEndpoints} label="Endpoints" />
                    <CheckItem checked={analyses[aim.number].hasStatisticalTests} label="Stats Tests" />
                  </div>
                  {analyses[aim.number].missingElements?.length > 0 && (
                    <div className="text-xs bg-amber-50 p-2 rounded">
                      <div className="flex items-center gap-1 text-amber-700 font-medium mb-1">
                        <AlertTriangle className="w-3 h-3" /> Missing
                      </div>
                      <ul className="text-amber-600 space-y-0.5">
                        {analyses[aim.number].missingElements.map((m, i) => (
                          <li key={i}>• {m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
