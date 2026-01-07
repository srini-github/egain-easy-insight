/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useSearchQuery, useSearchResults } from './SearchProvider';
import { useSession } from './SessionProvider';
import { useAISearch } from '../hooks/useAISearch';

type AISearchState = ReturnType<typeof useAISearch>;

type AIContextValue = {
  aiResponse: AISearchState['aiResponse'];
  aiLoading: AISearchState['aiLoading'];
  aiError: AISearchState['aiError'];
  aiAvailable: AISearchState['aiAvailable'];
  permissions: AISearchState['permissions'];
  sendFeedback: AISearchState['sendFeedback'];
  handleRetry: () => void;
};

const AIContext = createContext<AIContextValue | null>(null);

type AIProviderProps = {
  children: ReactNode;
};

export const AIProvider = ({ children }: AIProviderProps) => {
  const { currentUser } = useSession();
  // Optimized: Subscribe to specific contexts instead of entire search context
  const {
    query,
    pendingAIJob,
    resolvePendingAIJob
  } = useSearchQuery();
  const { results, isLoading } = useSearchResults();
  const {
    aiResponse,
    aiLoading,
    aiError,
    aiAvailable,
    permissions,
    generateAnswer,
    sendFeedback,
    clearAIResponse,
    retryAI,
    initializePermissions
  } = useAISearch();
  const activeJobRef = useRef<number | null>(null);

  useEffect(() => {
    initializePermissions();
  }, [initializePermissions, currentUser.id]);

  useEffect(() => {
    if (pendingAIJob) {
      clearAIResponse();
    }
  }, [clearAIResponse, pendingAIJob]);

  useEffect(() => {
    if (!pendingAIJob) {
      activeJobRef.current = null;
    }
  }, [pendingAIJob]);

  useEffect(() => {
    if (!pendingAIJob) return;
    if (activeJobRef.current === pendingAIJob.id) return;
    if (isLoading) return;

    const { query: jobQuery } = pendingAIJob;
    if (!jobQuery || jobQuery.length <= 2) {
      resolvePendingAIJob();
      return;
    }

    if (results.length === 0) {
      resolvePendingAIJob();
      return;
    }

    let cancelled = false;

    activeJobRef.current = pendingAIJob.id;

    const run = async () => {
      try {
        await generateAnswer(jobQuery, results);
      } finally {
        if (!cancelled) {
          activeJobRef.current = null;
          resolvePendingAIJob();
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [generateAnswer, isLoading, pendingAIJob, resolvePendingAIJob, results]);

  useEffect(() => {
    clearAIResponse();
  }, [clearAIResponse, currentUser.id]);

  const handleRetry = useCallback(() => {
    if (!query) return;
    retryAI(query, results);
  }, [query, results, retryAI]);

  const value = useMemo(() => ({
    aiResponse,
    aiLoading,
    aiError,
    aiAvailable,
    permissions,
    sendFeedback,
    handleRetry
  }), [aiAvailable, aiError, aiLoading, aiResponse, handleRetry, permissions, sendFeedback]);

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

export const useAIContext = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAIContext must be used within an AIProvider');
  }
  return context;
};
