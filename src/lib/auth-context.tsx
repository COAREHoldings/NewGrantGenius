'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';

export const DEMO_RESTRICTED_FEATURES = {
  AI_GENERATION: 'AI Generation',
  EXPORT_PDF: 'Export to PDF',
  EXPORT_WORD: 'Export to Word',
  SAVE_VERSION: 'Save Version',
  DOCUMENT_UPLOAD: 'Document Upload',
  LETTERS_GENERATOR: 'Letters Generator',
  REGULATORY_COMPLIANCE: 'Regulatory Compliance',
} as const;

const MAX_AI_CALLS_DEMO = 5;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
  // Demo restriction features
  aiCallsRemaining: number;
  upgradePromptFeature: string | null;
  showUpgradePrompt: (feature: string) => void;
  closeUpgradePrompt: () => void;
  checkDemoFeature: (feature: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [aiCallsRemaining, setAiCallsRemaining] = useState(MAX_AI_CALLS_DEMO);
  const [upgradePromptFeature, setUpgradePromptFeature] = useState<string | null>(null);

  useEffect(() => {
    // Check demo mode
    const demoMode = localStorage.getItem('grantmaster_demo_mode') === 'true';
    setIsDemo(demoMode);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('grantmaster_demo_mode');
    await supabase.auth.signOut();
    setIsDemo(false);
  };

  const showUpgradePrompt = (feature: string) => {
    if (isDemo) setUpgradePromptFeature(feature);
  };

  const closeUpgradePrompt = () => setUpgradePromptFeature(null);

  const checkDemoFeature = (feature: string): boolean => {
    if (!isDemo) return true;
    if (feature === DEMO_RESTRICTED_FEATURES.AI_GENERATION) {
      if (aiCallsRemaining <= 0) {
        setUpgradePromptFeature('AI Generation');
        return false;
      }
      setAiCallsRemaining(prev => prev - 1);
      return true;
    }
    setUpgradePromptFeature(feature);
    return false;
  };

  return (
    <AuthContext.Provider value={{ 
      user, session, loading, isDemo, signOut,
      aiCallsRemaining, upgradePromptFeature, showUpgradePrompt, closeUpgradePrompt, checkDemoFeature
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
