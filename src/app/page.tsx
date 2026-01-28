'use client';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Dashboard />
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
