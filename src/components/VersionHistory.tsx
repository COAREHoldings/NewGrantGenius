'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { History, RotateCcw, ChevronDown, ChevronUp, Clock } from 'lucide-react';

interface Version {
  id: number;
  content: string;
  created_at: string;
  word_count: number;
}

interface Props {
  sectionId: number;
  currentContent: string;
  onRestore: (content: string) => void;
}

export default function VersionHistory({ sectionId, currentContent, onRestore }: Props) {
  const { checkDemoFeature } = useAuth();
  const [versions, setVersions] = useState<Version[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  useEffect(() => {
    if (expanded && versions.length === 0) {
      fetchVersions();
    }
  }, [expanded]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/versions?sectionId=${sectionId}`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data.versions || []);
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveVersion = async () => {
    if (!checkDemoFeature('Save Version')) return;
    try {
      await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId, content: currentContent })
      });
      fetchVersions();
    } catch (error) {
      console.error('Failed to save version:', error);
    }
  };

  const restoreVersion = async (version: Version) => {
    try {
      const res = await fetch('/api/versions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: version.id, sectionId })
      });
      if (res.ok) {
        const data = await res.json();
        onRestore(data.content);
        setSelectedVersion(null);
      }
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="border rounded-lg bg-slate-50">
      <div 
        className="flex items-center justify-between p-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <History className="w-4 h-4" />
          <span>Version History</span>
          {versions.length > 0 && (
            <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded">{versions.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); saveVersion(); }}
            className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
          >
            Save Checkpoint
          </button>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t p-2 max-h-48 overflow-y-auto">
          {loading ? (
            <p className="text-xs text-slate-500 text-center py-2">Loading...</p>
          ) : versions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-2">No saved versions yet</p>
          ) : (
            <div className="space-y-1">
              {versions.map((v) => (
                <div 
                  key={v.id}
                  className={`flex items-center justify-between p-2 rounded text-xs ${
                    selectedVersion?.id === v.id ? 'bg-indigo-100' : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatDate(v.created_at)}</span>
                    <span className="text-slate-400">({v.word_count} words)</span>
                  </div>
                  <button
                    onClick={() => restoreVersion(v)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
