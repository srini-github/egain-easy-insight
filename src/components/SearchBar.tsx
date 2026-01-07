import React, { useRef, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useSearchQuery, useSearchResults } from '../context/SearchProvider';
import { sanitizeInput } from '../utils/validation';
import styles from './SearchBar.module.css';

const SearchBar = () => {
    // Optimized: Subscribe to specific contexts instead of entire search context
    const { query, setQuery, submitSearch, hasSearched } = useSearchQuery();
    const { suggestions } = useSearchResults();
    const wrapperRef = useRef(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [validationError, setValidationError] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(true);

    const handleSubmit = (searchQuery: string) => {
        if (!searchQuery || searchQuery.trim().length === 0) {
            setValidationError('Please enter a search query');
            return;
        }

        if (searchQuery.trim().length < 2) {
            setValidationError('Search query must be at least 2 characters');
            return;
        }

        setValidationError('');
        setShowSuggestions(false);
        setActiveIndex(-1);
        submitSearch(searchQuery);
        // Blur the input to remove focus
        inputRef.current?.blur();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (activeIndex >= 0 && suggestions[activeIndex]) {
                const item = suggestions[activeIndex];
                setQuery(item.title);
                handleSubmit(item.title);
            } else {
                handleSubmit(query);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, -1));
        } else if (e.key === 'Escape') {
            setActiveIndex(-1);
        }
    };

    // Close suggestions on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                // Optional: clear suggestions or hide dropdown logic if needed
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Hide suggestions when a search is performed (including demo queries)
    useEffect(() => {
        if (hasSearched) {
            setShowSuggestions(false);
        }
    }, [hasSearched]);

    return (
        <div ref={wrapperRef} className={styles.container}>
            <div className={styles.inputWrapper}>
                <input
                    ref={inputRef}
                    type="text"
                    className={`input-field ${styles.searchInput}`}
                    placeholder="Search knowledge base..."
                    value={query}
                    onChange={(e) => {
                        const sanitized = sanitizeInput(e.target.value);
                        setQuery(sanitized);
                        setActiveIndex(-1);
                        setValidationError('');
                        setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    aria-label="Search knowledge base"
                    aria-autocomplete="list"
                    aria-controls="search-suggestions"
                    maxLength={500}
                />

                <Search
                    size={18}
                    color="var(--text-secondary)"
                    className={styles.searchIcon}
                />

                <div className={styles.searchActions}>
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className={`btn-ghost ${styles.clearButton}`}
                        >
                            <X size={18} />
                        </button>
                    )}
                    <button
                        className={`btn-primary ${styles.searchButton}`}
                        onClick={() => handleSubmit(query)}
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Validation Error */}
            {validationError && (
                <div className={styles.validationError}>
                    {validationError}
                </div>
            )}

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && query.length > 1 && showSuggestions && (
                <div id="search-suggestions" role="listbox" className={`card-panel ${styles.suggestionsDropdown}`}>
                    {suggestions.map((item, idx) => (
                        <div
                            key={item.id}
                            role="option"
                            aria-selected={idx === activeIndex}
                            onClick={() => {
                                setQuery(item.title);
                                handleSubmit(item.title);
                            }}
                            className={`${styles.suggestionItem} ${idx === activeIndex ? styles.suggestionItemActive : ''}`}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onMouseLeave={() => setActiveIndex(-1)}
                        >
                            <Search size={16} color="var(--text-secondary)" />
                            <span className={styles.suggestionText}>
                                {item.title}
                            </span>
                            <span className={`badge ${styles.suggestionBadge}`}>
                                {item.category}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
