'use client';

import { AlertCircle, FileText, ArrowRight } from 'lucide-react';
import type { ResponseStrategy, ResponseSuggestion } from '../types';
import { DISCLAIMER } from '../types';

interface Props {
  data: ResponseStrategy;
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case 'critical':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-200 text-red-800' };
    case 'important':
      return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-200 text-amber-800' };
    default:
      return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-200 text-blue-800' };
  }
}

function SuggestionCard({ suggestion, index }: { suggestion: ResponseSuggestion; index: number }) {
  const style = getPriorityStyle(suggestion.priority);

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
            {index + 1}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${style.badge}`}>
            {suggestion.priority}
          </span>
        </div>
        {suggestion.pageEstimate && (
          <span className="text-xs text-slate-500">~{suggestion.pageEstimate} page(s)</span>
        )}
      </div>

      <p className={`text-sm ${style.text} mb-3`}>{suggestion.response}</p>

      {suggestion.structuralChanges && suggestion.structuralChanges.length > 0 && (
        <div className="mt-3 pt-3 border-t border-current/20">
          <p className="text-xs font-medium mb-2 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            Structural Changes
          </p>
          <ul className="space-y-1">
            {suggestion.structuralChanges.map((change, i) => (
              <li key={i} className="text-xs flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-current mt-1.5 flex-shrink-0" />
                {change}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ResponseStrategyComponent({ data }: Props) {
  const critical = data.suggestions.filter(s => s.priority === 'critical');
  const important = data.suggestions.filter(s => s.priority === 'important');
  const minor = data.suggestions.filter(s => s.priority === 'minor');

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{DISCLAIMER}</span>
      </div>

      {/* Page Budget */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Page Budget Calculator</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Total Estimated</p>
            <p className="text-2xl font-bold text-slate-900">{data.totalPageEstimate}</p>
            <p className="text-xs text-slate-500">pages for changes</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-xs text-slate-500">Introduction</p>
            <p className="text-2xl font-bold text-indigo-600">1</p>
            <p className="text-xs text-slate-500">page (required)</p>
          </div>
          <div className={`rounded-lg p-3 ${data.remainingPageBudget >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-xs text-slate-500">Remaining Budget</p>
            <p className={`text-2xl font-bold ${data.remainingPageBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.remainingPageBudget}
            </p>
            <p className="text-xs text-slate-500">pages available</p>
          </div>
        </div>
        {data.remainingPageBudget < 0 && (
          <p className="mt-3 text-sm text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Warning: Estimated changes exceed page limit. Prioritize critical items.
          </p>
        )}
      </div>

      {/* Response Suggestions by Priority */}
      {critical.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-red-600" />
            Critical Responses ({critical.length})
          </h4>
          <div className="space-y-3">
            {critical.map((s, i) => (
              <SuggestionCard key={s.critiqueId} suggestion={s} index={i} />
            ))}
          </div>
        </div>
      )}

      {important.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-600" />
            Important Responses ({important.length})
          </h4>
          <div className="space-y-3">
            {important.map((s, i) => (
              <SuggestionCard key={s.critiqueId} suggestion={s} index={critical.length + i} />
            ))}
          </div>
        </div>
      )}

      {minor.length > 0 && (
        <div>
          <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Minor Responses ({minor.length})
          </h4>
          <div className="space-y-3">
            {minor.map((s, i) => (
              <SuggestionCard key={s.critiqueId} suggestion={s} index={critical.length + important.length + i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
