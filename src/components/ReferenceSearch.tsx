'use client';

import { useState } from 'react';
import { Search, Plus, BookOpen, Copy, Trash2, ExternalLink } from 'lucide-react';

interface Reference {
  id?: number;
  pmid?: string;
  doi?: string;
  title: string;
  authors?: string;
  journal?: string;
  year?: number;
  citationText?: string;
  notes?: string;
}

interface ReferenceSearchProps {
  userId: number;
  applicationId?: number;
  onInsertCitation?: (citation: string) => void;
}

export default function ReferenceSearch({ userId, applicationId, onInsertCitation }: ReferenceSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Reference[]>([]);
  const [savedRefs, setSavedRefs] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'library'>('search');

  const searchReferences = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/references/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.references || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedRefs = async () => {
    try {
      const params = new URLSearchParams({ userId: userId.toString() });
      if (applicationId) params.append('applicationId', applicationId.toString());
      
      const res = await fetch(`/api/references?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSavedRefs(data.references || []);
      }
    } catch (error) {
      console.error('Failed to load references:', error);
    }
  };

  const saveReference = async (ref: Reference) => {
    try {
      const res = await fetch('/api/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, applicationId, ...ref })
      });
      if (res.ok) {
        loadSavedRefs();
      }
    } catch (error) {
      console.error('Failed to save reference:', error);
    }
  };

  const deleteReference = async (refId: number) => {
    try {
      await fetch(`/api/references/${refId}`, { method: 'DELETE' });
      setSavedRefs(prev => prev.filter(r => r.id !== refId));
    } catch (error) {
      console.error('Failed to delete reference:', error);
    }
  };

  const formatCitation = (ref: Reference): string => {
    const authors = ref.authors ? ref.authors.split(',')[0] + ' et al.' : '';
    return `${authors} (${ref.year || 'n.d.'}) ${ref.title}. ${ref.journal || ''}`;
  };

  const insertCitation = (ref: Reference) => {
    const citation = ref.citationText || formatCitation(ref);
    onInsertCitation?.(citation);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5" /> References
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded ${activeTab === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Search
          </button>
          <button
            onClick={() => { setActiveTab('library'); loadSavedRefs(); }}
            className={`px-4 py-2 rounded ${activeTab === 'library' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Library ({savedRefs.length})
          </button>
        </div>
      </div>

      {activeTab === 'search' && (
        <>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchReferences()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                placeholder="Search PubMed, DOI, or keywords..."
              />
            </div>
            <button
              onClick={searchReferences}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="space-y-3">
            {results.map((ref, idx) => (
              <div key={idx} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">{ref.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{ref.authors}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{ref.journal}</span>
                      <span>{ref.year}</span>
                      {ref.pmid && <span className="font-mono">PMID: {ref.pmid}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {ref.pmid && (
                      <a 
                        href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => saveReference(ref)}
                      className="p-1 text-gray-400 hover:text-green-600"
                      title="Add to library"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'library' && (
        <div className="space-y-3">
          {savedRefs.map(ref => (
            <div key={ref.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-sm">{ref.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{ref.authors}</p>
                  <p className="text-xs text-gray-400 mt-1">{ref.journal} ({ref.year})</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => insertCitation(ref)}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    Insert
                  </button>
                  <button
                    onClick={() => copyToClipboard(formatCitation(ref))}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copy citation"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => ref.id && deleteReference(ref.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {savedRefs.length === 0 && (
            <p className="text-center text-gray-500 py-8">No saved references. Search and add some!</p>
          )}
        </div>
      )}
    </div>
  );
}
