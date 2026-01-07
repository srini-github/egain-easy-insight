import { AIAnswerSkeleton } from './LoadingSkeleton';
import AIAnswerError from './AIAnswerError';
import AIAnswerLowConfidence from './AIAnswerLowConfidence';
import AIAnswerFull from './AIAnswerFull';

/**
 * AI Answer Panel - Orchestrates AI response display
 * Delegates to sub-components based on state: loading, error, low-confidence, or full response
 */
const AIAnswerPanel = ({
    aiResponse,
    aiLoading,
    aiError,
    aiAvailable,
    permissions,
    onCitationClick,
    onFeedback,
    onRetry,
    query,
    onRelatedQuestionClick
}) => {

    // Loading state
    if (aiLoading) {
        return <AIAnswerSkeleton />;
    }

    // Error / AI unavailable state
    if (aiError || !aiAvailable) {
        return (
            <AIAnswerError
                aiError={aiError}
                aiAvailable={aiAvailable}
                onRetry={onRetry}
            />
        );
    }

    // No response yet
    if (!aiResponse) return null;

    // Low confidence warning
    if (!aiResponse.isConfident) {
        return (
            <AIAnswerLowConfidence
                confidence={aiResponse.confidence}
                onFeedback={onFeedback}
            />
        );
    }

    // Full AI response
    return (
        <AIAnswerFull
            aiResponse={aiResponse}
            query={query}
            permissions={permissions}
            onCitationClick={onCitationClick}
            onFeedback={onFeedback}
            onRelatedQuestionClick={onRelatedQuestionClick}
        />
    );
};

export default AIAnswerPanel;
