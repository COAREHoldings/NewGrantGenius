'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, FileText, Download, Sparkles, Copy, Check } from 'lucide-react';

type LetterType = 'support' | 'consultant' | 'vendor' | 'collaboration';

interface LetterData {
  type: LetterType;
  recipientName: string;
  recipientTitle: string;
  recipientOrganization: string;
  projectTitle: string;
  piName: string;
  piInstitution: string;
  specificContribution: string;
  additionalDetails: string;
}

export default function LettersPage() {
  const [letterType, setLetterType] = useState<LetterType>('support');
  const [letterData, setLetterData] = useState<LetterData>({
    type: 'support',
    recipientName: '',
    recipientTitle: '',
    recipientOrganization: '',
    projectTitle: '',
    piName: '',
    piInstitution: '',
    specificContribution: '',
    additionalDetails: ''
  });
  const [generating, setGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const letterTypes = [
    { id: 'support', name: 'Letter of Support', description: 'From collaborators, advisors, or stakeholders' },
    { id: 'consultant', name: 'Consultant Agreement', description: 'Formal consulting arrangement letter' },
    { id: 'vendor', name: 'Vendor Quote Letter', description: 'Equipment or service quotation' },
    { id: 'collaboration', name: 'Collaboration Letter', description: 'Inter-institutional collaboration agreement' }
  ];

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...letterData, type: letterType })
      });
      if (res.ok) {
        const result = await res.json();
        setGeneratedLetter(result.letter);
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedLetter) {
      navigator.clipboard.writeText(generatedLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (generatedLetter) {
      const blob = new Blob([generatedLetter], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${letterType}_letter.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Letter Generator</h1>
          <p className="text-slate-600 mt-1">Generate professional letters for your grant application</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-6">
            {/* Letter Type Selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Letter Type</h2>
              <div className="grid grid-cols-2 gap-3">
                {letterTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => { setLetterType(type.id as LetterType); setLetterData(prev => ({ ...prev, type: type.id as LetterType })); }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      letterType === type.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-medium text-slate-900 text-sm">{type.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Letter Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Letter Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Signatory Name</label>
                    <input
                      type="text"
                      value={letterData.recipientName}
                      onChange={(e) => setLetterData(prev => ({ ...prev, recipientName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Dr. Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={letterData.recipientTitle}
                      onChange={(e) => setLetterData(prev => ({ ...prev, recipientTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Professor of Biology"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                  <input
                    type="text"
                    value={letterData.recipientOrganization}
                    onChange={(e) => setLetterData(prev => ({ ...prev, recipientOrganization: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="Harvard Medical School"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Project Title</label>
                  <input
                    type="text"
                    value={letterData.projectTitle}
                    onChange={(e) => setLetterData(prev => ({ ...prev, projectTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="Novel Therapeutic Approach for..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">PI Name</label>
                    <input
                      type="text"
                      value={letterData.piName}
                      onChange={(e) => setLetterData(prev => ({ ...prev, piName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Dr. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">PI Institution</label>
                    <input
                      type="text"
                      value={letterData.piInstitution}
                      onChange={(e) => setLetterData(prev => ({ ...prev, piInstitution: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="BioTech Inc."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specific Contribution/Role</label>
                  <textarea
                    value={letterData.specificContribution}
                    onChange={(e) => setLetterData(prev => ({ ...prev, specificContribution: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    rows={3}
                    placeholder="Describe the specific expertise, resources, or commitment..."
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating || !letterData.recipientName || !letterData.projectTitle}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  {generating ? 'Generating...' : 'Generate Letter'}
                </button>
              </div>
            </div>
          </div>

          {/* Generated Letter Preview */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Generated Letter</h2>
              {generatedLetter && (
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={handleDownload} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {generatedLetter ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-slate-50 p-4 rounded-lg">
                  {generatedLetter}
                </pre>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Fill in the details and click Generate to create your letter</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
