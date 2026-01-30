// AI Settings Context for Grant Master
// Provides global AI toggle functionality

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AISettings {
  aiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;
  modelPreference: 'gpt-4' | 'gpt-3.5-turbo' | 'claude';
  setModelPreference: (model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude') => void;
}

const AISettingsContext = createContext<AISettings | undefined>(undefined);

export function AISettingsProvider({ children }: { children: ReactNode }) {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [modelPreference, setModelPreference] = useState<'gpt-4' | 'gpt-3.5-turbo' | 'claude'>('gpt-4');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedEnabled = localStorage.getItem('grantmaster_ai_enabled');
    const savedModel = localStorage.getItem('grantmaster_ai_model');
    if (savedEnabled !== null) setAiEnabled(savedEnabled === 'true');
    if (savedModel) setModelPreference(savedModel as 'gpt-4' | 'gpt-3.5-turbo' | 'claude');
  }, []);

  // Save settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem('grantmaster_ai_enabled', String(aiEnabled));
  }, [aiEnabled]);

  useEffect(() => {
    localStorage.setItem('grantmaster_ai_model', modelPreference);
  }, [modelPreference]);

  return (
    <AISettingsContext.Provider value={{ aiEnabled, setAiEnabled, modelPreference, setModelPreference }}>
      {children}
    </AISettingsContext.Provider>
  );
}

export function useAISettings() {
  const context = useContext(AISettingsContext);
  if (!context) {
    throw new Error('useAISettings must be used within AISettingsProvider');
  }
  return context;
}

// AI Toggle Component
export function AIToggle() {
  const { aiEnabled, setAiEnabled } = useAISettings();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">AI Assistant</span>
      <button
        onClick={() => setAiEnabled(!aiEnabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          aiEnabled ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            aiEnabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-xs ${aiEnabled ? 'text-green-600' : 'text-gray-400'}`}>
        {aiEnabled ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}
