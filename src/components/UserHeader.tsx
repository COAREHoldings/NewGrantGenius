'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { User, LogOut, Sparkles } from 'lucide-react';

export default function UserHeader() {
  const { user, isDemo, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GM</span>
            </div>
            <span className="font-semibold text-slate-900">Grant Master</span>
          </Link>

          <div className="flex items-center gap-4">
            {isDemo ? (
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Demo Mode
                </span>
                <Link
                  href="/login"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Sign Up for Full Access
                </Link>
                <button
                  onClick={signOut}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                  title="Exit Demo"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-sm text-slate-700">{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
