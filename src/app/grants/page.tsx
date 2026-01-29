'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, AlertCircle, FileSearch, Info, Key, ExternalLink, ArrowLeft, Calendar, DollarSign, Building2, Clock } from 'lucide-react';

// Types
interface GrantOpportunity {
  opportunityId: number;
  opportunityNumber: string;
  opportunityTitle: string;
  agencyCode: string;
  agencyName: string;
  closeDate: string | null;
  closeDateDescription: string | null;
  awardCeiling: number | null;
  awardFloor: number | null;
  summary: { summaryDescription: string } | null;
  opportunityStatus: string;
  category: string;
  fundingInstrumentType: string;
}

interface SearchFilters {
  query: string;
  agency: string;
  minAmount: number | null;
  maxAmount: number | null;
  closeDateStart: string;
  closeDateEnd: string;
}

// API
const API_BASE = 'https://api.simpler.grants.gov';
let userApiKey: string | null = null;

const setApiKey = (key: string) => { userApiKey = key; };
const hasApiKey = () => !!userApiKey;

const SAMPLE_GRANTS: GrantOpportunity[] = [
  {
    opportunityId: 365089,
    opportunityNumber: 'PAR-26-001',
    opportunityTitle: 'Research on Solid Tumor Immunotherapy Resistance Mechanisms',
    agencyCode: 'HHS-NIH-NCI',
    agencyName: 'National Cancer Institute',
    closeDate: '2026-03-15',
    closeDateDescription: null,
    awardCeiling: 500000,
    awardFloor: 150000,
    summary: { summaryDescription: 'This funding opportunity supports research to understand mechanisms of resistance to immunotherapy in solid tumors.' },
    opportunityStatus: 'posted',
    category: 'Discretionary',
    fundingInstrumentType: 'Grant',
  },
  {
    opportunityId: 365102,
    opportunityNumber: 'RFA-CA-26-015',
    opportunityTitle: 'Early Detection of Pancreatic Cancer',
    agencyCode: 'HHS-NIH-NCI',
    agencyName: 'National Cancer Institute',
    closeDate: '2026-02-28',
    closeDateDescription: null,
    awardCeiling: 750000,
    awardFloor: 200000,
    summary: { summaryDescription: 'This initiative supports development of novel approaches for early detection of pancreatic ductal adenocarcinoma (PDAC).' },
    opportunityStatus: 'posted',
    category: 'Discretionary',
    fundingInstrumentType: 'Grant',
  },
  {
    opportunityId: 365115,
    opportunityNumber: 'W81XWH-26-BCRP-001',
    opportunityTitle: 'Breast Cancer Research Program - Breakthrough Award',
    agencyCode: 'DOD',
    agencyName: 'Department of Defense - CDMRP',
    closeDate: '2026-04-10',
    closeDateDescription: null,
    awardCeiling: 1000000,
    awardFloor: 500000,
    summary: { summaryDescription: 'The Breakthrough Award supports promising research that has high potential to lead to breakthroughs in breast cancer.' },
    opportunityStatus: 'posted',
    category: 'Discretionary',
    fundingInstrumentType: 'Cooperative Agreement',
  },
  {
    opportunityId: 365128,
    opportunityNumber: 'PAR-26-045',
    opportunityTitle: 'Tumor Microenvironment Network (TMEN) Research',
    agencyCode: 'HHS-NIH-NCI',
    agencyName: 'National Cancer Institute',
    closeDate: '2026-05-01',
    closeDateDescription: null,
    awardCeiling: 350000,
    awardFloor: 100000,
    summary: { summaryDescription: 'This program supports collaborative research on the tumor microenvironment across multiple solid tumor types.' },
    opportunityStatus: 'posted',
    category: 'Discretionary',
    fundingInstrumentType: 'Grant',
  },
  {
    opportunityId: 365141,
    opportunityNumber: 'RFA-CA-26-022',
    opportunityTitle: 'Pediatric Solid Tumor Translational Research',
    agencyCode: 'HHS-NIH-NCI',
    agencyName: 'National Cancer Institute',
    closeDate: '2026-03-30',
    closeDateDescription: null,
    awardCeiling: 600000,
    awardFloor: 250000,
    summary: { summaryDescription: 'Supports translational research in pediatric solid tumors including neuroblastoma, Wilms tumor, osteosarcoma.' },
    opportunityStatus: 'posted',
    category: 'Discretionary',
    fundingInstrumentType: 'Grant',
  },
];

const formatCurrency = (amount: number | null): string => {
  if (amount === null) return 'Varies';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'Open';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getDaysUntilDeadline = (dateStr: string | null): number | null => {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getGrantUrl = (opportunityId: number): string => `https://www.grants.gov/search-results-detail/${opportunityId}`;

async function searchGrants(filters: SearchFilters) {
  if (userApiKey) {
    try {
      const response = await fetch(`${API_BASE}/v1/opportunities/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': userApiKey },
        body: JSON.stringify({
          query: filters.query || 'cancer research',
          pagination: { page_offset: 1, page_size: 50, sort_order: [{ order_by: 'close_date', sort_direction: 'ascending' }] },
          filters: { opportunity_status: { one_of: ['posted', 'forecasted'] } },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return { data: data.data || [], usingSampleData: false };
      }
    } catch (e) { console.warn('API error', e); }
  }
  
  let data = [...SAMPLE_GRANTS];
  if (filters.query) {
    const q = filters.query.toLowerCase();
    data = data.filter(g => g.opportunityTitle.toLowerCase().includes(q) || g.summary?.summaryDescription?.toLowerCase().includes(q));
  }
  if (filters.agency && filters.agency !== 'all') {
    data = data.filter(g => g.agencyCode.startsWith(filters.agency));
  }
  data.sort((a, b) => (a.closeDate || '').localeCompare(b.closeDate || ''));
  return { data, usingSampleData: true };
}

const AGENCIES = [
  { value: 'all', label: 'All Agencies' },
  { value: 'HHS', label: 'HHS (NIH/NCI)' },
  { value: 'DOD', label: 'Department of Defense' },
  { value: 'NSF', label: 'National Science Foundation' },
];

const AMOUNT_PRESETS = [
  { value: null, label: 'Any Amount' },
  { value: 100000, label: 'Up to $100K' },
  { value: 500000, label: 'Up to $500K' },
  { value: 1000000, label: 'Up to $1M' },
];

function GrantCard({ grant }: { grant: GrantOpportunity }) {
  const daysUntil = getDaysUntilDeadline(grant.closeDate);
  const isUrgent = daysUntil !== null && daysUntil <= 14;
  const isExpiring = daysUntil !== null && daysUntil <= 30 && daysUntil > 14;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-medium bg-primary-50 text-primary-600 rounded">{grant.agencyCode}</span>
            {isUrgent && <span className="px-2 py-1 text-xs font-medium bg-red-50 text-error rounded flex items-center gap-1"><Clock className="w-3 h-3" /> {daysUntil} days left</span>}
            {isExpiring && <span className="px-2 py-1 text-xs font-medium bg-amber-50 text-warning rounded flex items-center gap-1"><Clock className="w-3 h-3" /> {daysUntil} days left</span>}
          </div>
          <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2">{grant.opportunityTitle}</h3>
          <p className="text-sm text-slate-500 mb-1">{grant.opportunityNumber}</p>
        </div>
      </div>
      {grant.summary?.summaryDescription && (
        <p className="text-sm text-slate-600 mt-3 line-clamp-3">{grant.summary.summaryDescription.replace(/<[^>]*>/g, '')}</p>
      )}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <div><p className="text-xs text-slate-500">Agency</p><p className="text-sm font-medium text-slate-900 truncate">{grant.agencyName || grant.agencyCode}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-400" />
          <div><p className="text-xs text-slate-500">Award</p><p className="text-sm font-medium text-slate-900">{grant.awardCeiling ? formatCurrency(grant.awardCeiling) : 'Varies'}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div><p className="text-xs text-slate-500">Deadline</p><p className={`text-sm font-medium ${isUrgent ? 'text-error' : isExpiring ? 'text-warning' : 'text-slate-900'}`}>{grant.closeDateDescription || formatDate(grant.closeDate)}</p></div>
        </div>
      </div>
      <div className="mt-4">
        <a href={getGrantUrl(grant.opportunityId)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors">
          View Full Opportunity <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export default function GrantsPage() {
  const [grants, setGrants] = useState<GrantOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingSampleData, setUsingSampleData] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    query: 'solid tumor cancer research',
    agency: 'all',
    minAmount: null,
    maxAmount: null,
    closeDateStart: '',
    closeDateEnd: '',
  });

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchGrants(filters);
      setGrants(response.data || []);
      setUsingSampleData(response.usingSampleData || false);
    } catch (err) {
      setError('Failed to fetch grants. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
      setShowApiKeyModal(false);
      handleSearch();
    }
  };

  useEffect(() => { handleSearch(); }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center"><Search className="w-5 h-5 text-white" /></div>
              <div><h1 className="font-bold text-slate-900">Grant Discovery</h1><p className="text-xs text-slate-500">Find funding for cancer research</p></div>
            </div>
          </div>
          <button onClick={() => setShowApiKeyModal(true)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Key className="w-4 h-4" />{hasApiKey() ? 'Update API Key' : 'Add API Key'}
          </button>
        </div>
      </header>

      {usingSampleData && (
        <div className="bg-primary-50 border-b border-primary-100">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3">
            <Info className="w-5 h-5 text-primary-600 flex-shrink-0" />
            <p className="text-sm text-primary-800"><span className="font-medium">Demo Mode:</span> Showing sample grants. <button onClick={() => setShowApiKeyModal(true)} className="underline hover:no-underline font-medium">Add your API key</button> from simpler.grants.gov/developer</p>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder="Search cancer research grants..." className="w-full h-12 pl-12 pr-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <button onClick={handleSearch} disabled={isLoading} className="h-12 px-6 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50">{isLoading ? 'Searching...' : 'Search'}</button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <select value={filters.agency} onChange={(e) => setFilters({ ...filters, agency: e.target.value })} className="h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white">
              {AGENCIES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
            <select value={filters.maxAmount?.toString() || ''} onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value ? parseInt(e.target.value) : null })} className="h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white">
              {AMOUNT_PRESETS.map((a) => <option key={a.value?.toString() || 'any'} value={a.value?.toString() || ''}>{a.label}</option>)}
            </select>
          </div>
        </div>

        <p className="text-sm text-slate-600">Found <span className="font-semibold text-slate-900">{grants.length}</span> opportunities{usingSampleData && ' (sample data)'}</p>

        {error && <div className="flex items-center gap-3 p-4 bg-red-50 text-error rounded-xl"><AlertCircle className="w-5 h-5" /><p>{error}</p></div>}

        {isLoading && <div className="grid gap-4">{[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"><div className="h-4 bg-slate-200 rounded w-20 mb-3"></div><div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div><div className="h-16 bg-slate-100 rounded mb-4"></div></div>)}</div>}

        {!isLoading && !error && grants.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200"><FileSearch className="w-12 h-12 text-slate-300 mx-auto mb-4" /><h3 className="text-lg font-semibold text-slate-900 mb-2">No grants found</h3></div>
        )}

        {!isLoading && grants.length > 0 && <div className="grid gap-4">{grants.map((grant) => <GrantCard key={grant.opportunityId} grant={grant} />)}</div>}
      </main>

      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Configure API Key</h2>
            <p className="text-sm text-slate-600 mb-4">Enter your Simpler.Grants.gov API key to search live grant data.</p>
            <input type="text" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="Paste your API key here" className="w-full h-12 px-4 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4 font-mono text-sm" />
            <div className="flex gap-3">
              <button onClick={() => setShowApiKeyModal(false)} className="flex-1 py-3 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
              <button onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()} className="flex-1 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50">Save & Search</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
