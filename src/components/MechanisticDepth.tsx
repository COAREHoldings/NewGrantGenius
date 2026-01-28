'use client';

import { useState } from 'react';
import { Layers, Beaker, Zap, Target } from 'lucide-react';

interface MechanisticDepthProps {
  aims: { number: number; content: string }[];
  mechanism: string;
}

const DEPTH_CONFIG = {
  descriptive: { label: 'Descriptive', color: 'bg-slate-200 text-slate-700', icon: Layers },
  associative: { label: 'Associative', color: 'bg-blue-100 text-blue-700', icon: Target },
  mechanistic: { label: 'Mechanistic', color: 'bg-green-100 text-green-700', icon: Beaker },
  causal_intervention: { label: 'Causal', color: 'bg-purple-100 text-purple-700', icon: Zap }
};

export default function MechanisticDepth({ aims, mechanism }: MechanisticDepthProps) {
  const [analyses, setAnalyses] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState<number | null>(null);

  const analyzeAim = async (aimNumber: number, content: string) => {
    setLoading(aimNumber);
    try {
      const res = await fetch('/api/mechanistic-depth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, aimNumber })
      });
      const data = await res.json();
      setAnalyses(prev => ({ ...prev, [aimNumber]: data }));
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(null);
    }
  };

  const isR01 = mechanism?.includes('R01');

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <Beaker className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-slate-900 text-sm">Mechanistic Depth</span>
        </div>
        {isR01 && (
          <p className="text-xs text-slate-500 mt-1">R01 requires ≥ Mechanistic level</p>
        )}
      </div>
      <div className="p-3 space-y-2">
        {aims.length === 0 ? (
          <p className="text-xs text-slate-500">No aims detected.</p>
        ) : (
          aims.map(aim => {
            const analysis = analyses[aim.number];
            const config = analysis ? DEPTH_CONFIG[analysis.classification as keyof typeof DEPTH_CONFIG] : null;
            const Icon = config?.icon || Layers;
            
            return (
              <div key={aim.number} className="flex items-center justify-between p-2 border border-slate-200 rounded">
                <span className="text-sm">Aim {aim.number}</span>
                {analysis ? (
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${config?.color}`}>
                      <Icon className="w-3 h-3" />
                      {config?.label}
                    </span>
                    {isR01 && !analysis.r01Ready && (
                      <span className="text-xs text-red-500">⚠️</span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => analyzeAim(aim.number, aim.content)}
                    disabled={loading === aim.number}
                    className="text-xs text-purple-600 hover:underline disabled:opacity-50"
                  >
                    {loading === aim.number ? 'Analyzing...' : 'Analyze'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
