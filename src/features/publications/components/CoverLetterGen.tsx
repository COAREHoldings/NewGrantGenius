'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Copy, Check, Mail } from 'lucide-react';
import ExportMenu from '@/components/ExportMenu';

interface Props {
  onGenerate: (manuscript: { title: string; abstract: string; highlights?: string[] }, journal: string) => Promise<{ coverLetter: string; wordCount: number }>;
  loading: boolean;
}

export default function CoverLetterGen({ onGenerate, loading }: Props) {
  const { checkDemoFeature } = useAuth();
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [journal, setJournal] = useState('');
  const [highlights, setHighlights] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!checkDemoFeature('AI Generation')) return;
    if (!title.trim() || !abstract.trim() || !journal.trim()) return;
    try {
      const result = await onGenerate(
        { title, abstract, highlights: highlights.split('\n').filter(h => h.trim()) },
        journal
      );
      setCoverLetter(result.coverLetter);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover-letter.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Cover Letter Generator</h3>
        <p className="text-sm text-slate-600">
          Generate a professional cover letter for your journal submission.
        </p>
      </div>

      {!coverLetter ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Journal</label>
            <input
              type="text"
              value={journal}
              onChange={e => setJournal(e.target.value)}
              placeholder="e.g., Nature Medicine"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Manuscript Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Your manuscript title"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Abstract</label>
            <textarea
              value={abstract}
              onChange={e => setAbstract(e.target.value)}
              placeholder="Paste your abstract..."
              rows={4}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Key Highlights (optional, one per line)</label>
            <textarea
              value={highlights}
              onChange={e => setHighlights(e.target.value)}
              placeholder="First study to demonstrate...&#10;Novel approach using...&#10;Clinical implications for..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !title.trim() || !abstract.trim() || !journal.trim()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {loading ? 'Generating...' : 'Generate Cover Letter'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-900">Generated Cover Letter</h4>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleCopy}
                className="p-2 text-slate-500 hover:text-indigo-600 transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
              <ExportMenu
                title={`Cover_Letter_${journal.replace(/\s+/g, '_')}`}
                sections={[{ heading: 'Cover Letter', content: coverLetter }]}
                metadata={{
                  date: new Date().toLocaleDateString(),
                  type: 'Journal Submission Cover Letter',
                }}
                buttonClassName="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center gap-1"
              />
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{coverLetter}</pre>
          </div>

          <button
            onClick={() => setCoverLetter('')}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Generate New Letter
          </button>
        </div>
      )}
    </div>
  );
}
