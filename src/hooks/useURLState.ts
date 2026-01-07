import { useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to sync state with URL query parameters
 * Enables shareable URLs and browser back/forward navigation
 */

interface SearchState {
    query: string;
    category: string;
    dateRange: string;
    startDate: string | null;
    endDate: string | null;
    sortBy: string;
}

export const useURLState = (
    onStateChange: (state: Partial<SearchState>) => void
) => {
    const isInitialMount = useRef(true);
    const isUpdatingFromURL = useRef(false);

    // Parse URL parameters on mount and when URL changes
    const parseURLParams = useCallback((): Partial<SearchState> => {
        const params = new URLSearchParams(window.location.search);
        const state: Partial<SearchState> = {};

        const query = params.get('q');
        if (query) state.query = decodeURIComponent(query);

        const category = params.get('category');
        if (category) state.category = category;

        const dateRange = params.get('dateRange');
        if (dateRange) state.dateRange = dateRange;

        const startDate = params.get('startDate');
        if (startDate) state.startDate = startDate;

        const endDate = params.get('endDate');
        if (endDate) state.endDate = endDate;

        const sortBy = params.get('sortBy');
        if (sortBy) state.sortBy = sortBy;

        return state;
    }, []);

    // Update URL without triggering navigation
    const updateURL = useCallback((state: Partial<SearchState>) => {
        const params = new URLSearchParams();

        if (state.query) {
            params.set('q', encodeURIComponent(state.query));
        }
        if (state.category && state.category !== 'All') {
            params.set('category', state.category);
        }
        if (state.dateRange && state.dateRange !== 'All') {
            params.set('dateRange', state.dateRange);
        }
        if (state.startDate) {
            params.set('startDate', state.startDate);
        }
        if (state.endDate) {
            params.set('endDate', state.endDate);
        }
        if (state.sortBy && state.sortBy !== 'relevance') {
            params.set('sortBy', state.sortBy);
        }

        const newURL = params.toString()
            ? `${window.location.pathname}?${params.toString()}`
            : window.location.pathname;

        // Use pushState to update URL without reloading
        window.history.pushState({}, '', newURL);
    }, []);

    // Listen for popstate events (browser back/forward)
    useEffect(() => {
        const handlePopState = () => {
            isUpdatingFromURL.current = true;
            const state = parseURLParams();
            if (Object.keys(state).length > 0) {
                onStateChange(state);
            }
            // Reset flag after state update
            setTimeout(() => {
                isUpdatingFromURL.current = false;
            }, 100);
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [parseURLParams, onStateChange]);

    // Load initial state from URL on mount
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            isUpdatingFromURL.current = true;
            const state = parseURLParams();
            if (Object.keys(state).length > 0) {
                onStateChange(state);
            }
            setTimeout(() => {
                isUpdatingFromURL.current = false;
            }, 100);
        }
    }, [parseURLParams, onStateChange]);

    return {
        updateURL,
        isUpdatingFromURL: () => isUpdatingFromURL.current
    };
};
