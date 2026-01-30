'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, Upload, CheckCircle2, XCircle, Clock, 
  AlertTriangle, History, BookOpen, ArrowLeft,
  FileCheck, Package, Eye, RefreshCw, Sparkles
} from 'lucide-react';
import SubmissionAssembly from '@/components/SubmissionAssembly';
import ReferenceVerifier from '@/components/ReferenceVerifier';
import StatisticalModeling from '@/components/StatisticalModeling';

type UserType = 'scratch' | 'partial' | 'complete' | 'review';

const userTypeConfig = {
  scratch: {
    title: 'Starting Fresh',
    description: 'Begin building your grant application from the ground up',
    icon: FileText,
    color: 'blue'
  },
  partial: {
    title: 'Work in Progress',
    description: 'Upload and organize your existing documents',
    icon: Package,
    color: 'amber'
  },
  complete: {
    title: 'Ready for Review',
    description: 'Validate and finalize your complete application',
    icon: FileCheck,
    color: 'green'
  },
  review: {
    title: 'Final Check',
    description: 'Review your verified submission before submitting',
    icon: Eye,
    color: 'purple'
  }
};

export default function SubmissionPage() {
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'assembly' | 'references' | 'statistics' | 'versions'>('assembly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
        
        // Auto-detect user type based on their applications
        if (data.length === 0) {
          setSelectedType('scratch');
        } else {
          const hasComplete = data.some((app: any) => app.status === 'complete');
          const hasPartial = data.some((app: any) => app.status === 'draft');
          if (hasComplete) {
            setSelectedType('review');
          } else if (hasPartial) {
            setSelectedType('partial');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Submission Assembly</h1>
          <p className="text-slate-600 mt-1">
            Assemble, validate, and prepare your grant application for submission
          </p>
        </div>

        {/* User Type Selection */}
        {!selectedApp && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Where are you in the process?</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(Object.keys(userTypeConfig) as UserType[]).map((type) => {
                const config = userTypeConfig[type];
                const Icon = config.icon;
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected 
                        ? `border-${config.color}-500 bg-${config.color}-50` 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                      isSelected ? `bg-${config.color}-100` : 'bg-slate-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? `text-${config.color}-600` : 'text-slate-600'}`} />
                    </div>
                    <p className="font-semibold text-slate-900">{config.title}</p>
                    <p className="text-sm text-slate-500 mt-1">{config.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Application Selection or Creation */}
        {selectedType && !selectedApp && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {applications.length > 0 ? 'Select an Application' : 'Get Started'}
            </h3>
            
            {applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="w-full p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-left transition-all flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{app.title}</p>
                      <p className="text-sm text-slate-500">{app.mechanism} • Last updated: {new Date(app.updatedAt || app.updated_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === 'complete' ? 'bg-green-100 text-green-700' :
                      app.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {app.status}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No applications yet. Create one to get started.</p>
                <Link 
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Create Application
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Main Assembly Interface */}
        {selectedApp && (
          <div>
            {/* App Header */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{selectedApp.title}</h3>
                <p className="text-sm text-slate-500">{selectedApp.mechanism}</p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                Change Application
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
              {[
                { id: 'assembly', label: 'Assembly & Checklist', icon: Package },
                { id: 'references', label: 'Reference Verification', icon: BookOpen },
                { id: 'statistics', label: 'Statistical Modeling', icon: Sparkles },
                { id: 'versions', label: 'Version History', icon: History },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'assembly' && (
              <SubmissionAssembly applicationId={selectedApp.id} userType={selectedType!} />
            )}
            {activeTab === 'references' && (
              <ReferenceVerifier applicationId={selectedApp.id} />
            )}
            {activeTab === 'statistics' && (
              <StatisticalModeling applicationId={selectedApp.id} />
            )}
            {activeTab === 'versions' && (
              <VersionHistory applicationId={selectedApp.id} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function VersionHistory({ applicationId }: { applicationId: number }) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersions();
  }, [applicationId]);

  const fetchVersions = async () => {
    try {
      const res = await fetch(`/api/submission/versions?applicationId=${applicationId}`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading version history...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Version History</h3>
      
      {versions.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>No versions saved yet. Create a snapshot to track changes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {versions.map((version, index) => (
            <div key={version.id} className="flex items-start gap-4 p-4 rounded-lg border border-slate-200">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                index === 0 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-600'
              }`}>
                v{version.version_number}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">
                  Version {version.version_number}
                  {index === 0 && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Latest</span>}
                </p>
                <p className="text-sm text-slate-500">
                  {new Date(version.submitted_at).toLocaleString()}
                </p>
                {version.notes && (
                  <p className="text-sm text-slate-600 mt-1">{version.notes}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                version.validation_status === 'valid' ? 'bg-green-100 text-green-700' :
                version.validation_status === 'invalid' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {version.validation_status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
