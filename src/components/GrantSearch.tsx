'use client';

import { useState } from 'react';
import { Search, ExternalLink, Bookmark, BookmarkCheck, Filter } from 'lucide-react';

interface GrantOpportunity {
  id?: number;
  foaNumber: string;
  title: string;
  agency: string;
  deadline?: string;
  fundingAmount?: number;
  description?: string;
  url?: string;
  isSaved?: boolean;
}

interface GrantSearchProps {
  userId: number;
  onSelectGrant?: (grant: GrantOpportunity) => void;
}

export default function GrantSearch({ userId, onSelectGrant }: GrantSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GrantOpportunity[]>([]);
  const [savedGrants, setSavedGrants] = useState<GrantOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [filters, setFilters] = useState({
    agency: '',
    minFunding: '',
    maxFunding: ''
  });

  const searchGrants = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (filters.agency) params.append('agency', filters.agency);
      if (filters.minFunding) params.append('minFunding', filters.minFunding);
      if (filters.maxFunding) params.append('maxFunding', filters.maxFunding);

      const res = await fetch(`/api/grants/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.grants || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedGrants = async () => {
    try {
      const res = await fetch(`/api/grants/saved?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSavedGrants(data.grants || []);
      }
    } catch (error) {
      console.error('Failed to load saved grants:', error);
    }
  };

  const saveGrant = async (grant: GrantOpportunity) => {
    try {
      await fetch('/api/grants/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...grant })
      });
      setResults(prev => prev.map(g => 
        g.foaNumber === grant.foaNumber ? { ...g, isSaved: true } : g
      ));
      loadSavedGrants();
    } catch (error) {
      console.error('Failed to save grant:', error);
    }
  };

  const unsaveGrant = async (grantId: number) => {
    try {
      await fetch(`/api/grants/saved/${grantId}`, { method: 'DELETE' });
      setSavedGrants(prev => prev.filter(g => g.id !== grantId));
    } catch (error) {
      console.error('Failed to unsave grant:', error);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Grant Discovery</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded ${activeTab === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Search
          </button>
          <button
            onClick={() => { setActiveTab('saved'); loadSavedGrants(); }}
            className={`px-4 py-2 rounded ${activeTab === 'saved' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            Saved ({savedGrants.length})
          </button>
        </div>
      </div>

      {activeTab === 'search' && (
        <>
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchGrants()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                placeholder="Search NIH, NSF, DOD grants..."
              />
            </div>
            <button
              onClick={searchGrants}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 text-sm">
            <select
              value={filters.agency}
              onChange={e => setFilters(prev => ({ ...prev, agency: e.target.value }))}
              className="px-3 py-1 border rounded"
            >
              <option value="">All Agencies</option>
              <option value="NIH">NIH</option>
              <option value="NSF">NSF</option>
              <option value="DOD">DOD</option>
              <option value="DOE">DOE</option>
            </select>
            <input
              type="number"
              value={filters.minFunding}
              onChange={e => setFilters(prev => ({ ...prev, minFunding: e.target.value }))}
              className="w-32 px-3 py-1 border rounded"
              placeholder="Min $"
            />
            <input
              type="number"
              value={filters.maxFunding}
              onChange={e => setFilters(prev => ({ ...prev, maxFunding: e.target.value }))}
              className="w-32 px-3 py-1 border rounded"
              placeholder="Max $"
            />
          </div>

          {/* Results */}
          <div className="space-y-3">
            {results.map((grant, idx) => (
              <div key={idx} className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {grant.foaNumber}
                      </span>
                      <span className="text-xs text-gray-500">{grant.agency}</span>
                    </div>
                    <h3 className="font-medium text-gray-900">{grant.title}</h3>
                    {grant.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{grant.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      {grant.deadline && <span>Deadline: {new Date(grant.deadline).toLocaleDateString()}</span>}
                      {grant.fundingAmount && <span>Up to ${grant.fundingAmount.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {grant.url && (
                      <a href={grant.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => grant.isSaved ? null : saveGrant(grant)}
                      className={`${grant.isSaved ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}
                    >
                      {grant.isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {results.length === 0 && query && !loading && (
              <p className="text-center text-gray-500 py-8">No grants found. Try different search terms.</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-3">
          {savedGrants.map(grant => (
            <div key={grant.id} className="bg-white border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => onSelectGrant?.(grant)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      {grant.foaNumber}
                    </span>
                    <span className="text-xs text-gray-500">{grant.agency}</span>
                  </div>
                  <h3 className="font-medium text-gray-900">{grant.title}</h3>
                </div>
                <button
                  onClick={() => grant.id && unsaveGrant(grant.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          ))}
          {savedGrants.length === 0 && (
            <p className="text-center text-gray-500 py-8">No saved grants yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
