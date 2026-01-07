import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
  type ReactNode
} from 'react';
import { useSession } from './SessionProvider';
import { useCustomer } from './CustomerProvider';
import { useSearch } from '../hooks/useSearch';
import { useURLState } from '../hooks/useURLState';
import {
  SearchQueryContext,
  SearchFiltersContext,
  SearchResultsContext,
  SearchActionsContext,
  type SearchFilters,
  type PendingAIJob
} from './SearchContexts';
import type { KnowledgeArticle } from '../types/knowledge';

type SearchProviderProps = {
  children: ReactNode;
};

/**
 * SearchProvider with split contexts for performance optimization
 *
 * Provides 4 separate contexts to minimize re-renders:
 * - SearchQueryContext: query state and search submission
 * - SearchFiltersContext: filters and sort state
 * - SearchResultsContext: results, loading, error state
 * - SearchActionsContext: article modal and history actions
 */
export const SearchProvider = ({ children }: SearchProviderProps) => {
  const { currentUser } = useSession();
  const { currentCustomer } = useCustomer();
  const {
    query,
    setQuery,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    results,
    suggestions,
    isLoading,
    error,
    history,
    performSearch,
    addToHistory,
    clearHistory
  } = useSearch({ userId: currentUser.id });

  const [hasSearched, setHasSearched] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [pendingAIJob, setPendingAIJob] = useState<PendingAIJob>(null);
  const urlUpdateRef = useRef(false);

  const queueAIJob = useCallback((term?: string) => {
    if (!term) return;
    setPendingAIJob({ id: Date.now(), query: term });
  }, []);

  // URL state management
  const { updateURL, isUpdatingFromURL } = useURLState(
    useCallback((state) => {
      if (state.query) setQuery(state.query);
      if (state.category || state.dateRange || state.startDate !== undefined || state.endDate !== undefined) {
        setFilters(prev => ({
          ...prev,
          ...(state.category && { category: state.category }),
          ...(state.dateRange && { dateRange: state.dateRange }),
          ...(state.startDate !== undefined && { startDate: state.startDate }),
          ...(state.endDate !== undefined && { endDate: state.endDate })
        }));
      }
      if (state.sortBy) setSortBy(state.sortBy);

      // Trigger search if query was loaded from URL
      if (state.query) {
        urlUpdateRef.current = true;
        setHasSearched(true);
        queueAIJob(state.query);
        performSearch(state.query);
      }
    }, [setQuery, setFilters, setSortBy, performSearch, queueAIJob])
  );

  const resolvePendingAIJob = useCallback(() => {
    setPendingAIJob(null);
  }, []);

  const submitSearch = useCallback((term?: string, { persistHistory = true, filtersOverride }: { persistHistory?: boolean; filtersOverride?: SearchFilters } = {}) => {
    const trimmedQuery = (term ?? query)?.trim();
    if (!trimmedQuery) return;

    setQuery(trimmedQuery);
    setHasSearched(true);
    setSelectedArticle(null);
    if (persistHistory) {
      addToHistory(trimmedQuery);
    }

    // Update URL with search state
    if (!isUpdatingFromURL()) {
      updateURL({
        query: trimmedQuery,
        category: filtersOverride?.category || filters.category,
        dateRange: filtersOverride?.dateRange || filters.dateRange,
        startDate: filtersOverride?.startDate || filters.startDate,
        endDate: filtersOverride?.endDate || filters.endDate,
        sortBy
      });
    }

    queueAIJob(trimmedQuery);
    performSearch(trimmedQuery, filtersOverride);
  }, [addToHistory, performSearch, queueAIJob, query, setQuery, filters, sortBy, updateURL, isUpdatingFromURL]);

  const selectHistoryTerm = useCallback((term: string) => {
    submitSearch(term, { persistHistory: false });
  }, [submitSearch]);

  const runDemoQuery = useCallback((term: string) => {
    // Reset all filters to default 'All' state for demo queries
    const normalizedFilters: SearchFilters = {
      category: 'All',
      dateRange: 'All',
      startDate: null,
      endDate: null
    };

    // Update filters state to reset UI
    setFilters(normalizedFilters);

    submitSearch(term, { filtersOverride: normalizedFilters });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [setFilters, submitSearch]);

  const openArticle = useCallback((article: KnowledgeArticle) => {
    setSelectedArticle(article);
  }, []);

  const closeArticle = useCallback(() => {
    setSelectedArticle(null);
  }, []);

  const openArticleById = useCallback((articleId: string) => {
    const match = results.find((article) => article.id === articleId);
    if (match) {
      setSelectedArticle(match);
    }
  }, [results]);

  // Reset state when user changes
  useEffect(() => {
    setSelectedArticle(null);
    setPendingAIJob(null);
    setHasSearched(false);
  }, [currentUser.id]);

  // Re-run search when customer changes to regenerate personalized AI answers
  useEffect(() => {
    if (query && hasSearched) {
      queueAIJob(query);
      performSearch(query);
    }
  }, [currentCustomer.id, performSearch, query, queueAIJob]);

  // Update URL when filters or sortBy change
  useEffect(() => {
    if (hasSearched && query && !isUpdatingFromURL() && !urlUpdateRef.current) {
      updateURL({
        query,
        category: filters.category,
        dateRange: filters.dateRange,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sortBy
      });
    }
    urlUpdateRef.current = false;
  }, [filters, sortBy, query, hasSearched, updateURL, isUpdatingFromURL]);

  // Split context values for performance optimization
  const queryContextValue = useMemo(() => ({
    query,
    setQuery,
    hasSearched,
    submitSearch,
    selectHistoryTerm,
    runDemoQuery,
    pendingAIJob,
    resolvePendingAIJob
  }), [
    query,
    setQuery,
    hasSearched,
    submitSearch,
    selectHistoryTerm,
    runDemoQuery,
    pendingAIJob,
    resolvePendingAIJob
  ]);

  const filtersContextValue = useMemo(() => ({
    filters,
    setFilters,
    sortBy,
    setSortBy
  }), [
    filters,
    setFilters,
    sortBy,
    setSortBy
  ]);

  const resultsContextValue = useMemo(() => ({
    results,
    suggestions,
    isLoading,
    error
  }), [
    results,
    suggestions,
    isLoading,
    error
  ]);

  const actionsContextValue = useMemo(() => ({
    openArticle,
    closeArticle,
    openArticleById,
    selectedArticle,
    history,
    clearHistory
  }), [
    openArticle,
    closeArticle,
    openArticleById,
    selectedArticle,
    history,
    clearHistory
  ]);

  return (
    <SearchQueryContext.Provider value={queryContextValue}>
      <SearchFiltersContext.Provider value={filtersContextValue}>
        <SearchResultsContext.Provider value={resultsContextValue}>
          <SearchActionsContext.Provider value={actionsContextValue}>
            {children}
          </SearchActionsContext.Provider>
        </SearchResultsContext.Provider>
      </SearchFiltersContext.Provider>
    </SearchQueryContext.Provider>
  );
};

// Re-export hooks from SearchContexts for convenience
/* eslint-disable react-refresh/only-export-components */
export { useSearchContext, useSearchQuery, useSearchFilters, useSearchResults, useSearchActions } from './SearchContexts';
/* eslint-enable react-refresh/only-export-components */
