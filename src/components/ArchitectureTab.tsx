'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, CheckCircle, Link2, Save } from 'lucide-react';

interface Aim {
  id: string;
  title: string;
  hypothesis: string;
  isFalsifiable: boolean;
  endpoints: string[];
  rationale: string;
}

interface ArchitectureData {
  aims: Aim[];
  centralHypothesis: string;
  innovationStatement: string;
  lastUpdated?: string;
}

interface ArchitectureTabProps {
  sectionId: number;
  applicationId: number;
  initialData?: ArchitectureData;
  onSave?: (data: ArchitectureData) => void;
}

const emptyAim = (): Aim => ({
  id: crypto.randomUUID(),
  title: '',
  hypothesis: '',
  isFalsifiable: true,
  endpoints: [''],
  rationale: ''
});

export default function ArchitectureTab({ sectionId, applicationId, initialData, onSave }: ArchitectureTabProps) {
  const [data, setData] = useState<ArchitectureData>(initialData || {
    aims: [emptyAim()],
    centralHypothesis: '',
    innovationStatement: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateAim = (aimId: string, field: keyof Aim, value: unknown) => {
    setData(prev => ({
      ...prev,
      aims: prev.aims.map(aim => 
        aim.id === aimId ? { ...aim, [field]: value } : aim
      )
    }));
    setSaved(false);
  };

  const addAim = () => {
    setData(prev => ({ ...prev, aims: [...prev.aims, emptyAim()] }));
    setSaved(false);
  };

  const removeAim = (aimId: string) => {
    setData(prev => ({
      ...prev,
      aims: prev.aims.filter(aim => aim.id !== aimId)
    }));
    setSaved(false);
  };

  const addEndpoint = (aimId: string) => {
    setData(prev => ({
      ...prev,
      aims: prev.aims.map(aim =>
        aim.id === aimId ? { ...aim, endpoints: [...aim.endpoints, ''] } : aim
      )
    }));
    setSaved(false);
  };

  const updateEndpoint = (aimId: string, index: number, value: string) => {
    setData(prev => ({
      ...prev,
      aims: prev.aims.map(aim =>
        aim.id === aimId ? {
          ...aim,
          endpoints: aim.endpoints.map((ep, i) => i === index ? value : ep)
        } : aim
      )
    }));
    setSaved(false);
  };

  const removeEndpoint = (aimId: string, index: number) => {
    setData(prev => ({
      ...prev,
      aims: prev.aims.map(aim =>
        aim.id === aimId ? {
          ...aim,
          endpoints: aim.endpoints.filter((_, i) => i !== index)
        } : aim
      )
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saveData = { ...data, lastUpdated: new Date().toISOString() };
      const res = await fetch(`/api/sections/${sectionId}/architecture`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ architectureJsonb: saveData })
      });
      if (res.ok) {
        setSaved(true);
        onSave?.(saveData);
      }
    } catch (error) {
      console.error('Failed to save architecture:', error);
    } finally {
      setSaving(false);
    }
  };

  const getCompletionStatus = () => {
    const issues: string[] = [];
    if (!data.centralHypothesis) issues.push('Missing central hypothesis');
    if (data.aims.length === 0) issues.push('No aims defined');
    data.aims.forEach((aim, i) => {
      if (!aim.title) issues.push(`Aim ${i + 1}: Missing title`);
      if (!aim.hypothesis) issues.push(`Aim ${i + 1}: Missing hypothesis`);
      if (aim.endpoints.filter(e => e.trim()).length === 0) {
        issues.push(`Aim ${i + 1}: No endpoints defined`);
      }
    });
    return issues;
  };

  const issues = getCompletionStatus();

  return (
    <div className="space-y-6 p-4">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Architecture Design</h2>
        <div className="flex items-center gap-4">
          {issues.length > 0 ? (
            <span className="flex items-center gap-1 text-amber-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {issues.length} issue{issues.length > 1 ? 's' : ''}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Complete
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      {/* Central Hypothesis */}
      <div className="bg-white border rounded-lg p-4">
        <label className="block font-medium mb-2">Central Hypothesis</label>
        <textarea
          value={data.centralHypothesis}
          onChange={e => {
            setData(prev => ({ ...prev, centralHypothesis: e.target.value }));
            setSaved(false);
          }}
          className="w-full h-24 p-3 border rounded-lg resize-none"
          placeholder="State your overarching hypothesis that unifies all aims..."
        />
      </div>

      {/* Innovation Statement */}
      <div className="bg-white border rounded-lg p-4">
        <label className="block font-medium mb-2">Innovation Statement</label>
        <textarea
          value={data.innovationStatement}
          onChange={e => {
            setData(prev => ({ ...prev, innovationStatement: e.target.value }));
            setSaved(false);
          }}
          className="w-full h-20 p-3 border rounded-lg resize-none"
          placeholder="What is novel about your approach?"
        />
      </div>

      {/* Aims */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Specific Aims</h3>
          <button
            onClick={addAim}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" /> Add Aim
          </button>
        </div>

        {data.aims.map((aim, aimIndex) => (
          <div key={aim.id} className="bg-white border rounded-lg p-4 space-y-4">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-gray-700">Aim {aimIndex + 1}</h4>
              {data.aims.length > 1 && (
                <button
                  onClick={() => removeAim(aim.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={aim.title}
                onChange={e => updateAim(aim.id, 'title', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="e.g., Determine the mechanism of..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Hypothesis</label>
              <textarea
                value={aim.hypothesis}
                onChange={e => updateAim(aim.id, 'hypothesis', e.target.value)}
                className="w-full h-20 p-2 border rounded resize-none"
                placeholder="State a testable hypothesis..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`falsifiable-${aim.id}`}
                checked={aim.isFalsifiable}
                onChange={e => updateAim(aim.id, 'isFalsifiable', e.target.checked)}
                className="rounded"
              />
              <label htmlFor={`falsifiable-${aim.id}`} className="text-sm">
                Hypothesis is falsifiable (can be proven wrong with evidence)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Rationale</label>
              <textarea
                value={aim.rationale}
                onChange={e => updateAim(aim.id, 'rationale', e.target.value)}
                className="w-full h-16 p-2 border rounded resize-none"
                placeholder="Why is this aim necessary?"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Endpoints / Outcomes</label>
                <button
                  onClick={() => addEndpoint(aim.id)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  + Add Endpoint
                </button>
              </div>
              <div className="space-y-2">
                {aim.endpoints.map((endpoint, epIndex) => (
                  <div key={epIndex} className="flex gap-2">
                    <input
                      type="text"
                      value={endpoint}
                      onChange={e => updateEndpoint(aim.id, epIndex, e.target.value)}
                      className="flex-1 p-2 border rounded"
                      placeholder="e.g., Primary endpoint: reduction in..."
                    />
                    {aim.endpoints.length > 1 && (
                      <button
                        onClick={() => removeEndpoint(aim.id, epIndex)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Completion Issues */}
      {issues.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 mb-2">Completion Checklist</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" /> {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
