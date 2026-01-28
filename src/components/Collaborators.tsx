'use client';

import { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, X, Shield, Edit, Eye } from 'lucide-react';

interface Collaborator {
  id: number;
  email: string;
  name?: string;
  role: 'owner' | 'editor' | 'viewer';
  created_at: string;
}

interface Props {
  applicationId: number;
  isOwner: boolean;
}

export default function Collaborators({ applicationId, isOwner }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCollaborators();
  }, [applicationId]);

  const fetchCollaborators = async () => {
    try {
      const res = await fetch(`/api/collaborators?applicationId=${applicationId}`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (error) {
      console.error('Failed to fetch collaborators:', error);
    }
  };

  const addCollaborator = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, email, role })
      });
      if (res.ok) {
        setEmail('');
        setShowModal(false);
        fetchCollaborators();
      }
    } catch (error) {
      console.error('Failed to add collaborator:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeCollaborator = async (id: number) => {
    try {
      await fetch('/api/collaborators', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaboratorId: id })
      });
      fetchCollaborators();
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
    }
  };

  const updateRole = async (id: number, newRole: string) => {
    try {
      await fetch('/api/collaborators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collaboratorId: id, role: newRole })
      });
      fetchCollaborators();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Shield className="w-3 h-3 text-amber-600" />;
      case 'editor': return <Edit className="w-3 h-3 text-blue-600" />;
      case 'viewer': return <Eye className="w-3 h-3 text-slate-600" />;
      default: return null;
    }
  };

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h3 className="font-medium text-sm text-slate-900">Team</h3>
            <span className="text-xs bg-slate-200 px-1.5 py-0.5 rounded">{collaborators.length}</span>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowModal(true)}
              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1"
            >
              <UserPlus className="w-3 h-3" />
              Add
            </button>
          )}
        </div>

        <div className="p-2 max-h-48 overflow-y-auto">
          {collaborators.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-3">No collaborators yet</p>
          ) : (
            <div className="space-y-1">
              {collaborators.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                      {(c.name || c.email)[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm truncate">{c.name || c.email}</p>
                      {c.name && <p className="text-xs text-slate-400 truncate">{c.email}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOwner && c.role !== 'owner' ? (
                      <select
                        value={c.role}
                        onChange={(e) => updateRole(c.id, e.target.value)}
                        className="text-xs border rounded px-1 py-0.5"
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-100 rounded">
                        {getRoleIcon(c.role)}
                        {c.role}
                      </span>
                    )}
                    {isOwner && c.role !== 'owner' && (
                      <button
                        onClick={() => removeCollaborator(c.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Add Collaborator</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="editor">Editor - Can edit content</option>
                  <option value="viewer">Viewer - Read only</option>
                </select>
              </div>

              <button
                onClick={addCollaborator}
                disabled={!email || loading}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Collaborator'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
