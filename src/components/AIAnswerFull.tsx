import React from 'react';
import { Sparkles } from 'lucide-react';
import CitationList from './CitationList';
import FeedbackPanel from './FeedbackPanel';
import IntentPanel from './IntentPanel';
import RelatedQuestions from './RelatedQuestions';
import { useCustomer } from '../context/CustomerProvider';
import styles from './AIAnswerPanel.module.css';

/**
 * AIAnswerFull - Full confident AI answer display
 * Shows personalized greeting, answer, citations, and feedback controls
 */
type AIAnswerFullProps = {
    aiResponse: {
        answer: string;
        confidence: number;
        citations: Array<{ id: string; title: string; snippet: string }>;
    };
    query: string;
    permissions: any;
    onCitationClick: (articleId: string) => void;
    onFeedback?: (type: string, reason: string | null, text: string) => void;
    onRelatedQuestionClick?: (question: string) => void;
};

const AIAnswerFull = ({
    aiResponse,
    query,
    permissions,
    onCitationClick,
    onFeedback,
    onRelatedQuestionClick
}: AIAnswerFullProps) => {
    const { currentCustomer } = useCustomer();
    const [isEditing, setIsEditing] = React.useState(false);
    const [editedText, setEditedText] = React.useState('');
    const [hasBeenEdited, setHasBeenEdited] = React.useState(false);
    const [intentConfirmed, setIntentConfirmed] = React.useState(false);

    // Generate personalized greeting based on customer context
    const getPersonalizedGreeting = () => {
        const firstName = currentCustomer.name.split(' ')[0];
        const tierGreeting = currentCustomer.tier === 'Premier Banking'
            ? `As a ${currentCustomer.tier} customer, ${firstName} has access to:`
            : currentCustomer.tier === 'Private Client'
            ? `For our ${currentCustomer.tier} member ${firstName}:`
            : currentCustomer.tier === 'Business Banking'
            ? `For ${currentCustomer.name}'s business account:`
            : `For ${firstName}:`;
        return tierGreeting;
    };

    const startEditing = () => {
        setEditedText(aiResponse.answer);
        setIsEditing(true);
    };

    const handleSave = () => {
        if (editedText.trim()) {
            onFeedback && onFeedback('edited', null, editedText);
            setIsEditing(false);
            setHasBeenEdited(true);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    return (
        <div className={`card-panel ${styles.responseContainer}`}>
            {/* AI Answer Section - Icon at top-left for entire section */}
            <div className={styles.responseLayout}>
                {/* AI Icon - positioned at top-left of entire section */}
                <div className={styles.aiIcon}>
                    <Sparkles size={14} color="var(--primary-color)" />
                </div>

                {/* Content container */}
                <div className={styles.contentContainer}>
                    {/* Intent Detection Panel */}
                    {query && (
                        <IntentPanel
                            query={query}
                            confidence={aiResponse.confidence}
                            onConfirm={() => setIntentConfirmed(true)}
                            isConfirmed={intentConfirmed}
                        />
                    )}

                    {/* AI Answer */}
                    <div className={styles.answerSection}>
                        <div className={styles.answerBox}>
                            {isEditing ? (
                                <textarea
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    className={styles.editTextarea}
                                    autoFocus
                                />
                            ) : (
                                <>
                                    {/* Personalized Greeting */}
                                    <div className={styles.greeting}>
                                        {getPersonalizedGreeting()}
                                    </div>
                                    <p className={styles.answerText}>
                                        {hasBeenEdited ? editedText : aiResponse.answer}
                                    </p>

                                    {/* Related Questions / Follow-up Queries */}
                                    {onRelatedQuestionClick && (
                                        <RelatedQuestions
                                            query={query}
                                            onQuestionClick={onRelatedQuestionClick}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Citations */}
                    <div>
                        <CitationList citations={aiResponse.citations} onCitationClick={onCitationClick} />
                    </div>

                    {/* Feedback / Actions */}
                    <div className={styles.feedbackSection}>
                        {isEditing ? (
                            <div className={styles.editActions}>
                                <button
                                    className={`btn-ghost ${styles.editActionButton}`}
                                    onClick={handleCancel}
                                >
                                    Discard
                                </button>
                                <button
                                    className={`btn-primary ${styles.saveButton}`}
                                    onClick={handleSave}
                                >
                                    Save Improvement
                                </button>
                            </div>
                        ) : (
                            <FeedbackPanel
                                onFeedback={onFeedback}
                                onStartEdit={startEditing}
                                permissions={permissions}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAnswerFull;
