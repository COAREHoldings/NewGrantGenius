'use client';

import { useAuth } from '@/lib/auth-context';
import { X, Lock, Sparkles } from 'lucide-react';

export function UpgradePrompt() {
  const { upgradePromptFeature, closeUpgradePrompt, aiCallsRemaining } = useAuth();

  if (!upgradePromptFeature) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button onClick={closeUpgradePrompt} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Feature Locked</h3>
            <p className="text-sm text-gray-500">Demo Mode Restriction</p>
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          <strong>{upgradePromptFeature}</strong> is not available in demo mode.
          {upgradePromptFeature === 'AI Generation' && aiCallsRemaining <= 0 && (
            <span className="block mt-2 text-amber-600">
              You&apos;ve used all 5 AI generations available in the demo.
            </span>
          )}
        </p>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">Unlock Full Access</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Unlimited AI generations</li>
            <li>✓ Export to PDF & Word</li>
            <li>✓ Save & version control</li>
            <li>✓ All premium modules</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button onClick={closeUpgradePrompt} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            Continue Demo
          </button>
          <button onClick={() => window.open('/login', '_self')} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
