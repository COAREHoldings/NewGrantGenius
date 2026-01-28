'use client';

import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import type { ParsedSummaryStatement, Critique } from '../types';
import { DISCLAIMER, NIH_CRITERIA } from '../types';

interface Props {
  data: ParsedSummaryStatement;
}

function getSeverityColor(severity: string) {
  return severity === 'must-address'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-amber-50 border-amber-200 text-amber-800';
}

function getScoreColor(score: number) {
  if (score <= 3) return 'text-green-600 bg-green-100';
  if (score <= 5) return 'text-amber-600 bg-amber-100';
  return 'text-red-600 bg-red-100';
}

function CritiqueCard({ critique }: { critique: Critique }) {
  return (
    <div className={`p-3 rounded-lg border ${getSeverityColor(critique.severity)}`}>
      <div className="flex items-start gap-2">
        {critique.severity === 'must-address' ? (
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium uppercase">{critique.reviewer}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              critique.severity === 'must-address' ? 'bg-red-200' : 'bg-amber-200'
            }`}>
              {critique.severity === 'must-address' ? 'Must Address' : 'Consider'}
            </span>
          </div>
          <p className="text-sm">{critique.text}</p>
        </div>
      </div>
    </div>
  );
}

export default function CritiqueParser({ data }: Props) {
  const groupedCritiques = NIH_CRITERIA.reduce((acc, { key, label }) => {
    acc[key] = data.critiques.filter(c => c.criterion === key);
    return acc;
  }, {} as Record<string, Critique[]>);

  const mustAddressCount = data.critiques.filter(c => c.severity === 'must-address').length;
  const considerCount = data.critiques.filter(c => c.severity === 'consider').length;

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{DISCLAIMER}</span>
      </div>

      {/* Overall Score */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Review Scores</h3>
        <div className="flex items-center gap-6 mb-4">
          <div className="text-center">
            <p className="text-sm text-slate-500">Overall Impact</p>
            <p className={`text-3xl font-bold ${getScoreColor(data.overallImpactScore)}`}>
              {data.overallImpactScore}
            </p>
          </div>
          <div className="flex-1 grid grid-cols-5 gap-2">
            {data.criterionScores.map((cs) => (
              <div key={cs.criterion} className="text-center">
                <p className="text-xs text-slate-500 truncate">{cs.criterion}</p>
                <p className={`text-lg font-semibold rounded px-2 py-1 ${getScoreColor(cs.score)}`}>
                  {cs.score}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-700">{mustAddressCount} Must Address</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">{considerCount} To Consider</span>
        </div>
      </div>

      {/* Critiques by Criterion */}
      <div className="space-y-4">
        {NIH_CRITERIA.map(({ key, label }) => {
          const critiques = groupedCritiques[key] || [];
          if (critiques.length === 0) return null;
          return (
            <div key={key} className="border rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b">
                <h4 className="font-medium text-slate-900">{label}</h4>
              </div>
              <div className="p-4 space-y-3">
                {critiques.map((critique) => (
                  <CritiqueCard key={critique.id} critique={critique} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resume/Synopsis */}
      {data.resumeSynopsis && (
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-slate-900 mb-2">Resume/Synopsis</h4>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">{data.resumeSynopsis}</p>
        </div>
      )}
    </div>
  );
}
