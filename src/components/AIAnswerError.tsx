import { AlertTriangle, RefreshCw } from 'lucide-react';
import styles from './AIAnswerPanel.module.css';

/**
 * AIAnswerError - Error state display for AI service
 * Shows error message and optional retry button
 */
type AIAnswerErrorProps = {
    aiError: string | null;
    aiAvailable: boolean;
    onRetry?: () => void;
};

const AIAnswerError = ({ aiError, aiAvailable, onRetry }: AIAnswerErrorProps) => {
    return (
        <div className={`card-panel ${styles.errorContainer}`}>
            <div className={styles.errorContent}>
                <AlertTriangle size={18} color="#ff991f" />
                <span className={styles.errorText}>
                    {aiError || 'AI service temporarily unavailable. Showing keyword search results.'}
                </span>
            </div>

            {onRetry && (
                <button
                    onClick={onRetry}
                    className={`btn-ghost ${styles.retryButton}`}
                >
                    <RefreshCw size={14} />
                    Retry
                </button>
            )}
        </div>
    );
};

export default AIAnswerError;
