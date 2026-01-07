import { useState, useCallback, useRef } from 'react';
import { generateAIResponse, checkPermissions, submitFeedback } from '../services/api/aiService';
import { withRetry, classifyError, getErrorMessage, NetworkErrorType } from '../utils/networkUtils';

/**
 * Custom hook for AI-powered search functionality
 * Manages AI responses, confidence handling, and fallback logic
 */
export const useAISearch = () => {
    const [aiResponse, setAiResponse] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [aiAvailable, setAiAvailable] = useState(true);
    const [permissions, setPermissions] = useState(null);

    const responseIdRef = useRef(null);

    // Check user permissions on mount with retry
    const initializePermissions = useCallback(async () => {
        try {
            const perms = await withRetry(
                () => checkPermissions(),
                {
                    maxRetries: 2,
                    initialDelay: 500,
                    maxDelay: 2000,
                    backoffMultiplier: 2,
                    retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.NETWORK_ERROR]
                }
            );
            setPermissions(perms);
        } catch (err) {
            const networkError = classifyError(err as Error);
            console.error('Permission check failed:', networkError);
            // Set default permissions on failure
            setPermissions(null);
        }
    }, []);

    // Generate AI response for a query with retry logic
    const generateAnswer = useCallback(async (query, articles) => {
        if (!query || query.length < 2) {
            setAiResponse(null);
            return null;
        }

        setAiLoading(true);
        setAiError(null);

        try {
            // Retry AI generation (max 2 retries, AI can be flaky)
            const response = await withRetry(
                () => generateAIResponse(query, articles),
                {
                    maxRetries: 2,
                    initialDelay: 1000,
                    maxDelay: 5000,
                    backoffMultiplier: 2,
                    retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.NETWORK_ERROR, NetworkErrorType.SERVER_ERROR]
                }
            );

            responseIdRef.current = `resp-${Date.now()}`;

            setAiResponse({
                ...response,
                id: responseIdRef.current
            });
            setAiAvailable(true);

            return response;
        } catch (err: any) {
            console.error('AI generation failed:', err);

            // Handle specific AI service unavailable error
            if (err.message === 'AI_SERVICE_UNAVAILABLE') {
                setAiAvailable(false);
                setAiError('AI service temporarily unavailable. Showing keyword search results.');
            } else {
                // Classify and provide user-friendly error message
                const networkError = classifyError(err);
                const userMessage = getErrorMessage(networkError);
                setAiError(userMessage);
            }

            setAiResponse(null);
            return null;
        } finally {
            setAiLoading(false);
        }
    }, []);

    // Submit feedback for AI response with retry
    const sendFeedback = useCallback(async (type, reason = null, editedAnswer = null) => {
        if (!responseIdRef.current) return;

        try {
            // Retry feedback submission (max 1 retry, non-critical)
            const result = await withRetry(
                () => submitFeedback(responseIdRef.current, {
                    type, // 'helpful' | 'not_helpful' | 'edited' | 'reported'
                    reason,
                    editedAnswer,
                    timestamp: new Date().toISOString()
                }),
                {
                    maxRetries: 1,
                    initialDelay: 500,
                    maxDelay: 1000,
                    backoffMultiplier: 2,
                    retryableErrors: [NetworkErrorType.TIMEOUT, NetworkErrorType.NETWORK_ERROR]
                }
            );

            return result;
        } catch (err) {
            const networkError = classifyError(err as Error);
            console.error('Feedback submission failed:', networkError);
            return { success: false };
        }
    }, []);

    // Clear AI state
    const clearAIResponse = useCallback(() => {
        setAiResponse(null);
        setAiError(null);
        responseIdRef.current = null;
    }, []);

    // Retry AI generation after failure
    const retryAI = useCallback(async (query, articles) => {
        setAiAvailable(true);
        return generateAnswer(query, articles);
    }, [generateAnswer]);

    return {
        aiResponse,
        aiLoading,
        aiError,
        aiAvailable,
        permissions,
        generateAnswer,
        sendFeedback,
        clearAIResponse,
        retryAI,
        initializePermissions
    };
};

export default useAISearch;
