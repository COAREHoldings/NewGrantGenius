'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { User, Loader2, Copy, Check, X, Download, FileText, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import ExportMenu from './ExportMenu';

interface Props {
  projectTitle?: string;
  onClose: () => void;
  isOpen: boolean;
}

interface VerificationResult {
  requirement: string;
  passed: boolean;
  details: string;
  suggestion?: string;
}

interface VerificationResponse {
  results: VerificationResult[];
  overallScore: number;
  summary: string;
}

export default function BiosketchGenerator({ projectTitle, onClose, isOpen }: Props) {
  const { checkDemoFeature } = useAuth();
  const [activeTab, setActiveTab] = useState<'generate' | 'verify'>('generate');
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    institution: '',
    eraCommons: '',
    education: '',
    projectRole: 'Principal Investigator',
    researchFocus: '',
    personalStatement: '',
    publications: ''
  });
  const [biosketch, setBiosketch] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Verification state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResults, setVerificationResults] = useState<VerificationResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generate = async () => {
    if (!checkDemoFeature('AI Generation')) return;
    if (!formData.name || !formData.position) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/biosketch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        const data = await res.json();
        setBiosketch(data.biosketch);
      }
    } catch (error) {
      console.error('Failed to generate biosketch:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(biosketch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([biosketch], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Biosketch_${formData.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setVerificationResults(null);
    setExtractedText(''); // Clear any previous text
  };

  const verifyBiosketch = async () => {
    // Need either a file or pasted text
    if (!uploadedFile && (!extractedText || extractedText.length < 100)) return;

    setVerifying(true);
    try {
      let res: Response;

      if (uploadedFile) {
        // Send file via FormData for server-side parsing
        const formData = new FormData();
        formData.append('file', uploadedFile);
        if (extractedText) {
          formData.append('content', extractedText);
        }
        res = await fetch('/api/biosketch-verify', {
          method: 'POST',
          body: formData
        });
      } else {
        // Send text content as JSON
        res = await fetch('/api/biosketch-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: extractedText })
        });
      }

      if (res.ok) {
        const data = await res.json();
        setVerificationResults(data);
      } else {
        const error = await res.json();
        setVerificationResults({
          results: [{
            requirement: 'Error',
            passed: false,
            details: error.error || 'Verification failed',
            suggestion: 'Please try again or paste text manually'
          }],
          overallScore: 0,
          summary: error.error || 'Verification failed'
        });
      }
    } catch (error) {
      console.error('Failed to verify biosketch:', error);
    } finally {
      setVerifying(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-lg">NIH Biosketch Generator</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-slate-50 border-b px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex-1 sm:flex-none px-5 py-3 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'generate'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                Generate New
              </div>
            </button>
            <button
              onClick={() => setActiveTab('verify')}
              className={`flex-1 sm:flex-none px-5 py-3 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'verify'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Upload & Verify
              </div>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'generate' ? (
            // Generate Tab Content
            !biosketch ? (
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="Jane M. Smith, Ph.D."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">eRA Commons ID</label>
                    <input
                      type="text"
                      value={formData.eraCommons}
                      onChange={(e) => handleChange('eraCommons', e.target.value)}
                      placeholder="JSMITH123"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Current Position *</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => handleChange('position', e.target.value)}
                      placeholder="Associate Professor"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Institution</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => handleChange('institution', e.target.value)}
                      placeholder="University Medical Center"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role on This Project</label>
                  <select
                    value={formData.projectRole}
                    onChange={(e) => handleChange('projectRole', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Principal Investigator">Principal Investigator</option>
                    <option value="Co-Principal Investigator">Co-Principal Investigator</option>
                    <option value="Co-Investigator">Co-Investigator</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Key Personnel">Key Personnel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Education & Training</label>
                  <textarea
                    value={formData.education}
                    onChange={(e) => handleChange('education', e.target.value)}
                    placeholder="List degrees, institutions, years, and fields:&#10;Ph.D., Harvard University, 2015, Molecular Biology&#10;B.S., MIT, 2010, Biochemistry"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Research Focus Areas</label>
                  <input
                    type="text"
                    value={formData.researchFocus}
                    onChange={(e) => handleChange('researchFocus', e.target.value)}
                    placeholder="e.g., Cancer genomics, immunotherapy, biomarker discovery"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Personal Statement Notes</label>
                  <textarea
                    value={formData.personalStatement}
                    onChange={(e) => handleChange('personalStatement', e.target.value)}
                    placeholder="Key points to emphasize: your expertise, prior work relevant to this project, leadership experience, collaborations..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Key Publications (optional)</label>
                  <textarea
                    value={formData.publications}
                    onChange={(e) => handleChange('publications', e.target.value)}
                    placeholder="List your most relevant publications (up to 20):&#10;Smith JM, et al. Nature. 2023;600:123-130.&#10;Smith JM, Jones AB. Cell. 2022;185:456-470."
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  onClick={generate}
                  disabled={!formData.name || !formData.position || loading}
                  className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Biosketch...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Generate NIH Biosketch
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Generated Biosketch</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBiosketch('')}
                      className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50"
                    >
                      Edit Inputs
                    </button>
                    <button
                      onClick={handleCopy}
                      className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 flex items-center gap-1"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <ExportMenu
                      title={`NIH_Biosketch_${formData.name.replace(/\s+/g, '_')}`}
                      sections={[{ heading: 'NIH Biosketch', content: biosketch }]}
                      metadata={{
                        author: formData.name,
                        date: new Date().toLocaleDateString(),
                        type: 'NIH Biosketch',
                      }}
                      buttonClassName="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1"
                    />
                  </div>
                </div>
                
                <div className="bg-slate-50 border rounded-lg p-4 max-h-[50vh] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
                    {biosketch}
                  </pre>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
                  <strong>Next steps:</strong> Copy this text into Word, format according to NIH guidelines 
                  (Arial 11pt, 0.5&quot; margins), add your actual publications, and save as PDF.
                </div>
              </div>
            )
          ) : (
            // Verify Tab Content
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Upload Biosketch (PDF, DOCX, or TXT)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                >
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  {uploadedFile ? (
                    <p className="text-sm text-slate-700">{uploadedFile.name}</p>
                  ) : (
                    <p className="text-sm text-slate-500">Click to upload or drag and drop</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">PDF, DOCX, or TXT up to 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Extracted Text / Manual Input */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Biosketch Content {uploadedFile ? '(optional - file will be parsed server-side)' : ''}
                </label>
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  placeholder={uploadedFile ? "Optional: Add additional text or corrections here..." : "Paste your biosketch text here for verification, or upload a file above..."}
                  rows={8}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Verify Button */}
              <button
                onClick={verifyBiosketch}
                disabled={(!uploadedFile && (!extractedText || extractedText.length < 100)) || verifying}
                className="w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying Compliance...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Verify NIH Compliance
                  </>
                )}
              </button>

              {/* Verification Results */}
              {verificationResults && (
                <div className="space-y-4 mt-4">
                  {/* Score Summary */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm text-slate-500">Overall Compliance Score</p>
                      <p className={`text-3xl font-bold ${getScoreColor(verificationResults.overallScore)}`}>
                        {verificationResults.overallScore}/100
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">{verificationResults.summary}</p>
                    </div>
                  </div>

                  {/* Individual Results */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-slate-700">Requirement Checklist</h4>
                    {verificationResults.results.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {result.passed ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${result.passed ? 'text-green-800' : 'text-red-800'}`}>
                              {result.requirement}
                            </p>
                            <p className={`text-sm mt-0.5 ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                              {result.details}
                            </p>
                            {result.suggestion && (
                              <div className="mt-2 p-2 bg-white/60 rounded text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <span className="text-slate-700">{result.suggestion}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
