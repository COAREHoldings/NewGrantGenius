'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Sparkles, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Suggestion {
  original: string;
  suggested: string;
  reason: string;
  status?: 'pending' | 'accepted' | 'rejected';
}

interface AISuggestionsProps {
  content: string;
  sectionType: string;
  grantType: string;
  onAccept: (original: string, suggested: string) => void;
}

export default function AISuggestions({ content, sectionType, grantType, onAccept }: AISuggestionsProps) {
  const { checkDemoFeature } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const fetchSuggestions = async () => {
    if (!checkDemoFeature('AI Generation')) return;
    if (!content || content.trim().length < 50) {
      setError('Please write at least 50 characters before requesting AI suggestions.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sectionType, grantType }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions.map((s: Suggestion) => ({ ...s, status: 'pending' })));
    } catch (err) {
      setError('Failed to get AI suggestions. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (index: number) => {
    const suggestion = suggestions[index];
    onAccept(suggestion.original, suggestion.suggested);
    
    setSuggestions(prev => 
      prev.map((s, i) => i === index ? { ...s, status: 'accepted' } : s)
    );
  };

  const handleReject = (index: number) => {
    setSuggestions(prev => 
      prev.map((s, i) => i === index ? { ...s, status: 'rejected' } : s)
    );
  };

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

  return (
    <div className="border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span className="font-medium text-sm">AI Writing Assistant</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-purple-600 text-white rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fetchSuggestions();
            }}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Get Suggestions
          </button>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="border-t p-3 space-y-3">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md text-sm">
              {error}
            </div>
          )}

          {suggestions.length === 0 && !loading && !error && (
            <p className="text-sm text-gray-500 text-center py-4">
              Click &quot;Get Suggestions&quot; to receive AI-powered writing improvements
            </p>
          )}

          {suggestions.map((suggestion, index) => (
            <div 
              key={index}
              className={`p-3 rounded-lg border ${
                suggestion.status === 'accepted' 
                  ? 'bg-green-50 dark:bg-green-950 border-green-200' 
                  : suggestion.status === 'rejected'
                  ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 opacity-50'
                  : 'bg-white dark:bg-gray-800 border-gray-200'
              }`}
            >
              {/* Original text */}
              <div className="mb-2">
                <span className="text-xs font-medium text-red-600 uppercase">Original:</span>
                <p className="text-sm line-through text-gray-500 mt-1">{suggestion.original}</p>
              </div>

              {/* Suggested text */}
              <div className="mb-2">
                <span className="text-xs font-medium text-green-600 uppercase">Suggested:</span>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{suggestion.suggested}</p>
              </div>

              {/* Reason */}
              <div className="mb-3">
                <span className="text-xs font-medium text-blue-600 uppercase">Why:</span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{suggestion.reason}</p>
              </div>

              {/* Actions */}
              {suggestion.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(index)}
                    className="flex-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(index)}
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 flex items-center justify-center gap-1"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}

              {suggestion.status === 'accepted' && (
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Applied to document
                </div>
              )}

              {suggestion.status === 'rejected' && (
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <X className="w-4 h-4" /> Dismissed
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
