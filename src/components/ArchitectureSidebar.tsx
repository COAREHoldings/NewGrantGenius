'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, Shield, RefreshCw } from 'lucide-react';

interface ScoreData {
  structuralScore?: number;
  completeness?: number;
  coherence?: number;
  falsifiability?: number;
}

interface RiskFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  aimId?: string;
}

interface RiskData {
  flags?: RiskFlag[];
  overallRisk?: 'low' | 'medium' | 'high' | 'critical';
}

interface ArchitectureSidebarProps {
  sectionId: number;
  onRefresh?: () => void;
}

export default function ArchitectureSidebar({ sectionId, onRefresh }: ArchitectureSidebarProps) {
  const [score, setScore] = useState<ScoreData | null>(null);
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sections/${sectionId}/architecture`);
      if (res.ok) {
        const data = await res.json();
        setScore(data.scoreJsonb || {});
        setRisk(data.riskJsonb || {});
      }
    } catch (error) {
      console.error('Failed to fetch architecture data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sectionId]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-600';
    if (s >= 60) return 'text-yellow-600';
    if (s >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskColor = (r: string) => {
    switch (r) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const structuralScore = score?.structuralScore || 0;
  const hasScore = score && score.structuralScore !== undefined;
  const hasRisks = risk && risk.flags && risk.flags.length > 0;

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-700">Architecture Status</h3>
        <button
          onClick={() => { fetchData(); onRefresh?.(); }}
          disabled={loading}
          className="text-gray-400 hover:text-gray-600"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Structural Score */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">Structural Score</span>
        </div>
        {hasScore ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${structuralScore >= 80 ? 'bg-green-500' : structuralScore >= 60 ? 'bg-yellow-500' : structuralScore >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                style={{ width: `${structuralScore}%` }}
              />
            </div>
            <span className={`text-lg font-bold ${getScoreColor(structuralScore)}`}>
              {structuralScore}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No score yet - complete Architecture tab</p>
        )}

        {hasScore && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Completeness</span>
              <span className={getScoreColor(score.completeness || 0)}>{score.completeness || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Coherence</span>
              <span className={getScoreColor(score.coherence || 0)}>{score.coherence || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Falsifiability</span>
              <span className={getScoreColor(score.falsifiability || 0)}>{score.falsifiability || 0}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Risk Assessment */}
      <div className="space-y-2 border-t pt-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">Risk Assessment</span>
        </div>
        
        {risk?.overallRisk ? (
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getRiskColor(risk.overallRisk)}`}>
            {risk.overallRisk === 'low' ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            {risk.overallRisk.charAt(0).toUpperCase() + risk.overallRisk.slice(1)} Risk
          </div>
        ) : (
          <p className="text-sm text-gray-500">No analysis yet</p>
        )}

        {hasRisks && (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {risk.flags!.slice(0, 5).map((flag, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                  flag.severity === 'critical' ? 'text-red-500' :
                  flag.severity === 'high' ? 'text-orange-500' :
                  flag.severity === 'medium' ? 'text-yellow-500' :
                  'text-gray-400'
                }`} />
                <span className="text-gray-600">{flag.message}</span>
              </div>
            ))}
            {risk.flags!.length > 5 && (
              <p className="text-xs text-gray-400">+{risk.flags!.length - 5} more issues</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
