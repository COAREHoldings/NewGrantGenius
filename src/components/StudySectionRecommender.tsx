'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Target, Loader2, AlertCircle, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface Recommendation {
  abbreviation: string;
  name: string;
  matchScore: number;
  reasons: string[];
  concerns: string[];
  strategy: string;
  parentCommittee?: string;
}

interface AssignmentRequest {
  recommended: boolean;
  suggestedSection: string;
  justification: string;
}

interface StudySectionResult {
  recommendations: Recommendation[];
  assignmentRequest: AssignmentRequest;
  generalAdvice: string;
}

interface Props {
  title: string;
  specificAims: string;
  researchStrategy: string;
}

export default function StudySectionRecommender({ title, specificAims, researchStrategy }: Props) {
  const { checkDemoFeature } = useAuth();
  const [result, setResult] = useState<StudySectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const analyze = async () => {
    if (!checkDemoFeature('AI Generation')) return;
    if (!specificAims && !researchStrategy) {
      setError('Please complete Specific Aims or Research Strategy sections first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/study-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, specificAims, researchStrategy }),
      });

      if (!response.ok) throw new Error('Failed to analyze');
      
      const data = await response.json();
      setResult(data);
      if (data.recommendations?.length > 0) {
        setExpandedSections([data.recommendations[0].abbreviation]);
      }
    } catch (err) {
      setError('Failed to get study section recommendations. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (abbr: string) => {
    setExpandedSections(prev => 
      prev.includes(abbr) ? prev.filter(a => a !== abbr) : [...prev, abbr]
    );
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="border rounded-lg bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-950 dark:to-cyan-950">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          <span className="font-medium text-sm">Study Section Recommender</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              analyze();
            }}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Target className="w-4 h-4" />
            )}
            Analyze
          </button>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="border-t p-3 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {!result && !loading && !error && (
            <p className="text-sm text-gray-500 text-center py-4">
              Click &quot;Analyze&quot; to get AI-powered study section recommendations based on your grant content
            </p>
          )}

          {result && (
            <>
              {/* Recommendations */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Top Recommended Study Sections</h4>
                
                {result.recommendations?.map((rec, index) => (
                  <div key={rec.abbreviation} className="border rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      onClick={() => toggleSection(rec.abbreviation)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                        <div>
                          <span className="font-semibold text-indigo-600">{rec.abbreviation}</span>
                          <span className="text-sm text-gray-600 ml-2">{rec.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(rec.matchScore)}`}>
                          {rec.matchScore}% match
                        </span>
                        {expandedSections.includes(rec.abbreviation) ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {expandedSections.includes(rec.abbreviation) && (
                      <div className="p-3 border-t bg-gray-50 dark:bg-gray-900 space-y-3">
                        {/* Reasons */}
                        <div>
                          <div className="flex items-center gap-1 text-xs font-medium text-green-600 mb-1">
                            <CheckCircle className="w-3 h-3" /> Why it&apos;s a good fit
                          </div>
                          <ul className="text-sm text-gray-700 space-y-1">
                            {rec.reasons?.map((r, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-500">•</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Concerns */}
                        {rec.concerns?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1 text-xs font-medium text-amber-600 mb-1">
                              <AlertCircle className="w-3 h-3" /> Potential concerns
                            </div>
                            <ul className="text-sm text-gray-700 space-y-1">
                              {rec.concerns.map((c, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-amber-500">•</span> {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Strategy */}
                        {rec.strategy && (
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-900 rounded text-sm">
                            <span className="font-medium text-indigo-700">Strategy: </span>
                            <span className="text-gray-700 dark:text-gray-300">{rec.strategy}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Assignment Request */}
              {result.assignmentRequest?.recommended && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
                    <Info className="w-4 h-4" />
                    Assignment Request Recommended
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Request assignment to: <strong>{result.assignmentRequest.suggestedSection}</strong>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{result.assignmentRequest.justification}</p>
                </div>
              )}

              {/* General Advice */}
              {result.generalAdvice && (
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 mb-1">Strategic Advice</div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{result.generalAdvice}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
