'use client';

import { useState } from 'react';
import type { Manuscript, ManuscriptContent } from '../types';
import LiteratureHelper from './LiteratureHelper';
import JournalChecker from './JournalChecker';
import JournalFitPanel from './JournalFitPanel';
import CoverLetterGen from './CoverLetterGen';
import type { LiteratureGap, JournalCheckResult } from '../types';

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
  manuscript: Manuscript | null;
  onUpdate: (id: string, updates: Partial<Manuscript>) => void;
  onCreate: (manuscript: Omit<Manuscript, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Manuscript> | void;
  onFindGaps: (abstract: string, researchArea: string) => Promise<{ gaps: LiteratureGap[] }>;
  onCheckJournal: (manuscript: { title: string; abstract: string; wordCount?: number }, targetJournal: string) => Promise<JournalCheckResult>;
  onFindJournalFit: (manuscript: { title: string; abstract: string; keywords: string[] }) => Promise<{ rankings: JournalFitScore[] }>;
  onGenerateCoverLetter: (manuscript: { title: string; abstract: string; highlights?: string[] }, journal: string) => Promise<{ coverLetter: string; wordCount: number }>;
  loading: boolean;
}

const STEPS = [
  { id: 1, name: 'Setup', description: 'Basic information' },
  { id: 2, name: 'Literature', description: 'Gap analysis' },
  { id: 3, name: 'IMRAD', description: 'Write sections' },
  { id: 4, name: 'Find Journal', description: 'Best fit analysis' },
  { id: 5, name: 'Compliance', description: 'Journal check' },
  { id: 6, name: 'Submit', description: 'Cover letter' },
];

export default function ManuscriptWizard({
  manuscript,
  onUpdate,
  onCreate,
  onFindGaps,
  onCheckJournal,
  onFindJournalFit,
  onGenerateCoverLetter,
  loading,
}: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: manuscript?.title || '',
    targetJournal: manuscript?.targetJournal || '',
    grantId: manuscript?.grantId || '',
    coAuthors: manuscript?.coAuthors?.map(a => a.name).join(', ') || '',
    content: manuscript?.content || {} as ManuscriptContent,
  });

  const handleSave = () => {
    if (manuscript) {
      onUpdate(manuscript.id, {
        title: form.title,
        targetJournal: form.targetJournal,
        grantId: form.grantId,
        coAuthors: form.coAuthors.split(',').map(name => ({ name: name.trim() })),
        content: form.content,
      });
    } else {
      onCreate({
        title: form.title,
        targetJournal: form.targetJournal,
        grantId: form.grantId,
        coAuthors: form.coAuthors.split(',').map(name => ({ name: name.trim() })),
        content: form.content,
        status: 'draft',
      });
    }
  };

  const updateContent = (section: keyof ManuscriptContent, value: string) => {
    setForm(prev => ({
      ...prev,
      content: { ...prev.content, [section]: value },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Step Progress */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center">
            <button
              onClick={() => setStep(s.id)}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                step === s.id
                  ? 'bg-indigo-600 text-white'
                  : step > s.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > s.id ? '\u2713' : s.id}
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`w-12 h-1 mx-1 ${step > s.id ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Manuscript Setup</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Manuscript title"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Journal</label>
              <input
                type="text"
                value={form.targetJournal}
                onChange={e => setForm(prev => ({ ...prev, targetJournal: e.target.value }))}
                placeholder="e.g., Nature Medicine"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Co-Authors (comma-separated)</label>
              <input
                type="text"
                value={form.coAuthors}
                onChange={e => setForm(prev => ({ ...prev, coAuthors: e.target.value }))}
                placeholder="John Doe, Jane Smith"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <LiteratureHelper onFindGaps={onFindGaps} loading={loading} />
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">IMRAD Sections</h3>
            {(['abstract', 'introduction', 'methods', 'results', 'discussion'] as const).map(section => (
              <div key={section}>
                <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">{section}</label>
                <textarea
                  value={form.content[section] || ''}
                  onChange={e => updateContent(section, e.target.value)}
                  placeholder={`Write your ${section} here...`}
                  rows={section === 'abstract' ? 4 : 6}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <JournalFitPanel onFindFit={onFindJournalFit} loading={loading} />
        )}

        {step === 5 && (
          <JournalChecker onCheckJournal={onCheckJournal} loading={loading} />
        )}

        {step === 6 && (
          <CoverLetterGen onGenerate={onGenerateCoverLetter} loading={loading} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-slate-200">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="px-4 py-2 text-slate-600 hover:text-slate-900 disabled:opacity-50"
        >
          Previous
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50"
          >
            Save Draft
          </button>
          {step < 6 ? (
            <button
              onClick={() => setStep(s => Math.min(6, s + 1))}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
