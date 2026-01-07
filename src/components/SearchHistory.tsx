import React from 'react';
import { History, Search, Trash2 } from 'lucide-react';
import { useSearchQuery, useSearchActions } from '../context/SearchProvider';
import styles from './SearchHistory.module.css';

const SearchHistory = () => {
    // Optimized: Subscribe to specific contexts instead of entire search context
    const { selectHistoryTerm, hasSearched } = useSearchQuery();
    const { history, clearHistory } = useSearchActions();
    const [hasHadHistory, setHasHadHistory] = React.useState(false);

    // Track if there has ever been history (to keep header visible after clear)
    React.useEffect(() => {
        if (history.length > 0) {
            setHasHadHistory(true);
        }
    }, [history.length]);

    // Don't show until there's been at least one search
    if (!hasSearched && !hasHadHistory) return null;

    return (
        <div className={`glass-panel history-container ${styles.container}`}>
            <div className={styles.header}>
                <h4 className={styles.title}>
                    <History size={18} color="var(--accent-color)" />
                    Search History
                </h4>
                {history.length > 0 && (
                    <button className={`btn-ghost ${styles.clearButton}`} onClick={clearHistory} title="Clear history">
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {history.length > 0 ? (
                <ul className={styles.list}>
                    {history.map((term, index) => (
                        <li key={index} className={styles.listItem}>
                            <button
                                className={`btn-ghost ${styles.historyButton}`}
                                onClick={() => { void selectHistoryTerm(term); }}
                            >
                                <Search size={14} className={styles.searchIcon} />
                                {term}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className={styles.emptyState}>
                    No recent searches
                </div>
            )}
        </div>
    );
};

export default SearchHistory;
