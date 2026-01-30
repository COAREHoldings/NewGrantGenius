'use client';

import { useState } from 'react';
import ApplicationList from './ApplicationList';
import { FileText, BookOpen, CheckSquare, RefreshCw, Library, Search, FileSpreadsheet, Rocket, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero CTA - Ready To Grant */}
      <div className="mb-8">
        <Link 
          href="/submission" 
          className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-8 text-white hover:opacity-95 transition-all shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">Start Here</p>
                <h2 className="text-3xl font-bold">Ready To Grant</h2>
                <p className="text-white/90 mt-2">Begin your NIH SBIR/STTR grant application journey</p>
              </div>
            </div>
            <ArrowRight className="w-8 h-8 text-white/80" />
          </div>
        </Link>
      </div>

      {/* Quick Tools */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/grants" className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg p-4 text-white hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Discover</p>
                <p className="font-semibold">Grant Discovery</p>
              </div>
            </div>
          </Link>
          <Link href="/budget" className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg p-4 text-white hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Plan</p>
                <p className="font-semibold">Budget Tool</p>
              </div>
            </div>
          </Link>
          <Link href="/resubmission" className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Improve</p>
                <p className="font-semibold">Resubmission</p>
              </div>
            </div>
          </Link>
          <Link href="/publications" className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-4 text-white hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Library className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-white/80">Manage</p>
                <p className="font-semibold">Publications</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Platform Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Mechanism Support</p>
              <p className="font-semibold text-slate-900">SBIR & STTR</p>
            </div>
          </div>
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
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Export Format</p>
              <p className="font-semibold text-slate-900">NIH-Ready PDF</p>
            </div>
          </div>
        </div>
      </div>

      {/* My Applications */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">My Applications</h2>
        <p className="text-slate-600 text-sm">Your in-progress and completed grant applications</p>
      </div>
      <ApplicationList refreshTrigger={refreshTrigger} />
    </main>
  );
}
