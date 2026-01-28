'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  X, Play, AlertTriangle, CheckCircle, XCircle, 
  Target, Lightbulb, FlaskConical, Users, Building2,
  TrendingUp, AlertOctagon
} from 'lucide-react';

interface ReviewResult {
  criterionScores: {
    significance: number;
    innovation: number;
    approach: number;
    investigators: number;
    environment: number;
  };
  strengths: string[];
  weaknesses: string[];
  fatalFlaws: string[];
  overallImpactScore: number;
  fundingTier: string;
  detailedFeedback: {
    section: string;
    feedback: string[];
  }[];
}

interface Props {
  applicationId: number;
  isOpen: boolean;
  onClose: () => void;
}

const criterionIcons = {
  significance: Target,
  innovation: Lightbulb,
  approach: FlaskConical,
  investigators: Users,
  environment: Building2
};

const criterionLabels = {
  significance: 'Significance',
  innovation: 'Innovation',
  approach: 'Approach',
  investigators: 'Investigator(s)',
  environment: 'Environment'
};

function ScoreBadge({ score }: { score: number }) {
  let colorClass = 'bg-green-100 text-green-800';
  if (score >= 4 && score <= 5) colorClass = 'bg-yellow-100 text-yellow-800';
  if (score >= 6 && score <= 7) colorClass = 'bg-orange-100 text-orange-800';
  if (score >= 8) colorClass = 'bg-red-100 text-red-800';

  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${colorClass}`}>
      {score}
    </span>
  );
}

function FundingTierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    'Highly Competitive': 'bg-green-600 text-white',
    'Competitive': 'bg-blue-600 text-white',
    'Marginal': 'bg-orange-500 text-white',
    'Not Competitive': 'bg-red-600 text-white'
  };

  return (
    <span className={`px-4 py-2 rounded-lg font-semibold ${colors[tier] || 'bg-slate-500 text-white'}`}>
      {tier}
    </span>
  );
}

export default function ReviewerSimulation({ applicationId, isOpen, onClose }: Props) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ applicationId })
      });
      
      if (!res.ok) {
        throw new Error('Failed to run review simulation');
      }
      
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Study Section Simulation</h2>
            <p className="text-sm text-slate-600">NIH-style peer review analysis</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!result && !loading && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Play className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to Simulate Review</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                This simulation analyzes your application content and provides NIH-style 
                criterion scores (1-9 scale, 1 = exceptional, 9 = poor), identifies strengths, 
                weaknesses, and potential fatal flaws.
              </p>
              <button
                onClick={runSimulation}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
              >
                <Play className="w-5 h-5" />
                Run Review Simulation
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Analyzing application...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={runSimulation}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {/* Overall Impact Score */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-300 text-sm uppercase tracking-wide">Overall Impact Score</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-5xl font-bold">{result.overallImpactScore}</span>
                      <div className="text-slate-300">
                        <p className="text-sm">out of 9</p>
                        <p className="text-xs">(1 = best)</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-300 text-sm uppercase tracking-wide mb-2">Funding Probability</p>
                    <FundingTierBadge tier={result.fundingTier} />
                  </div>
                </div>
              </div>

              {/* Fatal Flaws */}
              {result.fatalFlaws.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertOctagon className="w-6 h-6 text-red-600" />
                    <h3 className="font-semibold text-red-800">Fatal Flaws Detected</h3>
                  </div>
                  <ul className="space-y-2">
                    {result.fatalFlaws.map((flaw, i) => (
                      <li key={i} className="flex items-start gap-2 text-red-700">
                        <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{flaw}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Criterion Scores */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Criterion Scores</h3>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  {Object.entries(result.criterionScores).map(([key, score]) => {
                    const Icon = criterionIcons[key as keyof typeof criterionIcons];
                    const label = criterionLabels[key as keyof typeof criterionLabels];
                    return (
                      <div key={key} className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                        <Icon className="w-6 h-6 text-slate-500 mb-2" />
                        <span className="text-xs text-slate-600 mb-2 text-center">{label}</span>
                        <ScoreBadge score={score} />
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  NIH Scale: 1 (Exceptional) - 3 (Excellent) - 5 (Good) - 7 (Fair) - 9 (Poor)
                </p>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">Strengths ({result.strengths.length})</h3>
                  </div>
                  {result.strengths.length > 0 ? (
                    <ul className="space-y-2">
                      {result.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2 text-green-700 text-sm">
                          <span className="text-green-500 mt-1">+</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-green-600 text-sm italic">No significant strengths identified</p>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-800">Weaknesses ({result.weaknesses.length})</h3>
                  </div>
                  {result.weaknesses.length > 0 ? (
                    <ul className="space-y-2">
                      {result.weaknesses.map((weakness, i) => (
                        <li key={i} className="flex items-start gap-2 text-amber-700 text-sm">
                          <span className="text-amber-500 mt-1">-</span>
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-amber-600 text-sm italic">No significant weaknesses identified</p>
                  )}
                </div>
              </div>

              {/* Detailed Feedback */}
              {result.detailedFeedback.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Improvement Suggestions</h3>
                  </div>
                  <div className="space-y-3">
                    {result.detailedFeedback.map((item, i) => (
                      <div key={i}>
                        <p className="text-sm font-medium text-blue-800">{item.section}:</p>
                        <ul className="mt-1 space-y-1">
                          {item.feedback.map((fb, j) => (
                            <li key={j} className="text-sm text-blue-700 pl-4">- {fb}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Run Again */}
              <div className="text-center pt-4">
                <button
                  onClick={runSimulation}
                  className="inline-flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                >
                  <Play className="w-4 h-4" />
                  Run Simulation Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
