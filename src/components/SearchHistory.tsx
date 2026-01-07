import React from 'react';
import { History, Search, Trash2, Clock } from 'lucide-react';
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

    return (
        <div className={`card-panel history-container ${styles.container}`}>
            <div className={styles.header}>
                <h5 className={styles.title}>
                    <History size={16} color="var(--text-secondary)" />
                    Search History
                </h5>
                {history.length > 0 && (
                    <button className={`btn-ghost ${styles.clearButton}`} onClick={clearHistory} title="Clear history">
                        <Trash2 size={16} />
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
                    <Clock size={40} strokeWidth={1} color="var(--text-secondary)" />
                    <p>No recent searches yet</p>
                </div>
            )}
        </div>
    );
};

export default SearchHistory;
