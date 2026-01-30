'use client';

import { useState } from 'react';
import ApplicationList from './ApplicationList';
import { FileText, BookOpen, CheckSquare, Rocket, ArrowRight, Lightbulb } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome to Grant Master</h1>
        <p className="text-slate-600 mt-1">Your NIH SBIR/STTR grant application platform</p>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-900 mb-2">How to Use Grant Master</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex gap-2">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">1</span>
                <div>
                  <p className="font-medium text-slate-900">Start Your Application</p>
                  <p className="text-slate-600">Click "Ready To Grant" to begin. Add your team and upload documents.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
                <div>
                  <p className="font-medium text-slate-900">Build Your Sections</p>
                  <p className="text-slate-600">Create or upload Specific Aims, Research Strategy, Budget, and more.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">3</span>
                <div>
                  <p className="font-medium text-slate-900">Review & Submit</p>
                  <p className="text-slate-600">We validate your documents against NIH requirements before you submit.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero CTA - Ready To Grant */}
      <div className="mb-8">
        <Link 
          href="/submission" 
          className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white hover:opacity-95 transition-all shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Rocket className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">Start Here</p>
                <h2 className="text-2xl font-bold">Ready To Grant</h2>
                <p className="text-white/90 mt-1 text-sm">Build your NIH grant application step by step</p>
              </div>
            </div>
            <ArrowRight className="w-6 h-6 text-white/80" />
          </div>
        </Link>
      </div>

      {/* Platform Features */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">What We Help With</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Grant Types</p>
                <p className="font-semibold text-slate-900">SBIR & STTR</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Phase I and Phase II applications supported</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Compliance</p>
                <p className="font-semibold text-slate-900">Auto-Validation</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Check formatting against NIH requirements</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Output</p>
                <p className="font-semibold text-slate-900">NIH-Ready PDFs</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Export formatted for eRA Commons submission</p>
          </div>
        </div>
      </div>

      {/* My Applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">My Applications</h2>
            <p className="text-slate-600 text-sm">Your in-progress and completed grant applications</p>
          </div>
        </div>
        <ApplicationList refreshTrigger={refreshTrigger} />
      </div>
    </main>
  );
}
