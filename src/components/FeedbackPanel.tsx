import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ThumbsUp, ThumbsDown, Edit3, Check } from 'lucide-react';
import styles from './FeedbackPanel.module.css';

/**
 * Enhanced feedback panel for AI responses
 * Includes thumbs up/down, and inline edit trigger
 */
const FeedbackPanel = ({ onFeedback, onStartEdit, permissions, compact = false }) => {
    const [feedbackGiven, setFeedbackGiven] = useState(null);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [showSuggestModal, setShowSuggestModal] = useState(false);
    const [suggestText, setSuggestText] = useState('');
    const [selectedReason, setSelectedReason] = useState('');

    const reasons = [
        'Answer was incorrect',
        'Missing important information',
        'Outdated information',
        'Too vague / not specific',
        'Sources do not support answer',
        'Other'
    ];

    const handleThumbsUp = () => {
        setFeedbackGiven('helpful');
        onFeedback && onFeedback('helpful');
    };

    const handleThumbsDown = () => {
        setShowReasonModal(true);
    };

    const submitNegativeFeedback = () => {
        setFeedbackGiven('not_helpful');
        onFeedback && onFeedback('not_helpful', selectedReason);
        setShowReasonModal(false);
        setSelectedReason('');
    };

    const handleSuggestSubmit = () => {
        if (suggestText.trim()) {
            setFeedbackGiven('suggested');
            onFeedback && onFeedback('suggested', null, suggestText);
            setShowSuggestModal(false);
            setSuggestText('');
        }
    };

    if (feedbackGiven) {
        return (
            <div
                className={`${styles.feedbackGiven} ${compact ? styles.feedbackGivenCompact : styles.feedbackGivenNormal} ${feedbackGiven === 'helpful' ? styles.feedbackHelpful : styles.feedbackNotHelpful}`}
            >
                <Check size={16} />
                <span>
                    {feedbackGiven === 'helpful' && 'Thanks for your feedback!'}
                    {feedbackGiven === 'not_helpful' && 'Feedback recorded. We\'ll improve!'}
                    {feedbackGiven === 'edited' && 'Your edit has been submitted.'}
                    {feedbackGiven === 'suggested' && 'Your suggestion has been sent for review.'}
                </span>
            </div>
        );
    }

    return (
        <>
            <div className={`${styles.feedbackContainer} ${compact ? styles.feedbackContainerCompact : styles.feedbackContainerNormal}`}>
                <span className={styles.feedbackLabel}>
                    Was this helpful?
                </span>

                <div className={styles.buttonGroup}>
                    <button
                        onClick={handleThumbsUp}
                        className={`btn-ghost ${styles.feedbackButton}`}
                        data-tooltip="Mark this answer as helpful"
                    >
                        <ThumbsUp size={16} />
                        {!compact && <span className={styles.buttonText}>Yes</span>}
                    </button>

                    <button
                        onClick={handleThumbsDown}
                        className={`btn-ghost ${styles.feedbackButton}`}
                        data-tooltip="Mark this answer as incorrect or not helpful"
                    >
                        <ThumbsDown size={16} />
                        {!compact && <span className={styles.buttonText}>No</span>}
                    </button>
                </div>

                <div className={styles.divider} />

                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowSuggestModal(true);
                    }}
                    className={`btn-ghost ${styles.feedbackButton}`}
                    data-tooltip="Suggest an improvement to this answer for review"
                >
                    <Edit3 size={16} />
                    {!compact && <span className={styles.buttonText}>Suggest an improvement</span>}
                </button>
            </div>

            {/* Reason Modal (Keep for thumbs down) */}
            {showReasonModal && createPortal(
                <div
                    className={styles.modalOverlay}
                    onClick={() => setShowReasonModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`${styles.modalContent} ${styles.modalContentSmall}`}
                    >
                        <h3 className={styles.modalTitle}>What was wrong?</h3>

                        <div className={styles.reasonList}>
                            {reasons.map((reason) => (
                                <label
                                    key={reason}
                                    className={`${styles.reasonOption} ${selectedReason === reason ? styles.reasonOptionSelected : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                    />
                                    <span className={styles.reasonText}>{reason}</span>
                                </label>
                            ))}
                        </div>

                        <div className={styles.modalActions}>
                            <button className="btn-ghost" onClick={() => setShowReasonModal(false)}>
                                Cancel
                            </button>
                            <button
                                className={`btn-primary ${selectedReason ? styles.buttonEnabled : styles.buttonDisabled}`}
                                onClick={submitNegativeFeedback}
                                disabled={!selectedReason}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Suggestion Modal (All user levels) */}
            {showSuggestModal && createPortal(
                <div
                    className={styles.modalOverlay}
                    onClick={() => setShowSuggestModal(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`${styles.modalContent} ${styles.modalContentMedium}`}
                    >
                        <h3 className={styles.modalTitle}>Suggest an improvement</h3>
                        <p className={styles.modalDescription}>
                            Your suggestion will be reviewed by the knowledge management team before being published.
                        </p>

                        <textarea
                            value={suggestText}
                            onChange={(e) => setSuggestText(e.target.value)}
                            placeholder="Type your improved answer here..."
                            className={styles.suggestionTextarea}
                        />

                        <div className={styles.modalActions}>
                            <button className="btn-ghost" onClick={() => setShowSuggestModal(false)}>
                                Cancel
                            </button>
                            <button
                                className={`btn-primary ${suggestText.trim() ? styles.buttonEnabled : styles.buttonDisabled}`}
                                onClick={handleSuggestSubmit}
                                disabled={!suggestText.trim()}
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

export default FeedbackPanel;
