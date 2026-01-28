'use client';

import { useState } from 'react';
import { 
  Sparkles, Check, X, Loader2, ChevronDown, ChevronUp, 
  AlertTriangle, CheckCircle, Star, RefreshCw, Copy,
  ThumbsUp, ThumbsDown, Zap
} from 'lucide-react';

interface Suggestion {
  category: string;
  issue: string;
  recommendation: string;
  priority: 'High' | 'Medium' | 'Low';
  status?: 'pending' | 'accepted' | 'rejected';
}

interface Critique {
  score: number;
  scoreLabel: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: Suggestion[];
  sectionSpecificFeedback?: {
    significance?: string;
    innovation?: string;
    approach?: string;
    investigators?: string;
    environment?: string;
  };
}

interface Rewrite {
  rewrittenContent: string;
  changes: { type: string; description: string }[];
  improvementSummary: string;
}

interface AICritiqueProps {
  content: string;
  sectionType: string;
  grantType: string;
  onAcceptRewrite: (newContent: string) => void;
}

export default function AICritique({ content, sectionType, grantType, onAcceptRewrite }: AICritiqueProps) {
  const [critique, setCritique] = useState<Critique | null>(null);
  const [rewrite, setRewrite] = useState<Rewrite | null>(null);
  const [loading, setLoading] = useState(false);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'critique' | 'rewrite'>('critique');

  const fetchCritique = async () => {
    if (!content || content.trim().length < 100) {
      setError('Please write at least 100 characters before requesting AI critique.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai-critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sectionType, grantType, mode: 'critique' }),
      });

      if (!response.ok) throw new Error('Failed to fetch critique');

      const data = await response.json();
      setCritique({
        ...data.critique,
        suggestions: data.critique.suggestions?.map((s: Suggestion) => ({ ...s, status: 'pending' })) || []
      });
      setActiveTab('critique');
    } catch (err) {
      setError('Failed to get AI critique. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRewrite = async () => {
    if (!content || content.trim().length < 100) {
      setError('Please write at least 100 characters before requesting a rewrite.');
      return;
    }

    setRewriteLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai-critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sectionType, grantType, mode: 'rewrite' }),
      });

      if (!response.ok) throw new Error('Failed to fetch rewrite');

      const data = await response.json();
      setRewrite(data.rewrite);
      setActiveTab('rewrite');
    } catch (err) {
      setError('Failed to get AI rewrite. Please try again.');
      console.error(err);
    } finally {
      setRewriteLoading(false);
    }
  };

  const handleAcceptSuggestion = (index: number) => {
    if (!critique) return;
    setCritique({
      ...critique,
      suggestions: critique.suggestions.map((s, i) => 
        i === index ? { ...s, status: 'accepted' } : s
      )
    });
  };

  const handleRejectSuggestion = (index: number) => {
    if (!critique) return;
    setCritique({
      ...critique,
      suggestions: critique.suggestions.map((s, i) => 
        i === index ? { ...s, status: 'rejected' } : s
      )
    });
  };

  const getScoreColor = (score: number) => {
    if (score <= 2) return 'text-green-600 bg-green-100';
    if (score <= 4) return 'text-blue-600 bg-blue-100';
    if (score <= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const pendingCount = critique?.suggestions?.filter(s => s.status === 'pending').length || 0;

  return (
    <div className="border rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer border-b"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Zap className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <span className="font-semibold text-sm">AI Critique & Analysis</span>
            {critique && (
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs font-bold rounded ${getScoreColor(critique.score)}`}>
                  Score: {critique.score}/10 - {critique.scoreLabel}
                </span>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-purple-600 text-white rounded-full">
                    {pendingCount} suggestions
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); fetchCritique(); }}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Critique
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); fetchRewrite(); }}
            disabled={rewriteLoading}
            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
          >
            {rewriteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Rewrite
          </button>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm mb-4">
              {error}
            </div>
          )}

          {!critique && !rewrite && !loading && !rewriteLoading && (
            <p className="text-sm text-gray-500 text-center py-6">
              Click "Critique" for detailed NIH-style review feedback and scoring, or "Rewrite" for an AI-improved draft.
            </p>
          )}

          {(critique || rewrite) && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-2 border-b pb-2">
                <button
                  onClick={() => setActiveTab('critique')}
                  className={`px-3 py-1.5 text-sm rounded-t-md ${
                    activeTab === 'critique' 
                      ? 'bg-white border border-b-white text-indigo-700 font-medium -mb-px' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  disabled={!critique}
                >
                  Critique & Score
                </button>
                <button
                  onClick={() => setActiveTab('rewrite')}
                  className={`px-3 py-1.5 text-sm rounded-t-md ${
                    activeTab === 'rewrite' 
                      ? 'bg-white border border-b-white text-purple-700 font-medium -mb-px' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  disabled={!rewrite}
                >
                  Draft Rewrite
                </button>
              </div>

              {/* Critique Tab */}
              {activeTab === 'critique' && critique && (
                <div className="space-y-4">
                  {/* Score Card */}
                  <div className={`p-4 rounded-lg ${getScoreColor(critique.score)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5" />
                          <span className="text-2xl font-bold">{critique.score}</span>
                          <span className="text-lg">/10</span>
                        </div>
                        <p className="font-medium mt-1">{critique.scoreLabel}</p>
                      </div>
                      <div className="text-right text-sm max-w-md">
                        {critique.summary}
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-green-800 flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4" /> Strengths
                      </h4>
                      <ul className="space-y-1 text-sm text-green-700">
                        {critique.strengths?.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ThumbsUp className="w-3 h-3 mt-1 flex-shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <h4 className="font-medium text-red-800 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" /> Weaknesses
                      </h4>
                      <ul className="space-y-1 text-sm text-red-700">
                        {critique.weaknesses?.map((w, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ThumbsDown className="w-3 h-3 mt-1 flex-shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Suggestions */}
                  {critique.suggestions && critique.suggestions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">Actionable Suggestions</h4>
                      {critique.suggestions.map((suggestion, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg border ${
                            suggestion.status === 'accepted' 
                              ? 'bg-green-50 border-green-200' 
                              : suggestion.status === 'rejected'
                              ? 'bg-gray-50 border-gray-200 opacity-50'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-indigo-600">{suggestion.category}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(suggestion.priority)}`}>
                                  {suggestion.priority}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-gray-800">{suggestion.issue}</p>
                              <p className="text-sm text-gray-600 mt-1">{suggestion.recommendation}</p>
                            </div>
                            {suggestion.status === 'pending' && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleAcceptSuggestion(index)}
                                  className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                  title="Mark as addressed"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectSuggestion(index)}
                                  className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                  title="Dismiss"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Rewrite Tab */}
              {activeTab === 'rewrite' && rewrite && (
                <div className="space-y-4">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Improvement Summary</h4>
                    <p className="text-sm text-purple-700">{rewrite.improvementSummary}</p>
                  </div>

                  {rewrite.changes && rewrite.changes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-800 text-sm">Changes Made:</h4>
                      <div className="flex flex-wrap gap-2">
                        {rewrite.changes.map((change, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded">
                            <span className="font-medium">{change.type}:</span> {change.description}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-lg border max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">Rewritten Draft</h4>
                      <button
                        onClick={() => navigator.clipboard.writeText(rewrite.rewrittenContent)}
                        className="p-1.5 text-gray-500 hover:text-gray-700"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {rewrite.rewrittenContent}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onAcceptRewrite(rewrite.rewrittenContent)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Accept & Replace
                    </button>
                    <button
                      onClick={() => setRewrite(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
