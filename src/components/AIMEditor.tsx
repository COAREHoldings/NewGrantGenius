'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Target, Lightbulb } from 'lucide-react';

export interface Aim {
  id: string;
  number: number;
  title: string;
  rationale: string;
  hypothesis: string;
  approach: string;
}

interface AIMEditorProps {
  aims: Aim[];
  onChange: (aims: Aim[]) => void;
  maxAims?: number;
}

export default function AIMEditor({ aims, onChange, maxAims = 4 }: AIMEditorProps) {
  const [expandedAim, setExpandedAim] = useState<string | null>(aims[0]?.id || null);

  const addAim = () => {
    if (aims.length >= maxAims) return;
    const newAim: Aim = {
      id: Date.now().toString(),
      number: aims.length + 1,
      title: '',
      rationale: '',
      hypothesis: '',
      approach: ''
    };
    const updated = [...aims, newAim];
    onChange(updated);
    setExpandedAim(newAim.id);
  };

  const removeAim = (id: string) => {
    if (aims.length <= 1) return;
    const updated = aims
      .filter(a => a.id !== id)
      .map((a, i) => ({ ...a, number: i + 1 }));
    onChange(updated);
    if (expandedAim === id) {
      setExpandedAim(updated[0]?.id || null);
    }
  };

  const updateAim = (id: string, field: keyof Aim, value: string) => {
    const updated = aims.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    );
    onChange(updated);
  };

  const moveAim = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === aims.length - 1)
    ) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...aims];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    // Renumber
    onChange(updated.map((a, i) => ({ ...a, number: i + 1 })));
  };

  const getAimCompleteness = (aim: Aim) => {
    const fields = [aim.title, aim.rationale, aim.hypothesis, aim.approach];
    const filled = fields.filter(f => f && f.trim().length > 20).length;
    return Math.round((filled / 4) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-800">Specific Aims</h3>
          <span className="text-sm text-gray-500">({aims.length}/{maxAims})</span>
        </div>
        <button
          onClick={addAim}
          disabled={aims.length >= maxAims}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Aim
        </button>
      </div>

      <div className="space-y-3">
        {aims.map((aim, index) => {
          const completeness = getAimCompleteness(aim);
          const isExpanded = expandedAim === aim.id;

          return (
            <div 
              key={aim.id}
              className="border rounded-lg bg-white overflow-hidden"
            >
              {/* Aim Header */}
              <div 
                className="flex items-center gap-3 p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => setExpandedAim(isExpanded ? null : aim.id)}
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveAim(index, 'up'); }}
                    disabled={index === 0}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveAim(index, 'down'); }}
                    disabled={index === aims.length - 1}
                    className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                
                <GripVertical className="w-4 h-4 text-gray-400" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-600">Aim {aim.number}</span>
                    {aim.title && (
                      <span className="text-gray-700 truncate">: {aim.title}</span>
                    )}
                    {!aim.title && (
                      <span className="text-gray-400 italic">Untitled</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full max-w-32">
                      <div 
                        className={`h-full rounded-full ${
                          completeness === 100 ? 'bg-green-500' : 
                          completeness >= 50 ? 'bg-yellow-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{completeness}%</span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); removeAim(aim.id); }}
                  disabled={aims.length <= 1}
                  className="p-2 text-red-500 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>

              {/* Aim Content */}
              {isExpanded && (
                <div className="p-4 space-y-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aim Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={aim.title}
                      onChange={(e) => updateAim(aim.id, 'title', e.target.value)}
                      placeholder="e.g., Determine the molecular mechanisms of..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">A concise statement of what will be accomplished</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rationale
                    </label>
                    <textarea
                      value={aim.rationale}
                      onChange={(e) => updateAim(aim.id, 'rationale', e.target.value)}
                      placeholder="Why is this aim important? What gap does it address?"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      Hypothesis
                    </label>
                    <textarea
                      value={aim.hypothesis}
                      onChange={(e) => updateAim(aim.id, 'hypothesis', e.target.value)}
                      placeholder="We hypothesize that..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">A testable prediction that will be validated</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approach Summary
                    </label>
                    <textarea
                      value={aim.approach}
                      onChange={(e) => updateAim(aim.id, 'approach', e.target.value)}
                      placeholder="Briefly describe the methods/experiments for this aim"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {aims.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No aims defined yet</p>
          <button
            onClick={addAim}
            className="mt-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Add Your First Aim
          </button>
        </div>
      )}
    </div>
  );
}

// Helper to convert aims to formatted text for the section content
export function aimsToContent(aims: Aim[]): string {
  return aims.map(aim => {
    let content = `<h3>Aim ${aim.number}: ${aim.title || 'Untitled'}</h3>\n`;
    if (aim.rationale) content += `<p><strong>Rationale:</strong> ${aim.rationale}</p>\n`;
    if (aim.hypothesis) content += `<p><strong>Hypothesis:</strong> ${aim.hypothesis}</p>\n`;
    if (aim.approach) content += `<p><strong>Approach:</strong> ${aim.approach}</p>\n`;
    return content;
  }).join('\n');
}

// Helper to parse content back to aims
export function contentToAims(content: string): Aim[] {
  const aims: Aim[] = [];
  const aimPattern = /<h3>Aim\s*(\d+):\s*([^<]*)<\/h3>([\s\S]*?)(?=<h3>Aim|$)/gi;
  
  let match;
  while ((match = aimPattern.exec(content)) !== null) {
    const number = parseInt(match[1]);
    const title = match[2].trim();
    const body = match[3];
    
    const rationaleMatch = body.match(/<strong>Rationale:<\/strong>\s*([^<]*)/i);
    const hypothesisMatch = body.match(/<strong>Hypothesis:<\/strong>\s*([^<]*)/i);
    const approachMatch = body.match(/<strong>Approach:<\/strong>\s*([^<]*)/i);
    
    aims.push({
      id: Date.now().toString() + number,
      number,
      title,
      rationale: rationaleMatch ? rationaleMatch[1].trim() : '',
      hypothesis: hypothesisMatch ? hypothesisMatch[1].trim() : '',
      approach: approachMatch ? approachMatch[1].trim() : ''
    });
  }
  
  if (aims.length === 0) {
    aims.push({
      id: Date.now().toString(),
      number: 1,
      title: '',
      rationale: '',
      hypothesis: '',
      approach: ''
    });
  }
  
  return aims;
}
