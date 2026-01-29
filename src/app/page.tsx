'use client';

import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  // Temporarily bypass auth for demo
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <Dashboard />
    </div>
  );
}