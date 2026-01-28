'use client';

import { useState } from 'react';
import NewApplicationModal from './NewApplicationModal';
import ApplicationList from './ApplicationList';
import { FileText, BookOpen, CheckSquare } from 'lucide-react';

export default function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Grant Applications</h1>
            <p className="text-slate-600 mt-1">Create and manage your NIH SBIR/STTR grant applications</p>
          </div>
          <NewApplicationModal onCreated={() => setRefreshTrigger(t => t + 1)} />
        </div>

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
      </div>

      <ApplicationList refreshTrigger={refreshTrigger} />
    </main>
  );
}
