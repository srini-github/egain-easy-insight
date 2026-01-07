/**
 * Split Search Contexts for Performance Optimization
 *
 * This file contains multiple focused contexts split from the original SearchProvider.
 * This reduces unnecessary re-renders by allowing components to subscribe only to
 * the specific state slices they need.
 *
 * Context Split Strategy:
 * - SearchQueryContext: query state and search submission
 * - SearchFiltersContext: filters and sort state
 * - SearchResultsContext: results, loading, and error state
 * - SearchActionsContext: article modal and history actions
 */

import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type { KnowledgeArticle } from '../types/knowledge';

// ===== Search Query Context =====
export type SearchFilters = {
  category: string;
  dateRange: string;
  startDate: string | null;
  endDate: string | null;
};

export type PendingAIJob = { id: number; query: string } | null;

/* eslint-disable no-unused-vars */
export type SearchQueryContextValue = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  hasSearched: boolean;
  submitSearch: (_term?: string, _options?: { persistHistory?: boolean; filtersOverride?: SearchFilters }) => void;
  selectHistoryTerm: (_term: string) => void;
  runDemoQuery: (_term: string) => void;
  pendingAIJob: PendingAIJob;
  resolvePendingAIJob: () => void;
};
/* eslint-enable no-unused-vars */

export const SearchQueryContext = createContext<SearchQueryContextValue | null>(null);

export const useSearchQuery = () => {
  const context = useContext(SearchQueryContext);
  if (!context) {
    throw new Error('useSearchQuery must be used within a SearchProvider');
  }
  return context;
};

// ===== Search Filters Context =====
export type SearchFiltersContextValue = {
  filters: SearchFilters;
  setFilters: Dispatch<SetStateAction<SearchFilters>>;
  sortBy: string;
  setSortBy: Dispatch<SetStateAction<string>>;
};

export const SearchFiltersContext = createContext<SearchFiltersContextValue | null>(null);

export const useSearchFilters = () => {
  const context = useContext(SearchFiltersContext);
  if (!context) {
    throw new Error('useSearchFilters must be used within a SearchProvider');
  }
  return context;
};

// ===== Search Results Context =====
export type SearchResultsContextValue = {
  results: KnowledgeArticle[];
  suggestions: KnowledgeArticle[];
  isLoading: boolean;
  error: string | null;
};

export const SearchResultsContext = createContext<SearchResultsContextValue | null>(null);

export const useSearchResults = () => {
  const context = useContext(SearchResultsContext);
  if (!context) {
    throw new Error('useSearchResults must be used within a SearchProvider');
  }
  return context;
};

// ===== Search Actions Context =====
/* eslint-disable no-unused-vars */
export type SearchActionsContextValue = {
  openArticle: (_article: KnowledgeArticle) => void;
  closeArticle: () => void;
  openArticleById: (_articleId: string) => void;
  selectedArticle: KnowledgeArticle | null;
  history: string[];
  clearHistory: () => void;
};
/* eslint-enable no-unused-vars */

export const SearchActionsContext = createContext<SearchActionsContextValue | null>(null);

export const useSearchActions = () => {
  const context = useContext(SearchActionsContext);
  if (!context) {
    throw new Error('useSearchActions must be used within a SearchProvider');
  }
  return context;
};

// ===== Legacy Combined Hook for Backward Compatibility =====
// This hook combines all contexts to maintain backward compatibility
// Components can gradually migrate to specific hooks
export const useSearchContext = () => {
  const query = useSearchQuery();
  const filters = useSearchFilters();
  const results = useSearchResults();
  const actions = useSearchActions();

  return {
    // From SearchQueryContext
    query: query.query,
    setQuery: query.setQuery,
    hasSearched: query.hasSearched,
    submitSearch: query.submitSearch,
    selectHistoryTerm: query.selectHistoryTerm,
    runDemoQuery: query.runDemoQuery,
    pendingAIJob: query.pendingAIJob,
    resolvePendingAIJob: query.resolvePendingAIJob,

    // From SearchFiltersContext
    filters: filters.filters,
    setFilters: filters.setFilters,
    sortBy: filters.sortBy,
    setSortBy: filters.setSortBy,

    // From SearchResultsContext
    results: results.results,
    suggestions: results.suggestions,
    isLoading: results.isLoading,
    error: results.error,

    // From SearchActionsContext
    openArticle: actions.openArticle,
    closeArticle: actions.closeArticle,
    openArticleById: actions.openArticleById,
    selectedArticle: actions.selectedArticle,
    history: actions.history,
    clearHistory: actions.clearHistory
  };
};
