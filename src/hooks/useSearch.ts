import { useState, useEffect, useCallback, useRef } from 'react';
import {
  searchKnowledge,
  fetchSearchSuggestions,
  sortArticlesByKey,
  applyResultOrdering,
  filterArticlesByFilters
} from '../services/api/articleService';
import { withRetry, classifyError, getErrorMessage, NetworkErrorType } from '../utils/networkUtils';

export const useSearch = ({ userId }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'All',
    dateRange: 'All',
    startDate: null,
    endDate: null
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [results, setResults] = useState([]);
  const [unfilteredResults, setUnfilteredResults] = useState([]); // Store unfiltered results for client-side filtering
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [orderingKey, setOrderingKey] = useState(null);

  const lastSearchRef = useRef('');
  const queryRef = useRef(query);
  const filtersRef = useRef(filters);
  const sortRef = useRef(sortBy);
  const isSearchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const suggestionsAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`search_history_${userId}`);
    setHistory(saved ? JSON.parse(saved) : []);
    setResults([]);
    setUnfilteredResults([]);
    setSuggestions([]);
    setOrderingKey(null);
    setError(null);
  }, [userId]);

  useEffect(() => { queryRef.current = query; }, [query]);
  useEffect(() => { filtersRef.current = filters; }, [filters]);
  useEffect(() => { sortRef.current = sortBy; }, [sortBy]);

  useEffect(() => {
    if (query.length <= 1) {
      setSuggestions([]);
      // Cancel any pending suggestion requests
      if (suggestionsAbortControllerRef.current) {
        suggestionsAbortControllerRef.current.abort();
        suggestionsAbortControllerRef.current = null;
      }
      return undefined;
    }

    // Don't fetch suggestions if a search was just submitted
    if (isSearchingRef.current) {
      return undefined;
    }

    // Don't fetch suggestions if a search is already in progress
    if (isLoading) {
      return undefined;
    }

    // Cancel previous suggestion request
    if (suggestionsAbortControllerRef.current) {
      suggestionsAbortControllerRef.current.abort();
    }

    const timer = setTimeout(async () => {
      // Create new AbortController for this suggestion request
      const abortController = new AbortController();
      suggestionsAbortControllerRef.current = abortController;

      try {
        const matches = await fetchSearchSuggestions({ query, signal: abortController.signal });
        // Only update if not aborted
        if (!abortController.signal.aborted) {
          setSuggestions(matches);
        }
      } catch (err: any) {
        // Ignore abort errors
        if (err.name !== 'AbortError') {
          console.error('Failed to load suggestions', err);
          if (!abortController.signal.aborted) {
            setSuggestions([]);
          }
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      // Cancel suggestion request on cleanup
      if (suggestionsAbortControllerRef.current) {
        suggestionsAbortControllerRef.current.abort();
        suggestionsAbortControllerRef.current = null;
      }
    };
  }, [query, isLoading]);

  const performSearch = useCallback(async (q, activeFilters, sortOverride) => {
    const searchQuery = q ?? queryRef.current;
    const filtersToUse = activeFilters ?? filtersRef.current;
    const sortKey = sortOverride ?? sortRef.current;

    if (!searchQuery) {
      setResults([]);
      setUnfilteredResults([]);
      setOrderingKey(null);
      return null;
    }

    // Cancel any pending search request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this search
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    lastSearchRef.current = searchQuery;
    isSearchingRef.current = true;
    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setOrderingKey(null);

    try {
      // Wrap search with retry logic (max 2 retries for search)
      const response = await withRetry(
        async () => {
          const result = await searchKnowledge({
            query: searchQuery,
            filters: { category: 'All', dateRange: 'All', startDate: null, endDate: null },
            sortBy: sortKey,
            signal: abortController.signal
          });

          // Check if request was aborted
          if (abortController.signal.aborted) {
            throw new Error('AbortError');
          }

          return result;
        },
        {
          maxRetries: 2,
          initialDelay: 500,
          maxDelay: 3000,
          backoffMultiplier: 2,
          retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.NETWORK_ERROR, NetworkErrorType.SERVER_ERROR]
        },
        abortController.signal
      );

      setOrderingKey(response.orderingKey);
      setUnfilteredResults(response.results);
      // Apply current filters client-side
      const filtered = filterArticlesByFilters(response.results, filtersToUse);
      setResults(filtered);
      return response;
    } catch (err: any) {
      // Don't set error state if request was aborted
      if (err.name === 'AbortError' || err.type === NetworkErrorType.ABORT) {
        return null;
      }

      // Classify error and provide user-friendly message
      const networkError = classifyError(err);
      const userMessage = getErrorMessage(networkError);

      console.error('Search failed:', networkError);
      setError(userMessage);
      return null;
    } finally {
      // Only clear loading if this is still the active request
      if (abortControllerRef.current === abortController) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
      // Keep isSearchingRef true for a short time to prevent suggestions from reappearing
      setTimeout(() => {
        isSearchingRef.current = false;
      }, 100);
    }
  }, []);

  // Apply client-side filtering when filters change
  useEffect(() => {
    if (!unfilteredResults.length) return;

    const filtered = filterArticlesByFilters(unfilteredResults, filters);
    setResults(filtered);
  }, [filters, unfilteredResults]);

  // Apply client-side sorting when sortBy changes
  useEffect(() => {
    setResults(prev => {
      if (!prev.length) return prev;
      const sorted = sortArticlesByKey(prev, sortBy);
      if (sortBy === 'relevance' && orderingKey) {
        return applyResultOrdering(orderingKey, sorted);
      }
      return sorted;
    });
  }, [orderingKey, sortBy]);

  const addToHistory = useCallback((q: string) => {
    setHistory(prev => {
      const newHistory = [q, ...prev.filter(h => h !== q)].slice(0, 5);
      localStorage.setItem(`search_history_${userId}`, JSON.stringify(newHistory));
      return newHistory;
    });
  }, [userId]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(`search_history_${userId}`);
  }, [userId]);

  return {
    query, setQuery,
    filters, setFilters,
    sortBy, setSortBy,
    results,
    suggestions,
    isLoading,
    error,
    history,
    performSearch,
    addToHistory,
    clearHistory
  };
};
