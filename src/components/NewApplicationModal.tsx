'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FUNDING_AGENCIES, getAgencyMechanisms, AgencyType } from '@/lib/mechanisms';
import { Plus, X, FileText, Info, ChevronLeft } from 'lucide-react';

interface Props {
  onCreated: () => void;
}

export default function NewApplicationModal({ onCreated }: Props) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [agency, setAgency] = useState<AgencyType | ''>('');
  const [mechanism, setMechanism] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const agencyMechanisms = agency ? getAgencyMechanisms(agency) : [];
  const selectedMech = mechanism ? agencyMechanisms.find(m => m.id === mechanism) : null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mechanism) {
      setError('Please select a grant mechanism');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title, mechanism })
      });
      if (!res.ok) throw new Error('Failed to create application');
      setIsOpen(false);
      setTitle('');
      setAgency('');
      setMechanism('');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating application');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTitle('');
    setAgency('');
    setMechanism('');
    setError('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition"
      >
        <Plus className="w-5 h-5" />
        New Application
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Create New Grant Application</h2>
              <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Application Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Novel Therapeutic for Alzheimer's Disease"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Step 1: Agency Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">1. Select Funding Agency</label>
                <div className="grid gap-2">
                  {Object.values(FUNDING_AGENCIES).map(ag => (
                    <label
                      key={ag.id}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                        agency === ag.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="agency"
                        value={ag.id}
                        checked={agency === ag.id}
                        onChange={e => {
                          setAgency(e.target.value as AgencyType);
                          setMechanism('');
                        }}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-slate-900">{ag.name}</div>
                        <div className="text-sm text-slate-600">{ag.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 2: Mechanism Selection */}
              {agency && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => { setAgency(''); setMechanism(''); }}
                      className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Change Agency
                    </button>
                  </div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">2. Select Grant Mechanism</label>
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {agencyMechanisms.map(mech => (
                      <label
                        key={mech.id}
                        className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition ${
                          mechanism === mech.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="mechanism"
                          value={mech.id}
                          checked={mechanism === mech.id}
                          onChange={e => setMechanism(e.target.value)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-slate-900">{mech.name}</div>
                          <div className="text-sm text-slate-600">{mech.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {selectedMech && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                    <Info className="w-4 h-4" />
                    Application Structure Preview
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-slate-600">
                      <span className="font-medium">Sections:</span>
                      <ul className="mt-1 space-y-1">
                        {selectedMech.sections.map(sec => (
                          <li key={sec.type} className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-slate-400" />
                            {sec.title} ({sec.pageLimit === 0 ? 'No limit' : `${sec.pageLimit} page${sec.pageLimit > 1 ? 's' : ''} max`})
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-sm text-slate-600 mt-3">
                      <span className="font-medium">Required Attachments:</span> {selectedMech.attachments.filter(a => a.required).length}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !mechanism}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {loading ? 'Creating...' : 'Create Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
