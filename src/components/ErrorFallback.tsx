import React, { ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import styles from './ErrorFallback.module.css';

interface ErrorFallbackProps {
    error: Error | null;
    errorInfo: ErrorInfo | null;
    onReset: () => void;
}

/**
 * Fallback UI displayed when an error is caught by ErrorBoundary
 */
const ErrorFallback = ({ error, errorInfo, onReset }: ErrorFallbackProps) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <AlertCircle size={48} color="#c00" />
            </div>

            <h2 className={styles.title}>
                Something went wrong
            </h2>

            <p className={styles.description}>
                We're sorry, but something unexpected happened. Please try refreshing the page
                or contact support if the problem persists.
            </p>

            <div className={styles.buttonGroup}>
                <button
                    onClick={onReset}
                    className={`btn-primary ${styles.tryAgainButton}`}
                >
                    <RefreshCw size={16} />
                    Try Again
                </button>

                <button
                    onClick={handleReload}
                    className={`btn-ghost ${styles.reloadButton}`}
                >
                    Reload Page
                </button>
            </div>

            {/* Show error details in development only */}
            {isDevelopment && error && (
                <details className={styles.errorDetails}>
                    <summary className={styles.errorSummary}>
                        Error Details (Development Only)
                    </summary>

                    <div className={styles.errorContent}>
                        <div className={styles.errorSection}>
                            <strong className={styles.errorLabel}>Error:</strong>
                            <pre className={styles.errorPre}>
                                {error.toString()}
                            </pre>
                        </div>

                        {errorInfo && errorInfo.componentStack && (
                            <div>
                                <strong className={styles.errorLabel}>Component Stack:</strong>
                                <pre className={styles.stackPre}>
                                    {errorInfo.componentStack}
                                </pre>
                            </div>
                        )}
                    </div>
                </details>
            )}
        </div>
    );
};

export default ErrorFallback;
