'use client';

import { FileEdit, AlertCircle, TrendingUp, CheckCircle, Send } from 'lucide-react';

interface ReadinessStatusBarProps {
  status: 'draft' | 'at_risk' | 'needs_revision' | 'competitive' | 'submission_ready';
  score?: number;
}

const STATUS_CONFIG = {
  draft: {
    label: 'Draft Mode',
    color: 'bg-slate-100 border-slate-300 text-slate-700',
    icon: FileEdit,
    description: 'Initial drafting in progress'
  },
  at_risk: {
    label: 'At Risk',
    color: 'bg-red-100 border-red-300 text-red-700',
    icon: AlertCircle,
    description: 'Critical issues need attention'
  },
  needs_revision: {
    label: 'Needs Revision',
    color: 'bg-amber-100 border-amber-300 text-amber-700',
    icon: TrendingUp,
    description: 'Revisions recommended before submission'
  },
  competitive: {
    label: 'Competitive',
    color: 'bg-green-100 border-green-300 text-green-700',
    icon: CheckCircle,
    description: 'Application shows competitive strength'
  },
  submission_ready: {
    label: 'Submission Ready',
    color: 'bg-purple-100 border-purple-300 text-purple-700',
    icon: Send,
    description: 'Ready for final review and submission'
  }
};

export default function ReadinessStatusBar({ status, score }: ReadinessStatusBarProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon;

  return (
    <div className={`flex items-center justify-between px-4 py-2 border rounded-lg ${config.color}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <div>
          <span className="font-semibold">{config.label}</span>
          <span className="text-xs ml-2 opacity-75">{config.description}</span>
        </div>
      </div>
      {score !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-sm">CRE Score:</span>
          <span className="font-bold text-lg">{score}</span>
        </div>
      )}
      <p className="text-xs opacity-60">Advisory only • Does not block export</p>
    </div>
  );
}
