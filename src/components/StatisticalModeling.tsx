'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, CheckCircle2, XCircle, RefreshCw, 
  ChevronDown, ChevronRight, Sparkles, AlertTriangle,
  ThumbsUp, ThumbsDown, Edit3
} from 'lucide-react';

interface Aim {
  id: string;
  title: string;
  hypothesis: string;
  endpoints: string[];
}

interface StatModel {
  id: number;
  aimId: string;
  aimTitle: string;
  analysisType: string;
  sampleSize: number;
  powerAnalysis: {
    power: number;
    effectSize: number;
    alpha: number;
  };
  assumptions: string[];
  methodology: string;
  justification: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  userNotes?: string;
}

// SRO = Scientific Review Officer (first line help)
const REVIEW_LEVELS = {
  sro: { label: 'SRO Review', description: 'Scientific Review Officer - Initial Assessment' },
  director: { label: 'Director Review', description: 'Program Director - Detailed Analysis' },
  committee: { label: 'Review Committee', description: 'Study Section - Comprehensive Evaluation' },
  council: { label: 'Council', description: 'Advisory Council - Final Assessment' }
};

export default function StatisticalModeling({ applicationId }: { applicationId: number }) {
  const [aims, setAims] = useState<Aim[]>([]);
  const [models, setModels] = useState<StatModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [expandedAims, setExpandedAims] = useState<Set<string>>(new Set());
  const [editingModel, setEditingModel] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [applicationId]);

  const fetchData = async () => {
    try {
      const [aimsRes, modelsRes] = await Promise.all([
        fetch(`/api/sections?applicationId=${applicationId}&type=specific_aims`),
        fetch(`/api/submission/statistics?applicationId=${applicationId}`)
      ]);

      if (aimsRes.ok) {
        const data = await aimsRes.json();
        // Extract aims from architecture data
        const section = data[0];
        if (section?.architectureJsonb?.aims) {
          setAims(section.architectureJsonb.aims);
          setExpandedAims(new Set(section.architectureJsonb.aims.map((a: Aim) => a.id)));
        }
      }
      
      if (modelsRes.ok) {
        const data = await modelsRes.json();
        setModels(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateModel = async (aim: Aim) => {
    setGenerating(aim.id);
    try {
      const res = await fetch('/api/submission/statistics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          applicationId,
          aimId: aim.id,
          aimTitle: aim.title,
          hypothesis: aim.hypothesis,
          endpoints: aim.endpoints
        })
      });

      if (res.ok) {
        const result = await res.json();
        setModels(prev => {
          const existing = prev.findIndex(m => m.aimId === aim.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = result;
            return updated;
          }
          return [...prev, result];
        });
      }
    } catch (error) {
      console.error('Error generating model:', error);
    } finally {
      setGenerating(null);
    }
  };

  const updateModelStatus = async (modelId: number, status: 'accepted' | 'rejected', notes?: string) => {
    try {
      const res = await fetch(`/api/submission/statistics/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userNotes: notes })
      });

      if (res.ok) {
        setModels(prev => prev.map(m => 
          m.id === modelId ? { ...m, status, userNotes: notes } : m
        ));
      }
    } catch (error) {
      console.error('Error updating model:', error);
    }
    setEditingModel(null);
  };

  const generateAllModels = async () => {
    for (const aim of aims) {
      if (!models.find(m => m.aimId === aim.id)) {
        await generateModel(aim);
      }
    }
  };

  const toggleAim = (aimId: string) => {
    setExpandedAims(prev => {
      const next = new Set(prev);
      if (next.has(aimId)) {
        next.delete(aimId);
      } else {
        next.add(aimId);
      }
      return next;
    });
  };

  const acceptedCount = models.filter(m => m.status === 'accepted').length;
  const pendingCount = models.filter(m => m.status === 'pending').length;

  if (loading) {
    return <div className="text-center py-8">Loading statistical models...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Statistical Modeling</h3>
            <p className="text-sm text-slate-500 mt-1">
              SRO-generated statistical plans for each aim. Review and accept/reject as needed.
            </p>
          </div>
          <button
            onClick={generateAllModels}
            disabled={generating !== null}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            Generate All Models
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{aims.length}</p>
            <p className="text-sm text-slate-500">Research Aims</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{acceptedCount}</p>
            <p className="text-sm text-slate-500">Accepted Models</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-sm text-slate-500">Pending Review</p>
          </div>
        </div>
      </div>

      {/* Review Levels Info */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-4">
        <h4 className="font-medium text-indigo-900 mb-2">Review Hierarchy</h4>
        <div className="grid grid-cols-4 gap-4 text-sm">
          {Object.entries(REVIEW_LEVELS).map(([key, value]) => (
            <div key={key} className="text-center">
              <p className="font-medium text-indigo-700">{value.label}</p>
              <p className="text-indigo-600/70 text-xs">{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Aims & Models */}
      {aims.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-600">No aims defined yet. Add aims in the Specific Aims section to generate statistical models.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {aims.map((aim) => {
            const model = models.find(m => m.aimId === aim.id);
            const isExpanded = expandedAims.has(aim.id);
            
            return (
              <div key={aim.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleAim(aim.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{aim.title}</p>
                      <p className="text-sm text-slate-500 line-clamp-1">{aim.hypothesis}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {model ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        model.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        model.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {model.status}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600">
                        No model
                      </span>
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 p-4">
                    {model ? (
                      <div className="space-y-4">
                        {/* Model Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Analysis Type</p>
                            <p className="font-medium text-slate-900 mt-1">{model.analysisType}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase tracking-wide">Sample Size</p>
                            <p className="font-medium text-slate-900 mt-1">n = {model.sampleSize}</p>
                          </div>
                        </div>

                        {/* Power Analysis */}
                        <div className="p-4 bg-indigo-50 rounded-lg">
                          <p className="text-sm font-medium text-indigo-900 mb-2">Power Analysis</p>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-indigo-600">Power</p>
                              <p className="font-semibold text-indigo-900">{(model.powerAnalysis.power * 100).toFixed(0)}%</p>
                            </div>
                            <div>
                              <p className="text-indigo-600">Effect Size (d)</p>
                              <p className="font-semibold text-indigo-900">{model.powerAnalysis.effectSize}</p>
                            </div>
                            <div>
                              <p className="text-indigo-600">Alpha (α)</p>
                              <p className="font-semibold text-indigo-900">{model.powerAnalysis.alpha}</p>
                            </div>
                          </div>
                        </div>

                        {/* Methodology */}
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Methodology</p>
                          <p className="text-sm text-slate-600">{model.methodology}</p>
                        </div>

                        {/* Assumptions */}
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Assumptions</p>
                          <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                            {model.assumptions.map((assumption, i) => (
                              <li key={i}>{assumption}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Justification */}
                        <div>
                          <p className="text-sm font-medium text-slate-900 mb-2">Justification</p>
                          <p className="text-sm text-slate-600">{model.justification}</p>
                        </div>

                        {/* User Notes */}
                        {model.userNotes && (
                          <div className="p-3 bg-amber-50 rounded-lg">
                            <p className="text-sm font-medium text-amber-900">Your Notes</p>
                            <p className="text-sm text-amber-700 mt-1">{model.userNotes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        {editingModel === model.id ? (
                          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                            <textarea
                              id={`notes-${model.id}`}
                              placeholder="Add notes about this statistical model..."
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                              rows={3}
                              defaultValue={model.userNotes || ''}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const notes = (document.getElementById(`notes-${model.id}`) as HTMLTextAreaElement).value;
                                  updateModelStatus(model.id, 'accepted', notes);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                Accept
                              </button>
                              <button
                                onClick={() => {
                                  const notes = (document.getElementById(`notes-${model.id}`) as HTMLTextAreaElement).value;
                                  updateModelStatus(model.id, 'rejected', notes);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                <ThumbsDown className="w-4 h-4" />
                                Reject
                              </button>
                              <button
                                onClick={() => setEditingModel(null)}
                                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-2">
                              {model.status === 'pending' && (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              )}
                              <span className="text-sm text-slate-500">
                                {model.status === 'pending' ? 'Awaiting your review' : 
                                 model.status === 'accepted' ? 'You accepted this model' : 
                                 'You rejected this model'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingModel(model.id)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                              >
                                <Edit3 className="w-4 h-4" />
                                Review
                              </button>
                              <button
                                onClick={() => generateModel(aim)}
                                disabled={generating === aim.id}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:text-indigo-700"
                              >
                                <RefreshCw className={`w-4 h-4 ${generating === aim.id ? 'animate-spin' : ''}`} />
                                Regenerate
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <BarChart3 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="text-slate-600 mb-4">No statistical model generated for this aim.</p>
                        <button
                          onClick={() => generateModel(aim)}
                          disabled={generating === aim.id}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          {generating === aim.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          Generate Model (SRO)
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
