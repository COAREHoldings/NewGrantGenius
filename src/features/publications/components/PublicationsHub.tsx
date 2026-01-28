'use client';

import { useState } from 'react';
import { usePublications } from '../hooks/usePublications';
import ImportPublications from './ImportPublications';
import PublicationCard from './PublicationCard';
import ResearchProfileView from './ResearchProfile';
import ManuscriptWizard from './ManuscriptWizard';
import RevisionResponse from './RevisionResponse';
import { BookOpen, FileText, User, PenTool, MessageSquare, Plus } from 'lucide-react';

type Tab = 'publications' | 'profile' | 'manuscript' | 'revision';

export default function PublicationsHub() {
  const {
    state,
    importDOI,
    searchPubMed,
    addPublication,
    removePublication,
    buildProfile,
    findLiteratureGaps,
    checkJournal,
    findJournalFit,
    generateCoverLetter,
    generateRevisionResponse,
    createManuscript,
    updateManuscript,
  } = usePublications();

  const [activeTab, setActiveTab] = useState<Tab>('publications');
  const [showImport, setShowImport] = useState(false);

  const tabs = [
    { id: 'publications' as Tab, label: 'My Publications', icon: BookOpen },
    { id: 'profile' as Tab, label: 'Research Profile', icon: User },
    { id: 'manuscript' as Tab, label: 'Manuscript Assistant', icon: PenTool },
    { id: 'revision' as Tab, label: 'Revision Response', icon: MessageSquare },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Publications Hub</h1>
          <p className="text-gray-600 mt-1">Manage publications, build your profile, and write manuscripts</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600">{state.publications.length}</p>
            <p className="text-xs text-slate-500">Publications</p>
          </div>
          {state.researchProfile && (
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{state.researchProfile.hIndex}</p>
              <p className="text-xs text-slate-500">h-Index</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {state.error}
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
        {activeTab === 'publications' && (
          <div className="space-y-6">
            {/* Import Toggle */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {showImport ? 'Import Publications' : 'My Publications'}
              </h2>
              <button
                onClick={() => setShowImport(!showImport)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showImport
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {showImport ? (
                  <>
                    <BookOpen className="w-4 h-4" />
                    View Publications
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Import Publications
                  </>
                )}
              </button>
            </div>

            {showImport ? (
              <ImportPublications
                onImportDOI={importDOI}
                onSearchPubMed={searchPubMed}
                onAddPublication={addPublication}
                loading={state.loading}
              />
            ) : state.publications.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600 mb-4">No publications yet. Import your work to get started.</p>
                <button
                  onClick={() => setShowImport(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Import Publications
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {state.publications.map(pub => (
                  <PublicationCard
                    key={pub.id}
                    publication={pub}
                    onRemove={removePublication}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <ResearchProfileView
            profile={state.researchProfile}
            onBuildProfile={buildProfile}
            loading={state.loading}
            publicationCount={state.publications.length}
          />
        )}

        {activeTab === 'manuscript' && (
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
        )}

        {activeTab === 'revision' && (
          <RevisionResponse
            onGenerateResponse={generateRevisionResponse}
            loading={state.loading}
          />
        )}
      </div>
    </div>
  );
}
