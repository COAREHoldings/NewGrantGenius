'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MECHANISMS } from '@/lib/mechanisms';
import { FileText, Calendar, Trash2, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Application {
  id: number;
  title: string;
  mechanism: string;
  status: string;
  created_at: string;
}

interface Props {
  refreshTrigger: number;
}

export default function ApplicationList({ refreshTrigger }: Props) {
  const { token } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [token, refreshTrigger]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchApplications();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500">Loading applications...</div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">No applications yet</h3>
        <p className="text-slate-500">Create your first grant application to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map(app => {
        const mech = MECHANISMS[app.mechanism];
        return (
          <div
            key={app.id}
            className="bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <Link href={`/application/${app.id}`} className="block">
                  <h3 className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition">
                    {app.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {mech?.name || app.mechanism}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      app.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                      app.status === 'complete' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                </Link>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleDelete(app.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition"
                  title="Delete application"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <Link
                  href={`/application/${app.id}`}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
