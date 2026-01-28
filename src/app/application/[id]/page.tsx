'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import SectionEditor from '@/components/SectionEditor';
import AttachmentChecklist from '@/components/AttachmentChecklist';
import ValidationPanel from '@/components/ValidationPanel';
import ReviewerSimulation from '@/components/ReviewerSimulation';
import StudySectionRecommender from '@/components/StudySectionRecommender';
import Collaborators from '@/components/Collaborators';
import BiosketchGenerator from '@/components/BiosketchGenerator';
import { MECHANISMS, getFormatting } from '@/lib/mechanisms';
import { ArrowLeft, FileText, Info, Users } from 'lucide-react';
import Link from 'next/link';
import { saveAs } from 'file-saver';

interface Section {
  id: number;
  type: string;
  title: string;
  content: string;
  page_limit: number;
  page_count: number;
  required_headings: string[] | null;
  is_valid: boolean;
  is_complete: boolean;
}

interface Attachment {
  id: number;
  name: string;
  required: boolean;
  status: string;
  file_url: string | null;
}

interface Application {
  id: number;
  title: string;
  mechanism: string;
  status: string;
}

function ApplicationContent() {
  const params = useParams();
  const router = useRouter();
  const { token, user, isLoading: authLoading } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [showReview, setShowReview] = useState(false);

  const fetchApplication = useCallback(async () => {
    if (!token || !params.id) return;
    try {
      const res = await fetch(`/api/applications/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setApplication(data.application);
      setSections(data.sections);
      setAttachments(data.attachments);
      if (data.sections.length > 0 && activeSection === null) {
        setActiveSection(data.sections[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch application:', error);
    } finally {
      setLoading(false);
    }
  }, [token, params.id, router, activeSection]);

  useEffect(() => {
    if (!authLoading && token) {
      fetchApplication();
    }
  }, [authLoading, token, fetchApplication]);

  const handleExportPDF = async () => {
    if (!application) return;
    
    const { generatePDF } = await import('@/lib/pdfExport');
    const mechanism = MECHANISMS[application.mechanism];
    const pdfBlob = await generatePDF(application, sections, mechanism?.name || application.mechanism);
    saveAs(pdfBlob, `${application.title.replace(/[^a-z0-9]/gi, '_')}_Application.pdf`);
  };

  const handleExportZip = async () => {
    if (!application) return;
    
    const { exportAsZip } = await import('@/lib/pdfExport');
    const mechanism = MECHANISMS[application.mechanism];
    await exportAsZip(application, sections, attachments, mechanism?.name || application.mechanism);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Application not found</div>
      </div>
    );
  }

  const mechanism = MECHANISMS[application.mechanism];
  const currentSection = sections.find(s => s.id === activeSection);
  const formatting = mechanism ? getFormatting(mechanism.agency) : getFormatting('NIH');
  const getSectionFormat = (sectionType: string) => {
    if (!mechanism) return 'narrative';
    const sectionConfig = mechanism.sections.find(s => s.type === sectionType);
    return sectionConfig?.format || 'narrative';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{application.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {mechanism?.name || application.mechanism}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  application.status === 'draft' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                }`}>
                  {application.status}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowReview(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
            >
              <Users className="w-5 h-5" />
              Run Review Simulation
            </button>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-indigo-800">
              <p className="font-medium">{mechanism?.agency || 'NIH'} Formatting Requirements</p>
              <p className="mt-1">
                Font: {formatting.font} {formatting.fontSize}pt | 
                Margins: {formatting.margins} | 
                Line Spacing: {formatting.lineSpacing}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-medium text-slate-900 text-sm">Sections</h3>
              </div>
              <div className="p-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-2 rounded-lg text-sm transition ${
                      activeSection === section.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{section.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        section.is_complete && section.is_valid
                          ? 'bg-green-100 text-green-700'
                          : section.is_complete
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                      }`}>
                        {section.page_count || 0}/{section.page_limit}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <ValidationPanel 
              applicationId={application.id} 
              onExportPDF={handleExportPDF}
              onExportZip={handleExportZip}
            />

            <StudySectionRecommender
              title={application.title}
              specificAims={sections.find(s => s.type === 'specific_aims')?.content || ''}
              researchStrategy={sections.find(s => s.type === 'research_strategy')?.content || ''}
            />

            <Collaborators
              applicationId={application.id}
              isOwner={true}
            />

            <BiosketchGenerator />
          </div>

          <div className="lg:col-span-2">
            {currentSection && (
              <SectionEditor
                key={currentSection.id}
                section={currentSection}
                onUpdate={fetchApplication}
                format={getSectionFormat(currentSection.type)}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <AttachmentChecklist
              attachments={attachments}
              onUpdate={fetchApplication}
              applicationTitle={application.title}
              specificAims={sections.find(s => s.type === 'specific_aims')?.content || ''}
              researchStrategy={sections.find(s => s.type === 'research_strategy')?.content || ''}
              mechanism={application.mechanism}
            />
          </div>
        </div>
      </main>

      <ReviewerSimulation
        applicationId={application.id}
        isOpen={showReview}
        onClose={() => setShowReview(false)}
      />
    </div>
  );
}

export default function ApplicationPage() {
  return (
    <AuthProvider>
      <ApplicationContent />
    </AuthProvider>
  );
}
