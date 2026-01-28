'use client';

import { AlertCircle, TrendingUp, TrendingDown, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import type { QualityCheckResults } from '../types';
import { DISCLAIMER } from '../types';

interface Props {
  data: QualityCheckResults | null;
  onCheck: () => Promise<void>;
  loading: boolean;
}

function getScoreColor(score: number) {
  if (score <= 3) return 'text-green-600';
  if (score <= 5) return 'text-amber-600';
  return 'text-red-600';
}

function getDeltaIcon(delta: number) {
  if (delta < 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
  if (delta > 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
  return <span className="w-4 h-4 text-slate-400">-</span>;
}

export default function QualityCheck({ data, onCheck, loading }: Props) {
  return (
    <div className="space-y-6">
      {/* Disclaimer - PROMINENT */}
      <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-900 mb-1">Important Disclaimer</p>
            <p className="text-sm text-amber-800">{DISCLAIMER}</p>
          </div>
        </div>
      </div>

      {/* Run Check Button */}
      {!data && (
        <button
          onClick={onCheck}
          disabled={loading}
          className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running Quality Check...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Run Quality Check
            </>
          )}
        </button>
      )}

      {data && (
        <>
          {/* Overall Score Comparison */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 text-center">Projected Impact Score</h3>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">Original</p>
                <p className={`text-4xl font-bold ${getScoreColor(data.overallOriginal)}`}>
                  {data.overallOriginal}
                </p>
              </div>
              <div className="flex flex-col items-center">
                {getDeltaIcon(data.overallDelta)}
                <span className={`text-sm font-medium ${
                  data.overallDelta < 0 ? 'text-green-600' : 
                  data.overallDelta > 0 ? 'text-red-600' : 'text-slate-500'
                }`}>
                  {data.overallDelta > 0 ? '+' : ''}{data.overallDelta}
                </span>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">Projected</p>
                <p className={`text-4xl font-bold ${getScoreColor(data.overallProjected)}`}>
                  {data.overallProjected}
                </p>
              </div>
            </div>
            <p className="text-center text-xs text-slate-500 mt-4">
              Lower scores are better (1 = Exceptional, 9 = Poor)
            </p>
          </div>

          {/* Criterion Scores */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b">
              <h4 className="font-medium text-slate-900">Criterion Score Projections</h4>
            </div>
            <div className="divide-y">
              {data.scores.map((score) => (
                <div key={score.criterion} className="px-4 py-3 flex items-center justify-between">
                  <span className="font-medium text-slate-700">{score.criterion}</span>
                  <div className="flex items-center gap-4">
                    <span className={`text-lg ${getScoreColor(score.originalScore)}`}>
                      {score.originalScore}
                    </span>
                    <div className="flex items-center gap-1">
                      {getDeltaIcon(score.delta)}
                      <span className={`text-sm ${
                        score.delta < 0 ? 'text-green-600' : 
                        score.delta > 0 ? 'text-red-600' : 'text-slate-400'
                      }`}>
                        {score.delta !== 0 ? (score.delta > 0 ? '+' : '') + score.delta : '-'}
                      </span>
                    </div>
                    <span className={`text-lg font-semibold ${getScoreColor(score.projectedScore)}`}>
                      {score.projectedScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-Submission Checklist */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b">
              <h4 className="font-medium text-slate-900">Pre-Submission Checklist</h4>
            </div>
            <div className="divide-y">
              {data.checklist.map((item, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  {item.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <span className={item.completed ? 'text-slate-700' : 'text-slate-500'}>
                    {item.item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Remaining Risks */}
          {data.remainingRisks.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h4 className="font-medium text-red-900">Remaining Risk Areas</h4>
              </div>
              <ul className="space-y-2">
                {data.remainingRisks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rerun Button */}
          <button
            onClick={onCheck}
            disabled={loading}
            className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Re-run Quality Check
          </button>
        </>
      )}
    </div>
  );
}
