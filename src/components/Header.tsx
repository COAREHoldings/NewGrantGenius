'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { LogOut, User, Menu, X, Home, Rocket, Search, FileSpreadsheet, RefreshCw, Library, HelpCircle, FileSearch, Mail, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/submission', label: 'Ready To Grant', icon: Rocket, highlight: true },
  { href: '/review', label: 'Review & Score', icon: FileSearch },
  { href: '/grants', label: 'Grant Discovery', icon: Search },
  { href: '/budget', label: 'Budget Tool', icon: FileSpreadsheet },
  { href: '/letters', label: 'Letters', icon: Mail },
  { href: '/publications', label: 'Publications', icon: Library },
  { href: '/resubmission', label: 'Resubmission', icon: RefreshCw },
];

export default function Header() {
  const { user, isDemo, signOut, aiCallsRemaining } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <img src="/logo.png" alt="Grant Master" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    item.highlight && !isActive
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <a 
              href="https://grants.nih.gov/grants/how-to-apply-application-guide.html" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden lg:inline">NIH Guide</span>
            </a>
            
            {isDemo && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                <Sparkles className="w-3 h-3" /> Demo
              </span>
            )}
            {user && (
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 px-3 py-1.5 bg-slate-100 rounded-full">
                  <User className="w-4 h-4" />
                  <span className="hidden lg:inline">{user.name}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-red-600 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-3 rounded-lg text-sm font-medium flex items-center gap-3 ${
                      item.highlight && !isActive
                        ? 'bg-indigo-600 text-white'
                        : isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            
            {user && (
              <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-3">
                {isDemo && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full w-fit">
                    <Sparkles className="w-3 h-3" /> Demo Mode
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4" />
                    {user.name}
                  </div>
                  <button onClick={signOut} className="text-sm text-red-600 flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
