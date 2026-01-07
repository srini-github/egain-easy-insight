import React from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, XCircle, Edit3, Check } from 'lucide-react';
import ConfidenceMeter from './ConfidenceMeter';
import styles from './AIAnswerPanel.module.css';

/**
 * AIAnswerLowConfidence - Low confidence state display
 * Shows insufficient info warning and suggestion mechanism
 */
type AIAnswerLowConfidenceProps = {
    confidence: number;
    onFeedback?: (type: string, reason: string | null, text: string) => void;
};

const AIAnswerLowConfidence = ({ confidence, onFeedback }: AIAnswerLowConfidenceProps) => {
    const [showSuggestModal, setShowSuggestModal] = React.useState(false);
    const [suggestText, setSuggestText] = React.useState('');
    const [suggestionSubmitted, setSuggestionSubmitted] = React.useState(false);

    const handleSuggestSubmit = () => {
        if (suggestText.trim()) {
            onFeedback && onFeedback('suggest', 'insufficient_info', suggestText);
            setShowSuggestModal(false);
            setSuggestText('');
            setSuggestionSubmitted(true);
        }
    };

    return (
        <>
            <div className={`card-panel ${styles.lowConfidenceContainer}`}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div
                            data-tooltip="This is an AI-generated summary synthesized from your knowledge base."
                            className={styles.aiBadge}
                        >
                            <Sparkles size={14} />
                            AI Answer
                        </div>

                        <span
                            data-tooltip="Insufficient Information: The AI could not generate a confident answer for this query."
                            className={styles.insufficientBadge}
                        >
                            <XCircle size={12} />
                            Insufficient Info
                        </span>
                    </div>

                    <div className={styles.headerRight}>
                        <ConfidenceMeter confidence={confidence} />
                    </div>
                </div>

                {/* Agent Action Guidance */}
                <div className={styles.agentGuidance}>
                    <XCircle size={16} />
                    <span><strong>AI unable to generate a confident answer</strong> — Please review the search results below or try a more specific query.</span>
                </div>

                {/* Suggest Improvement */}
                <div className={styles.suggestContainer}>
                    {suggestionSubmitted ? (
                        <div className={styles.suggestionSubmitted}>
                            <Check size={14} />
                            Suggestion submitted
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowSuggestModal(true)}
                            className={`btn-ghost ${styles.suggestButton}`}
                            data-tooltip="Suggest an improvement to this answer for review"
                        >
                            <Edit3 size={16} />
                            <span className={styles.suggestButtonText}>Suggest an improvement</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Suggest Improvement Modal */}
            {showSuggestModal && createPortal(
                <div
                    className={styles.modalOverlay}
                    onClick={() => setShowSuggestModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={styles.modalContent}
                    >
                        <h3 className={styles.modalTitle}>Suggest an improvement</h3>
                        <p className={styles.modalDescription}>
                            Your suggestion will be reviewed by the knowledge management team before being published.
                        </p>

                        <textarea
                            value={suggestText}
                            onChange={(e) => setSuggestText(e.target.value)}
                            placeholder="Type your suggested answer or improvement here..."
                            className={styles.modalTextarea}
                        />

                        <div className={styles.modalActions}>
                            <button className="btn-ghost" onClick={() => setShowSuggestModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSuggestSubmit}
                                disabled={!suggestText.trim()}
                                style={{ opacity: suggestText.trim() ? 1 : 0.5 }}
                            >
                                Send Suggestion
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default AIAnswerLowConfidence;
