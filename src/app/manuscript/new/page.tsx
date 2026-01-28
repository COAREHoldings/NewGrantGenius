'use client';

import dynamic from 'next/dynamic';
import { usePublications } from '@/features/publications/hooks/usePublications';

const ManuscriptWizard = dynamic(
  () => import('@/features/publications/components/ManuscriptWizard'),
  { ssr: false }
);

export default function NewManuscriptPage() {
  const {
    state,
    createManuscript,
    updateManuscript,
    findLiteratureGaps,
    checkJournal,
    findJournalFit,
    generateCoverLetter,
  } = usePublications();

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Manuscript</h1>
        <p className="text-gray-600 mb-8">Create and write your manuscript with AI assistance</p>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ManuscriptWizard
            manuscript={state.currentManuscript}
            onUpdate={updateManuscript}
            onCreate={createManuscript}
            onFindGaps={findLiteratureGaps}
            onCheckJournal={checkJournal}
            onFindJournalFit={findJournalFit}
            onGenerateCoverLetter={generateCoverLetter}
            loading={state.loading}
          />
        </div>
      </div>
    </main>
  );
}
