'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, CheckCircle2, XCircle, Clock, Search, 
  AlertTriangle, ExternalLink, RefreshCw, Plus, Trash2
} from 'lucide-react';

interface Reference {
  id: number;
  referenceText: string;
  pmid: string | null;
  doi: string | null;
  verificationStatus: 'pending' | 'verified' | 'not_found' | 'error';
  verificationResult: {
    title?: string;
    authors?: string[];
    journal?: string;
    year?: number;
    citationCount?: number;
    source?: 'pubmed' | 'scholar';
  };
}

export default function ReferenceVerifier({ applicationId }: { applicationId: number }) {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<number | null>(null);
  const [newRef, setNewRef] = useState('');
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    fetchReferences();
  }, [applicationId]);

  const fetchReferences = async () => {
    try {
      const res = await fetch(`/api/submission/references?applicationId=${applicationId}`);
      if (res.ok) {
        const data = await res.json();
        setReferences(data);
      }
    } catch (error) {
      console.error('Error fetching references:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyReference = async (refId: number) => {
    setVerifying(refId);
    try {
      const res = await fetch(`/api/submission/references/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceId: refId })
      });

      if (res.ok) {
        const result = await res.json();
        setReferences(prev => prev.map(r => 
          r.id === refId ? { ...r, ...result } : r
        ));
      }
    } catch (error) {
      console.error('Error verifying reference:', error);
    } finally {
      setVerifying(null);
    }
  };

  const verifyAll = async () => {
    for (const ref of references.filter(r => r.verificationStatus === 'pending')) {
      await verifyReference(ref.id);
    }
  };

  const addReference = async () => {
    if (!newRef.trim()) return;

    try {
      const res = await fetch(`/api/submission/references`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          applicationId,
          referenceText: newRef 
        })
      });

      if (res.ok) {
        const result = await res.json();
        setReferences(prev => [...prev, result]);
        setNewRef('');
      }
    } catch (error) {
      console.error('Error adding reference:', error);
    }
  };

  const extractFromSections = async () => {
    setExtracting(true);
    try {
      const res = await fetch(`/api/submission/references/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      });

      if (res.ok) {
        const result = await res.json();
        setReferences(prev => [...prev, ...result.references]);
      }
    } catch (error) {
      console.error('Error extracting references:', error);
    } finally {
      setExtracting(false);
    }
  };

  const deleteReference = async (refId: number) => {
    try {
      await fetch(`/api/submission/references/${refId}`, { method: 'DELETE' });
      setReferences(prev => prev.filter(r => r.id !== refId));
    } catch (error) {
      console.error('Error deleting reference:', error);
    }
  };

  const verifiedCount = references.filter(r => r.verificationStatus === 'verified').length;
  const notFoundCount = references.filter(r => r.verificationStatus === 'not_found').length;
  const pendingCount = references.filter(r => r.verificationStatus === 'pending').length;

  if (loading) {
    return <div className="text-center py-8">Loading references...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Reference Verification</h3>
          <div className="flex gap-2">
            <button
              onClick={extractFromSections}
              disabled={extracting}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              {extracting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Extract from Sections
            </button>
            <button
              onClick={verifyAll}
              disabled={pendingCount === 0}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Verify All ({pendingCount})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{references.length}</p>
            <p className="text-sm text-slate-500">Total References</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
            <p className="text-sm text-slate-500">Verified</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{notFoundCount}</p>
            <p className="text-sm text-slate-500">Not Found</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-sm text-slate-500">Pending</p>
          </div>
        </div>
      </div>

      {/* Add Reference */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h4 className="font-medium text-slate-900 mb-3">Add Reference</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={newRef}
            onChange={(e) => setNewRef(e.target.value)}
            placeholder="Paste citation text, PMID, or DOI..."
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={addReference}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Reference List */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h4 className="font-medium text-slate-900">Reference List</h4>
        </div>
        
        {references.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No references yet. Add references or extract from your sections.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {references.map((ref) => (
              <div key={ref.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {ref.verificationStatus === 'verified' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : ref.verificationStatus === 'not_found' ? (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      ) : ref.verificationStatus === 'error' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                      ) : (
                        <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      )}
                      <p className="text-sm text-slate-600 line-clamp-2">{ref.referenceText}</p>
                    </div>

                    {ref.verificationStatus === 'verified' && ref.verificationResult && (
                      <div className="ml-7 p-3 bg-green-50 rounded-lg text-sm">
                        <p className="font-medium text-slate-900">{ref.verificationResult.title}</p>
                        <p className="text-slate-600 mt-1">
                          {ref.verificationResult.authors?.slice(0, 3).join(', ')}
                          {ref.verificationResult.authors && ref.verificationResult.authors.length > 3 && ' et al.'}
                        </p>
                        <p className="text-slate-500 mt-1">
                          {ref.verificationResult.journal} ({ref.verificationResult.year})
                          {ref.verificationResult.citationCount && ` • ${ref.verificationResult.citationCount} citations`}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          {ref.pmid && (
                            <a
                              href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              PubMed
                            </a>
                          )}
                          {ref.doi && (
                            <a
                              href={`https://doi.org/${ref.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              DOI
                            </a>
                          )}
                          <span className="text-xs text-slate-400">
                            via {ref.verificationResult.source === 'pubmed' ? 'PubMed' : 'Google Scholar'}
                          </span>
                        </div>
                      </div>
                    )}

                    {ref.verificationStatus === 'not_found' && (
                      <div className="ml-7 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        This reference could not be verified. Please check the citation.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {ref.verificationStatus === 'pending' && (
                      <button
                        onClick={() => verifyReference(ref.id)}
                        disabled={verifying === ref.id}
                        className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                      >
                        {verifying === ref.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          'Verify'
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => deleteReference(ref.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
