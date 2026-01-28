'use client';

import { useState } from 'react';
import { User, Loader2, Copy, Check, X, Download, FileText } from 'lucide-react';

interface Props {
  projectTitle?: string;
  onClose: () => void;
  isOpen: boolean;
}

export default function BiosketchGenerator({ projectTitle, onClose, isOpen }: Props) {
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generate = async () => {
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

        <div className="flex-1 overflow-y-auto p-4">
          {!biosketch ? (
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
                  <button
                    onClick={handleDownload}
                    className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
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
          )}
        </div>
      </div>
    </div>
  );
}
