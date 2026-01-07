import { useState, useEffect, useRef } from 'react';
import { List } from 'react-window';
import ArticleCard from './ArticleCard';
import AIAnswerPanel from './AIAnswerPanel';
import { SearchX, Search, ChevronDown } from 'lucide-react';
import { useSearchQuery, useSearchFilters, useSearchResults, useSearchActions } from '../context/SearchProvider';
import { useAIContext } from '../context/AIProvider';
import { SearchResultsSkeleton, AIAnswerSkeleton } from './LoadingSkeleton';
import styles from './SearchResults.module.css';

const ARTICLE_CARD_HEIGHT = 200; // Approximate height of ArticleCard in pixels
const VIRTUAL_SCROLL_THRESHOLD = 50; // Use virtual scrolling when results > 50
const INITIAL_DISPLAY_COUNT = 10; // Initial number of results to show
const LOAD_MORE_COUNT = 10; // Number of results to load when "Load More" is clicked

const SearchResults = () => {
    // Optimized: Subscribe to specific contexts instead of entire search context
    const { query, submitSearch } = useSearchQuery();
    const { filters, sortBy, setSortBy } = useSearchFilters();
    const { results, isLoading, error } = useSearchResults();
    const { openArticle, openArticleById } = useSearchActions();
    const {
        aiResponse,
        aiLoading,
        aiError,
        aiAvailable,
        permissions,
        sendFeedback,
        handleRetry
    } = useAIContext();

    const [isFiltering, setIsFiltering] = useState(false);
    const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
    const prevFiltersRef = useRef(filters);
    const listRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(600);

    // Calculate container height based on viewport
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const availableHeight = window.innerHeight - rect.top - 100;
                setContainerHeight(Math.max(400, Math.min(800, availableHeight)));
            }
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // Reset scroll and display count when results change
    useEffect(() => {
        if (listRef.current?.element) {
            listRef.current.scrollToRow({ index: 0 });
        }
        setDisplayCount(INITIAL_DISPLAY_COUNT);
    }, [results.length, query, filters]);

    // Detect when filters change and trigger animation
    useEffect(() => {
        const prev = prevFiltersRef.current;
        const filtersChanged =
            prev.category !== filters.category ||
            prev.dateRange !== filters.dateRange ||
            prev.startDate !== filters.startDate ||
            prev.endDate !== filters.endDate;

        // Update ref for next comparison
        prevFiltersRef.current = filters;

        if (filtersChanged && !isLoading) {
            setIsFiltering(true);

            // Remove animation after it completes
            const timer = setTimeout(() => {
                setIsFiltering(false);
            }, 600);

            return () => clearTimeout(timer);
        }
    }, [filters, isLoading]);

    // Handle related question click - search for the new question
    const handleRelatedQuestionClick = (question: string) => {
        if (question && submitSearch) {
            submitSearch(question);
        }
    };

    // Virtual list row renderer
    const Row = ({ index, style, ariaAttributes }: any) => {
        const article = results[index];
        return (
            <div style={style} {...ariaAttributes}>
                <ArticleCard
                    article={article}
                    onClick={openArticle}
                />
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="animate-fade-in">
                {aiAvailable && <AIAnswerSkeleton />}
                <SearchResultsSkeleton count={5} />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p>{error}</p>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIconWrapper}>
                    <SearchX size={48} color="var(--text-secondary)" />
                </div>
                <h3 className={styles.emptyTitle}>No articles found</h3>
                <p className={styles.emptyDescription}>We couldn't find anything matching your search. Try different keywords or filters.</p>
            </div>
        );
    }

    const useVirtualScrolling = results.length > VIRTUAL_SCROLL_THRESHOLD;

    return (
        <div className="animate-fade-in results-container" ref={containerRef}>
            {/* AI Answer Panel - separate section for mobile ordering */}
            <div className="ai-answer-section">
                <AIAnswerPanel
                    aiResponse={aiResponse}
                    aiLoading={aiLoading}
                    aiError={aiError}
                    aiAvailable={aiAvailable}
                    permissions={permissions}
                    onCitationClick={openArticleById}
                    onFeedback={sendFeedback}
                    onRetry={handleRetry}
                    query={query}
                    onRelatedQuestionClick={handleRelatedQuestionClick}
                />
            </div>

            {/* Articles List Section - separate for mobile ordering */}
            <div className="articles-list-section">
            {/* Results header */}
            <div className={`${styles.resultsHeader} ${isFiltering ? styles.resultsHeaderFiltering : ''}`}>
                <div className={styles.resultsHeaderLeft}>
                    <Search size={16} color="var(--text-secondary)" />
                    <h4 className={styles.resultsTitle}>
                        {!aiAvailable ? 'Keyword Search Results' : 'Related Articles'}
                        <span className={`${styles.resultsCount} ${isFiltering ? styles.resultsCountFiltering : ''}`}>
                            ({results.length})
                        </span>
                    </h4>
                </div>
                <div className={styles.resultsHeaderRight}>
                    <span className={styles.sortLabel}>Sort by</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={`input-field ${styles.sortSelect}`}
                    >
                        <option value="relevance">Relevance</option>
                        <option value="date">Date (Newest)</option>
                        <option value="popularity">Popularity (Views)</option>
                    </select>
                </div>
            </div>

            {/* Article list - virtual scrolling for large result sets */}
            <div className={`${styles.articleList} ${isFiltering ? styles.articleListFiltering : ''}`}>
                {useVirtualScrolling ? (
                    <List
                        listRef={listRef}
                        rowComponent={Row}
                        rowCount={results.length}
                        rowHeight={ARTICLE_CARD_HEIGHT}
                        rowProps={{}}
                        style={{ height: containerHeight }}
                        overscanCount={3}
                    />
                ) : (
                    <div>
                        {results.slice(0, displayCount).map(article => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                onClick={openArticle}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Load More button for non-virtual scrolling */}
            {!useVirtualScrolling && results.length > displayCount && (
                <div className={styles.loadMoreContainer}>
                    <button
                        onClick={() => setDisplayCount(prev => prev + LOAD_MORE_COUNT)}
                        className={`btn-ghost ${styles.loadMoreButton}`}
                    >
                        <span>Show {Math.min(LOAD_MORE_COUNT, results.length - displayCount)} more</span>
                        <ChevronDown size={16} />
                    </button>
                </div>
            )}

            {/* Showing X of Y indicator */}
            {!useVirtualScrolling && results.length > INITIAL_DISPLAY_COUNT && (
                <div className={styles.resultCounter}>
                    Showing {Math.min(displayCount, results.length)} of {results.length} articles
                </div>
            )}

            {/* Performance indicator for virtual scrolling */}
            {useVirtualScrolling && (
                <div className={styles.virtualScrollIndicator}>
                    Virtual scrolling enabled for optimal performance ({results.length} results)
                </div>
            )}
            </div>
            {/* End articles-list-section */}
        </div>
    );
};
export default SearchResults;
