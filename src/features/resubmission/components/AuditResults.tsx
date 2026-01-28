'use client';

import { AlertCircle, Lightbulb, Target, FlaskConical } from 'lucide-react';
import type { AuditResults, AuditFinding } from '../types';
import { DISCLAIMER } from '../types';

interface Props {
  data: AuditResults;
}

function getPriorityStyle(priority: string) {
  switch (priority) {
    case 'critical':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'important':
      return 'bg-amber-50 border-amber-200 text-amber-800';
    default:
      return 'bg-blue-50 border-blue-200 text-blue-800';
  }
}

function FindingCard({ finding }: { finding: AuditFinding }) {
  return (
    <div className={`p-4 rounded-lg border ${getPriorityStyle(finding.priority)}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium uppercase">{finding.category}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          finding.priority === 'critical' ? 'bg-red-200' :
          finding.priority === 'important' ? 'bg-amber-200' : 'bg-blue-200'
        }`}>
          {finding.priority}
        </span>
      </div>
      <p className="text-sm font-medium mb-2">{finding.finding}</p>
      <div className="flex items-start gap-2 mt-2 pt-2 border-t border-current/20">
        <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p className="text-sm">{finding.recommendation}</p>
      </div>
    </div>
  );
}

export default function AuditResultsComponent({ data }: Props) {
  const criticalCount = data.findings.filter(f => f.priority === 'critical').length;
  const importantCount = data.findings.filter(f => f.priority === 'important').length;

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>{DISCLAIMER}</span>
      </div>

      {/* Summary */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">Independent Audit Summary</h3>
        <p className="text-sm text-slate-600 mb-4">
          Issues identified beyond reviewer comments that may strengthen your resubmission.
        </p>
        <div className="flex gap-4">
          <div className="px-3 py-2 bg-red-50 rounded-lg">
            <span className="text-sm font-medium text-red-700">{criticalCount} Critical</span>
          </div>
          <div className="px-3 py-2 bg-amber-50 rounded-lg">
            <span className="text-sm font-medium text-amber-700">{importantCount} Important</span>
          </div>
          <div className="px-3 py-2 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-700">
              {data.findings.length - criticalCount - importantCount} Minor
            </span>
          </div>
        </div>
      </div>

      {/* Findings */}
      <div>
        <h4 className="font-medium text-slate-900 mb-3">Audit Findings</h4>
        <div className="space-y-3">
          {data.findings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      </div>

      {/* Preliminary Data Gaps */}
      {data.preliminaryDataGaps.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-slate-900">Preliminary Data Gaps</h4>
          </div>
          <ul className="space-y-2">
            {data.preliminaryDataGaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested New Data */}
      {data.suggestedNewData.length > 0 && (
        <div className="border rounded-lg p-4 bg-green-50">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-slate-900">Suggested New Data to Generate</h4>
          </div>
          <ul className="space-y-2">
            {data.suggestedNewData.map((data, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                {data}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missed Opportunities */}
      {data.missedOpportunities.length > 0 && (
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h4 className="font-medium text-slate-900">Missed Opportunities</h4>
          </div>
          <ul className="space-y-2">
            {data.missedOpportunities.map((opp, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                {opp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
