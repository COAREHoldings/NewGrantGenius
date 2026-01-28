'use client';

import { useState, useCallback } from 'react';
import type {
  ResubmissionState,
  ParsedSummaryStatement,
  AuditResults,
  ResponseStrategy,
  SectionRewrite,
  CoverLetter,
  QualityCheckResults,
} from '../types';

const initialState: ResubmissionState = {
  step: 1,
  submissionType: null,
  previousScore: null,
  grantDocument: null,
  grantText: '',
  summaryStatement: null,
  summaryText: '',
  parsedSummary: null,
  auditResults: null,
  responseStrategy: null,
  sectionRewrites: [],
  coverLetter: null,
  qualityCheck: null,
  loading: false,
  error: null,
};

export function useResubmission() {
  const [state, setState] = useState<ResubmissionState>(initialState);

  const setStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, step, error: null }));
  }, []);

  const setSubmissionType = useCallback((type: 'A0-A1' | 'A1-new') => {
    setState(prev => ({ ...prev, submissionType: type }));
  }, []);

  const setPreviousScore = useCallback((score: number | null) => {
    setState(prev => ({ ...prev, previousScore: score }));
  }, []);

  const setGrantDocument = useCallback((file: File | null, text: string) => {
    setState(prev => ({ ...prev, grantDocument: file, grantText: text }));
  }, []);

  const setSummaryStatement = useCallback((file: File | null, text: string) => {
    setState(prev => ({ ...prev, summaryStatement: file, summaryText: text }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  const callApi = useCallback(async (action: string, data: Record<string, unknown>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/resubmission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }
      return await res.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, error: message, loading: false }));
      throw err;
    }
  }, []);

  const parseSummaryStatement = useCallback(async () => {
    const result = await callApi('parse', { summaryText: state.summaryText });
    setState(prev => ({
      ...prev,
      parsedSummary: result as ParsedSummaryStatement,
      loading: false,
    }));
    return result;
  }, [callApi, state.summaryText]);

  const runAudit = useCallback(async () => {
    const result = await callApi('audit', {
      grantText: state.grantText,
      parsedSummary: state.parsedSummary,
    });
    setState(prev => ({
      ...prev,
      auditResults: result as AuditResults,
      loading: false,
    }));
    return result;
  }, [callApi, state.grantText, state.parsedSummary]);

  const generateStrategy = useCallback(async () => {
    const result = await callApi('strategy', {
      parsedSummary: state.parsedSummary,
      auditResults: state.auditResults,
    });
    setState(prev => ({
      ...prev,
      responseStrategy: result as ResponseStrategy,
      loading: false,
    }));
    return result;
  }, [callApi, state.parsedSummary, state.auditResults]);

  const rewriteSection = useCallback(async (sectionName: string, originalText: string, critiquesToAddress: string[]) => {
    const result = await callApi('rewrite', {
      sectionName,
      originalText,
      critiquesToAddress,
      responseStrategy: state.responseStrategy,
    });
    const rewrite = result as SectionRewrite;
    setState(prev => ({
      ...prev,
      sectionRewrites: [...prev.sectionRewrites.filter(r => r.sectionName !== sectionName), rewrite],
      loading: false,
    }));
    return rewrite;
  }, [callApi, state.responseStrategy]);

  const generateCoverLetter = useCallback(async () => {
    const result = await callApi('cover-letter', {
      parsedSummary: state.parsedSummary,
      responseStrategy: state.responseStrategy,
      sectionRewrites: state.sectionRewrites,
    });
    setState(prev => ({
      ...prev,
      coverLetter: result as CoverLetter,
      loading: false,
    }));
    return result;
  }, [callApi, state.parsedSummary, state.responseStrategy, state.sectionRewrites]);

  const runQualityCheck = useCallback(async () => {
    const result = await callApi('quality-check', {
      grantText: state.grantText,
      parsedSummary: state.parsedSummary,
      responseStrategy: state.responseStrategy,
      sectionRewrites: state.sectionRewrites,
      coverLetter: state.coverLetter,
    });
    setState(prev => ({
      ...prev,
      qualityCheck: result as QualityCheckResults,
      loading: false,
    }));
    return result;
  }, [callApi, state.grantText, state.parsedSummary, state.responseStrategy, state.sectionRewrites, state.coverLetter]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    setStep,
    setSubmissionType,
    setPreviousScore,
    setGrantDocument,
    setSummaryStatement,
    setLoading,
    setError,
    parseSummaryStatement,
    runAudit,
    generateStrategy,
    rewriteSection,
    generateCoverLetter,
    runQualityCheck,
    reset,
  };
}
