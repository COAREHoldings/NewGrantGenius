'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, Upload, CheckCircle2, ArrowLeft, ArrowRight,
  FileCheck, Package, Sparkles, Users, AlertCircle,
  ExternalLink, Plus, Trash2, User, Wand2, FileSearch, X, Copy, Check, AlertTriangle, XCircle
} from 'lucide-react';

type Step = 'choose' | 'team' | 'documents' | 'create' | 'review';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  orcid?: string;
  institution?: string;
  expertise?: string;
  hasBiosketch: boolean;
  biosketchFile?: string;
  personalStatement?: string;
  biosketchValidation?: {
    status: 'valid' | 'needs_fixes' | 'needs_review';
    issues: string[];
    warnings: string[];
    passed: string[];
  };
}

export default function SubmissionPage() {
  const [step, setStep] = useState<Step>('choose');
  const [startingPoint, setStartingPoint] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState({ name: '', role: 'Co-Investigator', email: '', orcid: '', institution: '', expertise: '' });
  const [projectTitle, setProjectTitle] = useState('');
  const [showStatementModal, setShowStatementModal] = useState<string | null>(null);
  const [generatedStatement, setGeneratedStatement] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState<string | null>(null);

  const validateBiosketch = async (memberId: string, file: File) => {
    setValidating(memberId);
    const member = teamMembers.find(m => m.id === memberId);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('memberName', member?.name || '');
      
      const res = await fetch('/api/biosketch/validate', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(teamMembers.map(m => 
          m.id === memberId 
            ? { 
                ...m, 
                hasBiosketch: true, 
                biosketchFile: file.name,
                biosketchValidation: {
                  status: data.status,
                  issues: data.issues || [],
                  warnings: data.warnings || [],
                  passed: data.passed || []
                }
              } 
            : m
        ));
        setShowValidationModal(memberId);
      }
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setValidating(null);
    }
  };

  const addTeamMember = () => {
    if (!newMember.name.trim()) return;
    setTeamMembers([...teamMembers, {
      id: Date.now().toString(),
      ...newMember,
      hasBiosketch: false
    }]);
    setNewMember({ name: '', role: 'Co-Investigator', email: '', orcid: '', institution: '', expertise: '' });
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const handleStartingPointSelect = (point: string) => {
    setStartingPoint(point);
    // "Starting from scratch" goes directly to the 8-module Grant Builder
    if (point === 'scratch') {
      window.location.href = '/grant-builder';
      return;
    }
    setStep('team');
  };

  const generatePersonalStatement = async (member: TeamMember) => {
    setShowStatementModal(member.id);
    setGenerating(true);
    setGeneratedStatement('');
    
    try {
      const res = await fetch('/api/biosketch/generate-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: member.name,
          role: member.role,
          institution: member.institution,
          expertise: member.expertise,
          projectTitle: projectTitle
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setGeneratedStatement(data.statement);
      }
    } catch (error) {
      console.error('Error generating statement:', error);
      setGeneratedStatement('Failed to generate statement. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyStatement = () => {
    navigator.clipboard.writeText(generatedStatement);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveStatement = (memberId: string) => {
    setTeamMembers(teamMembers.map(m => 
      m.id === memberId ? { ...m, personalStatement: generatedStatement } : m
    ));
    setShowStatementModal(null);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Ready To Grant</h1>
          <p className="text-slate-600 mt-1">
            Let's build your NIH SBIR/STTR grant application step by step.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {(startingPoint === 'scratch' 
              ? ['Choose Path', 'Team Members', 'Create Sections', 'Review']
              : ['Choose Path', 'Team Members', 'Documents', 'Review']
            ).map((label, idx) => {
              const steps: Step[] = startingPoint === 'scratch' 
                ? ['choose', 'team', 'create', 'review']
                : ['choose', 'team', 'documents', 'review'];
              const isActive = steps.indexOf(step) >= idx;
              const isCurrent = steps[idx] === step;
              return (
                <div key={label} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCurrent ? 'bg-indigo-600 text-white' : 
                    isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className={`ml-2 text-sm ${isCurrent ? 'font-medium text-indigo-600' : 'text-slate-500'}`}>
                    {label}
                  </span>
                  {idx < 3 && <div className={`w-12 h-0.5 mx-2 ${isActive ? 'bg-indigo-200' : 'bg-slate-200'}`} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Choose Starting Point */}
        {step === 'choose' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">What are you starting with?</h2>
            <p className="text-slate-600 mb-6">This helps us guide you through the right process.</p>
            
            <div className="space-y-3">
              <button onClick={() => handleStartingPointSelect('scratch')} className="w-full p-4 rounded-lg border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-left transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Starting from Scratch</p>
                    <p className="text-sm text-slate-600 mt-1">I need help creating all grant documents. Guide me through the process.</p>
                  </div>
                </div>
              </button>

              <button onClick={() => handleStartingPointSelect('partial')} className="w-full p-4 rounded-lg border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-left transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Have Some Documents</p>
                    <p className="text-sm text-slate-600 mt-1">I have some sections written. Help me complete and organize them.</p>
                  </div>
                </div>
              </button>

              <button onClick={() => handleStartingPointSelect('complete')} className="w-full p-4 rounded-lg border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-left transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Documents Ready for Review</p>
                    <p className="text-sm text-slate-600 mt-1">I have all documents. Check formatting and NIH compliance.</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Team Members */}
        {step === 'team' && (
          <div className="space-y-6">
            {/* Project Title */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Project Information</h2>
              <input
                type="text"
                placeholder="Project Title (used for generating personal statements)"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start gap-3 mb-6">
                <Users className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Grant Team Members</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Add everyone involved in executing this grant. Each person will need a Biosketch.
                  </p>
                </div>
              </div>

              {/* Add New Member Form */}
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-slate-900 mb-3">Add Team Member</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" placeholder="Full Name *" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <select value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Principal Investigator">Principal Investigator (PI)</option>
                    <option value="Co-Investigator">Co-Investigator</option>
                    <option value="Key Personnel">Key Personnel</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Collaborator">Collaborator</option>
                    <option value="Other">Other</option>
                  </select>
                  <input type="email" placeholder="Email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="text" placeholder="Institution/Organization" value={newMember.institution} onChange={(e) => setNewMember({...newMember, institution: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="text" placeholder="Area of Expertise (e.g., molecular biology, data science)" value={newMember.expertise} onChange={(e) => setNewMember({...newMember, expertise: e.target.value})} className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 md:col-span-2" />
                  <div className="md:col-span-2">
                    <div className="flex gap-2">
                      <input type="text" placeholder="ORCID iD (e.g., 0000-0002-1234-5678)" value={newMember.orcid} onChange={(e) => setNewMember({...newMember, orcid: e.target.value})} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <a href="https://orcid.org/register" target="_blank" rel="noopener noreferrer" className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 whitespace-nowrap">
                        Get ORCID <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
                <button onClick={addTeamMember} disabled={!newMember.name.trim()} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add to Team
                </button>
              </div>

              {/* Team List */}
              {teamMembers.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-900 mb-2">Team ({teamMembers.length})</h3>
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.role} {member.institution && `at ${member.institution}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.orcid && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">ORCID</span>}
                        {member.personalStatement && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Statement</span>}
                        <button onClick={() => removeTeamMember(member.id)} className="p-1 text-slate-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p>No team members added yet</p>
                </div>
              )}
            </div>

            {/* ORCID Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">What is ORCID?</h3>
                  <p className="text-sm text-blue-800 mt-1">ORCID is a unique researcher identifier. NIH encourages including it. Get one free at <a href="https://orcid.org/register" target="_blank" rel="noopener noreferrer" className="underline">orcid.org</a></p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep('choose')} className="px-4 py-2 text-slate-600 hover:text-slate-900 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep(startingPoint === 'scratch' ? 'create' : 'documents')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                {startingPoint === 'scratch' ? 'Start Creating' : 'Continue to Documents'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 'documents' && (
          <div className="space-y-6">
            {/* Full Grant Upload */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Upload Complete Grant</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Have your entire grant in one document? Upload it here and we'll parse and validate all sections automatically.
                  </p>
                </div>
              </div>

              <label className="block">
                <div className="border-2 border-dashed border-indigo-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
                  <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">Drop your complete grant document here</p>
                  <p className="text-sm text-slate-500 mt-1">PDF, DOC, or DOCX up to 100MB</p>
                  <p className="text-xs text-indigo-600 mt-3">We'll extract Specific Aims, Research Strategy, Budget, and more</p>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // TODO: Process full grant upload
                      alert(`Uploaded: ${file.name}\nThis will parse and validate all sections automatically.`);
                    }
                  }} />
                </div>
              </label>

              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>AI-powered extraction identifies all standard NIH grant sections</span>
              </div>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-sm text-slate-400">or upload individual sections</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Biosketches */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start gap-3 mb-4">
                <User className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Biographical Sketches</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Each team member needs an NIH-format Biosketch (5 pages max). We can help format and generate personal statements.
                  </p>
                </div>
              </div>

              {teamMembers.length > 0 ? (
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-slate-900">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.role}</p>
                        </div>
                        <div className="flex gap-2">
                          {member.hasBiosketch && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uploaded</span>}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <label className={`px-3 py-1.5 rounded-lg text-sm cursor-pointer flex items-center gap-1 ${validating === member.id ? 'bg-slate-200 cursor-wait' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                          {validating === member.id ? (
                            <><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> Validating...</>
                          ) : (
                            <><Upload className="w-4 h-4" /> Upload & Validate Biosketch</>
                          )}
                          <input type="file" accept=".pdf,.doc,.docx" className="hidden" disabled={validating === member.id} onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) validateBiosketch(member.id, file);
                          }} />
                        </label>
                        
                        {member.biosketchValidation && (
                          <button onClick={() => setShowValidationModal(member.id)} className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${
                            member.biosketchValidation.status === 'valid' ? 'bg-green-100 text-green-700' :
                            member.biosketchValidation.status === 'needs_fixes' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {member.biosketchValidation.status === 'valid' ? <CheckCircle2 className="w-4 h-4" /> :
                             member.biosketchValidation.status === 'needs_fixes' ? <XCircle className="w-4 h-4" /> :
                             <AlertTriangle className="w-4 h-4" />}
                            View Results
                          </button>
                        )}
                        
                        <button onClick={() => generatePersonalStatement(member)} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 flex items-center gap-1">
                          <Wand2 className="w-4 h-4" /> Generate Personal Statement
                        </button>
                        
                        <a href="https://www.ncbi.nlm.nih.gov/sciencv/" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 flex items-center gap-1">
                          <FileSearch className="w-4 h-4" /> Use SciENcv <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      
                      {member.personalStatement && (
                        <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                          <p className="text-xs text-purple-700 font-medium mb-1">Generated Personal Statement:</p>
                          <p className="text-sm text-slate-700">{member.personalStatement.substring(0, 200)}...</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic py-4">Add team members in the previous step first.</p>
              )}

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>NIH Biosketch Format:</strong> 5 pages max, 11pt font (Arial/Helvetica/Georgia), 0.5" margins.
                  <a href="https://grants.nih.gov/grants/forms/biosketch.htm" target="_blank" rel="noopener noreferrer" className="underline ml-1">View guidelines</a> |
                  <a href="https://www.ncbi.nlm.nih.gov/sciencv/" target="_blank" rel="noopener noreferrer" className="underline ml-1">Use SciENcv (free NIH tool)</a>
                </p>
              </div>
            </div>

            {/* Grant Sections */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-medium text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Grant Sections
              </h3>
              
              <div className="space-y-2">
                {[
                  { name: 'Specific Aims', desc: '1 page - Your research objectives', required: true },
                  { name: 'Research Strategy', desc: 'Up to 12 pages - Significance, Innovation, Approach', required: true },
                  { name: 'Budget & Justification', desc: 'Detailed costs and explanations', required: true },
                  { name: 'Facilities & Equipment', desc: 'Available resources', required: true },
                  { name: 'Letters of Support', desc: 'From collaborators, consultants', required: false },
                  { name: 'Commercialization Plan', desc: 'SBIR/STTR specific - market analysis', required: true },
                ].map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{doc.name}{doc.required && <span className="text-red-500 ml-1">*</span>}</p>
                      <p className="text-sm text-slate-500">{doc.desc}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {startingPoint !== 'scratch' ? (
                        <label className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm cursor-pointer hover:bg-slate-200"><input type="file" accept=".pdf,.doc,.docx" className="hidden" />Upload</label>
                      ) : (
                        <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Create</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-3">* Required. Max 50MB per file.</p>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep('team')} className="px-4 py-2 text-slate-600 hover:text-slate-900 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
              <button onClick={() => setStep('review')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">Review Submission <ArrowRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Step: Create Sections (for "Starting from Scratch") */}
        {step === 'create' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Create Your Grant Sections</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    We'll guide you through creating each required section. Start with the most important ones.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Grant Builder - Primary CTA */}
                <div className="p-4 border-2 border-indigo-300 bg-indigo-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-indigo-900">Grant Builder (Recommended)</p>
                      <p className="text-sm text-indigo-700 mt-1">Guided 8-module workflow: Title, Hypothesis, Aims, Team, Approach, Budget, Data, Figures</p>
                    </div>
                    <Link href="/grant-builder" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium">
                      <Sparkles className="w-4 h-4" /> Start Builder
                    </Link>
                  </div>
                </div>

                <p className="text-sm text-slate-500 text-center py-2">Or create individual sections:</p>

                {[
                  { name: 'Specific Aims', desc: '1 page - Define your research objectives and hypotheses', required: true, link: '/grant-builder?module=aims' },
                  { name: 'Research Strategy', desc: 'Up to 12 pages - Significance, Innovation, Approach', required: true, link: '/grant-builder?module=approach' },
                  { name: 'Budget & Justification', desc: 'Detailed costs and explanations', required: true, link: '/budget' },
                  { name: 'Facilities & Equipment', desc: 'Describe available resources', required: true, link: '/manuscript/new?section=facilities' },
                  { name: 'Commercialization Plan', desc: 'SBIR/STTR market analysis and commercialization strategy', required: true, link: '/manuscript/new?section=commercialization' },
                ].map((section) => (
                  <div key={section.name} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors">
                    <div>
                      <p className="font-medium text-slate-900">
                        {section.name}
                        {section.required && <span className="text-red-500 ml-1">*</span>}
                      </p>
                      <p className="text-sm text-slate-500">{section.desc}</p>
                    </div>
                    <Link href={section.link} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Create
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Start with Specific Aims - it's the foundation of your grant. Once approved, it guides all other sections.
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep('team')} className="px-4 py-2 text-slate-600 hover:text-slate-900 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => setStep('review')} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                Continue to Review <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start gap-3 mb-6">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Review Your Submission</h2>
                  <p className="text-slate-600 text-sm mt-1">Review all components before finalizing.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-900 mb-2">Team Members: {teamMembers.length}</h3>
                  {teamMembers.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-sm py-1">
                      <span>{m.name} - {m.role}</span>
                      <div className="flex gap-1">
                        {m.hasBiosketch && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Biosketch</span>}
                        {m.personalStatement && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Statement</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(startingPoint === 'scratch' ? 'create' : 'documents')} className="px-4 py-2 text-slate-600 hover:text-slate-900 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
              <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Finalize Submission</button>
            </div>
          </div>
        )}

        {/* Personal Statement Modal */}
        {showStatementModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Personal Statement Generator</h3>
                  <button onClick={() => setShowStatementModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                
                {generating ? (
                  <div className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Generating personal statement...</p>
                  </div>
                ) : generatedStatement ? (
                  <div>
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <p className="text-slate-700 whitespace-pre-wrap">{generatedStatement}</p>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">This is a draft. Edit to match your specific qualifications and project details.</p>
                    <div className="flex gap-2">
                      <button onClick={copyStatement} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-2">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied!' : 'Copy'}
                      </button>
                      <button onClick={() => saveStatement(showStatementModal)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save to Profile</button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Biosketch Validation Modal */}
        {showValidationModal && (() => {
          const member = teamMembers.find(m => m.id === showValidationModal);
          const validation = member?.biosketchValidation;
          if (!validation) return null;
          
          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Biosketch Validation Results</h3>
                    <button onClick={() => setShowValidationModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                  </div>
                  
                  <div className={`p-4 rounded-lg mb-4 ${
                    validation.status === 'valid' ? 'bg-green-50 border border-green-200' :
                    validation.status === 'needs_fixes' ? 'bg-red-50 border border-red-200' :
                    'bg-amber-50 border border-amber-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {validation.status === 'valid' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                       validation.status === 'needs_fixes' ? <XCircle className="w-5 h-5 text-red-600" /> :
                       <AlertTriangle className="w-5 h-5 text-amber-600" />}
                      <span className={`font-medium ${
                        validation.status === 'valid' ? 'text-green-800' :
                        validation.status === 'needs_fixes' ? 'text-red-800' :
                        'text-amber-800'
                      }`}>
                        {validation.status === 'valid' ? 'Biosketch looks good!' :
                         validation.status === 'needs_fixes' ? 'Issues found - fixes required' :
                         'Review recommended'}
                      </span>
                    </div>
                  </div>

                  {validation.issues.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-red-700 mb-2 flex items-center gap-1"><XCircle className="w-4 h-4" /> Issues to Fix</h4>
                      <ul className="space-y-1">
                        {validation.issues.map((issue, i) => (
                          <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-red-500 rounded-full flex-shrink-0"></span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validation.warnings.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-amber-700 mb-2 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Warnings</h4>
                      <ul className="space-y-1">
                        {validation.warnings.map((warning, i) => (
                          <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-amber-500 rounded-full flex-shrink-0"></span>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {validation.passed.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Passed Checks</h4>
                      <ul className="space-y-1">
                        {validation.passed.map((pass, i) => (
                          <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                            <span className="mt-1.5 w-1 h-1 bg-green-500 rounded-full flex-shrink-0"></span>
                            {pass}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600">
                      <strong>Need help formatting?</strong> Use <a href="https://www.ncbi.nlm.nih.gov/sciencv/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">SciENcv</a> (free NIH tool) to create properly formatted biosketches.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button onClick={() => setShowValidationModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">Close</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </main>
  );
}
