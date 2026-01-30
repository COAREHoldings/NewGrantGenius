'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Upload, CheckCircle2, ArrowLeft, ArrowRight,
  FileCheck, Package, Sparkles, Users, AlertCircle,
  ExternalLink, Plus, Trash2, User
} from 'lucide-react';

type Step = 'choose' | 'team' | 'documents' | 'review';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  orcid?: string;
  institution?: string;
  hasBiosketch: boolean;
}

export default function SubmissionPage() {
  const [step, setStep] = useState<Step>('choose');
  const [startingPoint, setStartingPoint] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMember, setNewMember] = useState({ name: '', role: 'Co-Investigator', email: '', orcid: '', institution: '' });

  const addTeamMember = () => {
    if (!newMember.name.trim()) return;
    setTeamMembers([...teamMembers, {
      id: Date.now().toString(),
      ...newMember,
      hasBiosketch: false
    }]);
    setNewMember({ name: '', role: 'Co-Investigator', email: '', orcid: '', institution: '' });
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const handleStartingPointSelect = (point: string) => {
    setStartingPoint(point);
    if (point === 'scratch') {
      // Go to team first, then will generate documents
      setStep('team');
    } else {
      // Has documents - go to team, then upload
      setStep('team');
    }
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
            {['Choose Path', 'Team Members', 'Documents', 'Review'].map((label, idx) => {
              const steps: Step[] = ['choose', 'team', 'documents', 'review'];
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
              <button
                onClick={() => handleStartingPointSelect('scratch')}
                className="w-full p-4 rounded-lg border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-left transition-all"
              >
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

              <button
                onClick={() => handleStartingPointSelect('partial')}
                className="w-full p-4 rounded-lg border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-left transition-all"
              >
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

              <button
                onClick={() => handleStartingPointSelect('complete')}
                className="w-full p-4 rounded-lg border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-left transition-all"
              >
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
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start gap-3 mb-6">
                <Users className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Grant Team Members</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    Add everyone involved in executing this grant: PI, Co-Investigators, Key Personnel, Consultants, etc.
                    Each person will need a Biosketch for the submission.
                  </p>
                </div>
              </div>

              {/* Add New Member Form */}
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-slate-900 mb-3">Add Team Member</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Principal Investigator">Principal Investigator (PI)</option>
                    <option value="Co-Investigator">Co-Investigator</option>
                    <option value="Key Personnel">Key Personnel</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Collaborator">Collaborator</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="email"
                    placeholder="Email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Institution/Organization"
                    value={newMember.institution}
                    onChange={(e) => setNewMember({...newMember, institution: e.target.value})}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="md:col-span-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="ORCID iD (e.g., 0000-0002-1234-5678)"
                        value={newMember.orcid}
                        onChange={(e) => setNewMember({...newMember, orcid: e.target.value})}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <a 
                        href="https://orcid.org/register" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-3 py-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 whitespace-nowrap"
                      >
                        Get ORCID <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      ORCID is a unique researcher identifier. Get one free at orcid.org if you don't have one.
                    </p>
                  </div>
                </div>
                <button
                  onClick={addTeamMember}
                  disabled={!newMember.name.trim()}
                  className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
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
                        {member.orcid && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">ORCID</span>
                        )}
                        <button
                          onClick={() => removeTeamMember(member.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
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

            {/* ORCID Help Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">What is ORCID?</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    ORCID (Open Researcher and Contributor ID) is a unique identifier that distinguishes you from other researchers.
                    NIH encourages including ORCID iDs in grant applications. To get one:
                  </p>
                  <ol className="text-sm text-blue-800 mt-2 list-decimal list-inside space-y-1">
                    <li>Visit <a href="https://orcid.org/register" target="_blank" rel="noopener noreferrer" className="underline">orcid.org/register</a></li>
                    <li>Create a free account with your email</li>
                    <li>Your ORCID iD will look like: 0000-0002-1234-5678</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep('choose')}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep('documents')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                Continue to Documents <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Documents */}
        {step === 'documents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-start gap-3 mb-6">
                <FileText className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Grant Documents</h2>
                  <p className="text-slate-600 text-sm mt-1">
                    {startingPoint === 'scratch' 
                      ? "We'll help you create each required document. Start with the sections you're ready to write."
                      : "Upload your existing documents. We'll check them against NIH formatting requirements."
                    }
                  </p>
                </div>
              </div>

              {/* Biosketches Section */}
              <div className="mb-6">
                <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Biographical Sketches (Biosketches)
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  Each team member needs an NIH-format Biosketch. Upload existing ones or create new.
                </p>
                
                <div className="space-y-2">
                  {teamMembers.length > 0 ? teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm cursor-pointer hover:bg-indigo-200">
                          <input type="file" accept=".pdf,.doc,.docx" className="hidden" />
                          Upload Biosketch
                        </label>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 italic">Add team members first to upload their biosketches.</p>
                  )}
                </div>

                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Biosketch Format:</strong> NIH requires a specific format (5 pages max). 
                    We'll check your uploaded biosketches and flag any formatting issues.
                    <a href="https://grants.nih.gov/grants/forms/biosketch.htm" target="_blank" rel="noopener noreferrer" className="underline ml-1">
                      View NIH Biosketch guidelines
                    </a>
                  </p>
                </div>
              </div>

              {/* Other Documents */}
              <div>
                <h3 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Grant Sections
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
                        <p className="font-medium text-slate-900">
                          {doc.name}
                          {doc.required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        <p className="text-sm text-slate-500">{doc.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {startingPoint !== 'scratch' && (
                          <label className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm cursor-pointer hover:bg-slate-200">
                            <input type="file" accept=".pdf,.doc,.docx" className="hidden" />
                            Upload
                          </label>
                        )}
                        {startingPoint === 'scratch' && (
                          <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                            Create
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-500 mt-3">
                  * Required sections. Maximum file size: 50MB. Supported formats: PDF, DOC, DOCX
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep('team')}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep('review')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                Review Submission <ArrowRight className="w-4 h-4" />
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
                  <p className="text-slate-600 text-sm mt-1">
                    Review all components before finalizing. We'll validate everything against NIH requirements.
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-900 mb-2">Team Members: {teamMembers.length}</h3>
                  {teamMembers.map(m => (
                    <p key={m.id} className="text-sm text-slate-600">{m.name} - {m.role}</p>
                  ))}
                </div>

                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-900 mb-2">Documents</h3>
                  <p className="text-sm text-slate-500">Document validation will appear here</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep('documents')}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Finalize Submission
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
