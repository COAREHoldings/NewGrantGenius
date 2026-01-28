'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  Publication,
  Manuscript,
  ResearchProfile,
  PublicationsState,
  LiteratureGap,
  JournalCheckResult,
  ReviewerComment,
} from '../types';

const initialState: PublicationsState = {
  publications: [],
  manuscripts: [],
  currentManuscript: null,
  researchProfile: null,
  loading: false,
  error: null,
};

export function usePublications() {
  const [state, setState] = useState<PublicationsState>(initialState);

  // Fetch initial data on mount
  useEffect(() => {
    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true }));
      try {
        const res = await fetch('/api/publications?type=all');
        if (res.ok) {
          const data = await res.json();
          setState(prev => ({
            ...prev,
            publications: data.publications || [],
            manuscripts: data.manuscripts || [],
            researchProfile: data.profile || null,
            loading: false,
          }));
        } else {
          setState(prev => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error('Failed to fetch publications data:', err);
        setState(prev => ({ ...prev, loading: false }));
      }
    };
    fetchData();
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading, error: loading ? null : prev.error }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, loading: false }));
  }, []);

  const callApi = useCallback(async (action: string, data: Record<string, unknown>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch('/api/publications', {
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

  const importDOI = useCallback(async (doi: string): Promise<Publication> => {
    const pub = await callApi('import-doi', { doi });
    setState(prev => ({
      ...prev,
      publications: [...prev.publications, pub],
      loading: false,
    }));
    return pub;
  }, [callApi]);

  const searchPubMed = useCallback(async (query: string, maxResults = 10) => {
    const result = await callApi('search-pubmed', { query, maxResults });
    setState(prev => ({ ...prev, loading: false }));
    return result.results as Publication[];
  }, [callApi]);

  const addPublication = useCallback(async (pub: Publication) => {
    const saved = await callApi('add-publication', { publication: pub });
    setState(prev => ({
      ...prev,
      publications: [...prev.publications, saved],
      loading: false,
    }));
  }, [callApi]);

  const removePublication = useCallback(async (id: string) => {
    await callApi('remove-publication', { id });
    setState(prev => ({
      ...prev,
      publications: prev.publications.filter(p => p.id !== id),
      loading: false,
    }));
  }, [callApi]);

  const findLiteratureGaps = useCallback(async (abstract: string, researchArea: string): Promise<{ gaps: LiteratureGap[] }> => {
    const result = await callApi('literature-gaps', { abstract, researchArea });
    setState(prev => ({ ...prev, loading: false }));
    return result;
  }, [callApi]);

  const checkJournal = useCallback(async (manuscript: { title: string; abstract: string; wordCount?: number }, targetJournal: string): Promise<JournalCheckResult> => {
    const result = await callApi('journal-check', { manuscript, targetJournal });
    setState(prev => ({ ...prev, loading: false }));
    return result;
  }, [callApi]);

  const generateCoverLetter = useCallback(async (manuscript: { title: string; abstract: string; highlights?: string[] }, journal: string): Promise<{ coverLetter: string; wordCount: number }> => {
    const result = await callApi('cover-letter', { manuscript, journal });
    setState(prev => ({ ...prev, loading: false }));
    return result;
  }, [callApi]);

  const generateRevisionResponse = useCallback(async (comments: ReviewerComment[], manuscriptChanges?: string) => {
    const result = await callApi('revision-response', { comments, manuscriptChanges });
    setState(prev => ({ ...prev, loading: false }));
    return result;
  }, [callApi]);

  const buildProfile = useCallback(async (): Promise<ResearchProfile> => {
    const result = await callApi('build-profile', {});
    setState(prev => ({
      ...prev,
      researchProfile: result,
      loading: false,
    }));
    return result;
  }, [callApi]);

  const findJournalFit = useCallback(async (manuscript: { title: string; abstract: string; keywords: string[] }) => {
    const result = await callApi('journal-fit', { manuscript });
    setState(prev => ({ ...prev, loading: false }));
    return result;
  }, [callApi]);

  const createManuscript = useCallback(async (manuscript: Omit<Manuscript, 'id' | 'createdAt' | 'updatedAt'>) => {
    const saved = await callApi('save-manuscript', { manuscript });
    setState(prev => ({
      ...prev,
      manuscripts: [...prev.manuscripts, saved],
      currentManuscript: saved,
      loading: false,
    }));
    return saved;
  }, [callApi]);

  const updateManuscript = useCallback(async (id: string, updates: Partial<Manuscript>) => {
    const saved = await callApi('save-manuscript', { manuscript: { id, ...updates } });
    setState(prev => ({
      ...prev,
      manuscripts: prev.manuscripts.map(m => m.id === id ? saved : m),
      currentManuscript: prev.currentManuscript?.id === id ? saved : prev.currentManuscript,
      loading: false,
    }));
  }, [callApi]);

  const setCurrentManuscript = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      currentManuscript: id ? prev.manuscripts.find(m => m.id === id) || null : null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    state,
    setLoading,
    setError,
    importDOI,
    searchPubMed,
    addPublication,
    removePublication,
    findLiteratureGaps,
    checkJournal,
    generateCoverLetter,
    generateRevisionResponse,
    buildProfile,
    findJournalFit,
    createManuscript,
    updateManuscript,
    setCurrentManuscript,
    reset,
  };
}
