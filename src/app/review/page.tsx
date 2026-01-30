'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Upload, FileText, ArrowLeft, CheckCircle, XCircle, AlertTriangle,
  Sparkles, Target, Users, DollarSign, FlaskConical, BarChart3,
  ChevronDown, ChevronUp, Loader2, FileSearch, Lightbulb
} from 'lucide-react';

interface SectionScore {
  name: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'needs_work' | 'missing';
  findings: string[];
  recommendations: string[];
}

interface ReviewResult {
  overallScore: number;
  fundabilityRating: 'High' | 'Medium' | 'Low' | 'Needs Major Revision';
  grantType: string;
  projectTitle: string;
  sections: SectionScore[];
  strengthsOverall: string[];
  weaknessesOverall: string[];
  topPriorities: string[];
}

export default function ReviewPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      processFile(file);
    } else {
      setError('Please upload a PDF file');
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const processFile = async (file: File) => {
    setUploadedFile(file);
    setIsProcessing(true);
    setError(null);
    setReviewResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/review/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze document');
      }

      const result = await response.json();
      setReviewResult(result);
    } catch (err) {
      setError('Failed to analyze document. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSection = (name: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedSections(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'good': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'needs_work': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'missing': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 border-green-200';
      case 'good': return 'bg-blue-100 border-blue-200';
      case 'needs_work': return 'bg-amber-100 border-amber-200';
      case 'missing': return 'bg-red-100 border-red-200';
      default: return 'bg-slate-100 border-slate-200';
    }
  };

  const getFundabilityColor = (rating: string) => {
    switch (rating) {
      case 'High': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-blue-600 bg-blue-100';
      case 'Low': return 'text-amber-600 bg-amber-100';
      default: return 'text-red-600 bg-red-100';
    }
  };

  const getSectionIcon = (name: string) => {
    if (name.toLowerCase().includes('aim') || name.toLowerCase().includes('objective')) return <Target className="w-5 h-5" />;
    if (name.toLowerCase().includes('significance')) return <Sparkles className="w-5 h-5" />;
    if (name.toLowerCase().includes('innovation')) return <Lightbulb className="w-5 h-5" />;
    if (name.toLowerCase().includes('approach') || name.toLowerCase().includes('strategy')) return <FlaskConical className="w-5 h-5" />;
    if (name.toLowerCase().includes('team') || name.toLowerCase().includes('investigator')) return <Users className="w-5 h-5" />;
    if (name.toLowerCase().includes('budget')) return <DollarSign className="w-5 h-5" />;
    if (name.toLowerCase().includes('environment')) return <BarChart3 className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const resetReview = () => {
    setUploadedFile(null);
    setReviewResult(null);
    setError(null);
    setExpandedSections(new Set());
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <FileSearch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900">Grant Document Review</h1>
                <p className="text-xs text-slate-500">AI-Powered Analysis & Scoring</p>
              </div>
            </div>
          </div>
          {reviewResult && (
            <button onClick={resetReview} className="text-sm text-slate-500 hover:text-slate-700">
              Review Another Document
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!reviewResult && !isProcessing && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-2xl p-16 text-center transition-all cursor-pointer
              ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-white hover:border-primary-400 hover:bg-slate-50'}
            `}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isDragging ? 'bg-primary-100' : 'bg-slate-100'}`}>
                <Upload className={`w-10 h-10 ${isDragging ? 'text-primary-500' : 'text-slate-400'}`} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  {isDragging ? 'Drop your document here' : 'Upload Grant Document'}
                </h2>
                <p className="text-slate-500 mb-4">
                  Drag and drop your PDF or click to browse
                </p>
                <p className="text-sm text-slate-400">
                  Supports NIH SF-424, SBIR/STTR, R01, and other grant formats
                </p>
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="bg-white rounded-2xl p-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-2">Analyzing Document</h2>
                <p className="text-slate-500">Parsing {uploadedFile?.name}...</p>
                <p className="text-sm text-slate-400 mt-2">This may take a moment for large documents</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {reviewResult && (
          <div className="space-y-6">
            {/* Header Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{reviewResult.projectTitle}</h2>
                  <p className="text-slate-500 mt-1">{reviewResult.grantType}</p>
                </div>
                <div className={`px-4 py-2 rounded-full font-semibold ${getFundabilityColor(reviewResult.fundabilityRating)}`}>
                  {reviewResult.fundabilityRating} Fundability
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Overall Score</span>
                    <span className="text-2xl font-bold text-slate-900">{reviewResult.overallScore}/100</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        reviewResult.overallScore >= 80 ? 'bg-green-500' :
                        reviewResult.overallScore >= 60 ? 'bg-blue-500' :
                        reviewResult.overallScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${reviewResult.overallScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Priorities */}
            {reviewResult.topPriorities.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Top Priorities to Address
                </h3>
                <ul className="space-y-2">
                  {reviewResult.topPriorities.map((priority, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-amber-800">
                      <span className="font-bold text-amber-600">{idx + 1}.</span>
                      {priority}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section Scores */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Section-by-Section Analysis</h3>
              </div>
              <div className="divide-y divide-slate-200">
                {reviewResult.sections.map((section) => (
                  <div key={section.name} className="border-l-4 border-transparent hover:bg-slate-50 transition-colors"
                    style={{ borderLeftColor: section.status === 'excellent' ? '#22c55e' : section.status === 'good' ? '#3b82f6' : section.status === 'needs_work' ? '#f59e0b' : '#ef4444' }}>
                    <button
                      onClick={() => toggleSection(section.name)}
                      className="w-full px-6 py-4 flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-3">
                        {getSectionIcon(section.name)}
                        <div>
                          <span className="font-medium text-slate-900">{section.name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(section.status)}
                            <span className="text-sm text-slate-500 capitalize">{section.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-900">{section.score}</span>
                          <span className="text-slate-400">/{section.maxScore}</span>
                        </div>
                        {expandedSections.has(section.name) ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>
                    
                    {expandedSections.has(section.name) && (
                      <div className="px-6 pb-4 space-y-4">
                        {section.findings.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-2">Findings</h4>
                            <ul className="space-y-1">
                              {section.findings.map((finding, idx) => (
                                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                                  <span className="text-slate-400">•</span>
                                  {finding}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {section.recommendations.length > 0 && (
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4" />
                              Recommendations
                            </h4>
                            <ul className="space-y-1">
                              {section.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                                  <span className="text-blue-400">→</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Key Strengths
                </h3>
                <ul className="space-y-2">
                  {reviewResult.strengthsOverall.map((strength, idx) => (
                    <li key={idx} className="text-green-800 flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {reviewResult.weaknessesOverall.map((weakness, idx) => (
                    <li key={idx} className="text-red-800 flex items-start gap-2">
                      <span className="text-red-500">!</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
