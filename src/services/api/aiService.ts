/**
 * AI Service Adapter
 * Simulates RAG-based AI responses until the real API is available
 */

// API Mock. Todo: Remove local MOCK_ARTICLES dependency once responses come from the backend.
import { MOCK_ARTICLES } from '../../data/mockArticles';
import { getCurrentUser, getCurrentEndCustomer } from '../../data/mockRBAC';
import { withTimeout, NetworkError, NetworkErrorType } from '../../utils/networkUtils';

// Simulated AI answer templates based on query patterns
// Now functions that accept customer context for personalization
const ANSWER_TEMPLATES = {
    password: (customer) => {
        const isPremier = customer.tier === 'Premier Banking';
        const isPrivate = customer.tier === 'Private Client';
        if (isPremier || isPrivate) {
            return `To reset the password, navigate to Settings > Security > Password Reset. Click 'Reset Password' and follow the email verification process. ${isPremier ? 'As a Premier customer, you also have the option to contact your dedicated relationship manager for immediate assistance.' : 'For Private Client members, our concierge team is available 24/7 for password assistance.'} The new password must be at least 8 characters with one uppercase letter and one number.`;
        }
        return "To reset your password, navigate to Settings > Security > Password Reset. Click 'Reset Password' and follow the email verification process. For security, the new password must be at least 8 characters with one uppercase letter and one number.";
    },
    account: (customer) => {
        return `Account-related issues can be resolved through the Account Management portal. Common solutions include verifying email, clearing browser cache, or contacting support for locked accounts. ${customer.tier === 'Business Banking' ? 'For business accounts, additional verification steps may be required for security compliance.' : ''}`;
    },
    billing: (customer) => {
        const isPremier = customer.tier === 'Premier Banking' || customer.tier === 'Private Client';
        return `For billing inquiries, access your Billing Dashboard to view invoices, update payment methods, or dispute charges. ${isPremier ? 'Premium tier customers receive priority processing with refunds typically completed within 2-3 business days.' : 'Refund requests typically process within 5-7 business days.'}`;
    },
    technical: (customer) => {
        return "Technical issues often relate to browser compatibility or network settings. Try clearing cache, disabling extensions, or using an incognito window. If the issue persists, check our system status page.";
    },
    mobile: (customer) => {
        const isPremier = customer.tier === 'Premier Banking' || customer.tier === 'Private Client';
        return `To resolve mobile app crashes, start by ensuring you have the latest app version installed. Clear the app cache and restart your device. For iOS: Force quit the app by swiping up from the app switcher, then reopen. For Android: Go to Settings > Apps > [App Name] > Clear Cache. If crashes persist, try uninstalling and reinstalling the app. ${isPremier ? 'Premium tier customers can contact our dedicated mobile support team at 1-800-PREMIUM for immediate assistance.' : 'For persistent issues, contact our support team.'} Ensure your device has sufficient storage and is running a compatible OS version.`;
    },
    outlook: (customer) => {
        return "To sync with Outlook, open the Outlook desktop app, go to File > Add Account. Enter your company email and select 'Exchange' as the account type. Note that this integration is managed by your IT department and might require additional plugins.";
    },
    security: (customer) => {
        return "Enterprise security policies outline how privileged data is handled, how admin access reviews are performed, and when incidents must be escalated. Always follow the least-privilege principle and reference the approved policy library for the latest controls.";
    },
    market: (customer) => {
        return "Live market data is not stored within the knowledge base for compliance reasons. Reference the approved financial data providers listed in the knowledge article for real-time stock quotes.";
    },
    default: (customer) => {
        return "Based on the available knowledge base articles, here is a synthesized answer to your query. Please review the cited sources for detailed information and step-by-step instructions.";
    }
};

const DEMO_SCENARIOS = {
    'how do i reset my account password?': {
        answerTemplate: 'password',
        confidence: 92
    },
    'my mobile app keeps crashing': {
        answerTemplate: 'mobile',
        confidence: 94
    },
    'how do i update my payment method?': {
        answerTemplate: 'billing',
        confidence: 93
    },
    'what are the enterprise security policies?': {
        answerTemplate: 'security',
        confidence: 90
    },
    'what is the current stock price of apple?': {
        answerTemplate: 'market',
        confidence: 60  // Below 80% threshold - triggers "Insufficient Info" state
    }
};

// Simulate network failures for AI service
const simulateAINetworkFailure = () => {
    // 3% chance of network error for testing resilience
    if (Math.random() < 0.03) {
        throw new NetworkError(
            'AI service network error',
            NetworkErrorType.NETWORK_ERROR,
            true
        );
    }
    // 2% chance of service unavailable for testing
    if (Math.random() < 0.02) {
        throw new Error('AI_SERVICE_UNAVAILABLE');
    }
};

// API Mock. Todo: Replace with actual API call as POST /api/ai/answer (body: { query, articles }).
// Generate mock AI response
export const generateAIResponse = async (query, articles) => {
    // Timeout: 15 seconds for AI generation (longer than regular search)
    const AI_GENERATION_TIMEOUT_MS = 15000;

    const performAIGeneration = async () => {
        const queryLower = query.toLowerCase();
        const demoScenario = DEMO_SCENARIOS[queryLower];
        const currentUser = getCurrentUser();
        const currentCustomer = getCurrentEndCustomer();

        // Simulate potential network/service failure
        simulateAINetworkFailure();

        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    let answerKey = demoScenario?.answerTemplate ?? 'default';

    if (!demoScenario) {
        if (queryLower.includes('password') || queryLower.includes('reset')) {
            answerKey = 'password';
        } else if (queryLower.includes('mobile') || queryLower.includes('app crash') || queryLower.includes('crashing')) {
            answerKey = 'mobile';
        } else if (queryLower.includes('account') || queryLower.includes('login')) {
            answerKey = 'account';
        } else if (queryLower.includes('billing') || queryLower.includes('payment')) {
            answerKey = 'billing';
        } else if (queryLower.includes('outlook') || queryLower.includes('sync')) {
            answerKey = 'outlook';
        } else if (queryLower.includes('error') || queryLower.includes('issue') || queryLower.includes('problem')) {
            answerKey = 'technical';
        }
    }

    // Call template function with customer context for personalization
    const templateFunc = ANSWER_TEMPLATES[answerKey] ?? ANSWER_TEMPLATES.default;
    let answerText = typeof templateFunc === 'function' ? templateFunc(currentCustomer) : templateFunc;

    let confidence = demoScenario?.confidence;

    if (confidence === undefined) {
        confidence = Math.floor(85 + Math.random() * 10); // Always confident for non-demo queries
    }

    const prioritizeSecurityCitations = (items, roleId) => {
        if (!items?.length || roleId !== 'knowledge_author') return items;
        const reordered = [...items];
        const idx = reordered.findIndex(article => article.id === '2003');
        if (idx <= 0) return reordered;
        const [target] = reordered.splice(idx, 1);
        reordered.unshift(target);
        return reordered;
    };

    const visibleIds = new Set(articles.map(article => article.id));

    let orderedArticles = articles;
    if (demoScenario?.answerTemplate === 'security') {
        orderedArticles = prioritizeSecurityCitations(articles, currentUser.role.id);
    }

    const relevantArticles = orderedArticles
        .filter(article => visibleIds.has(article.id))
        .slice(0, 3);
    const citations = relevantArticles.map((article) => ({
        id: article.id,
        title: article.title,
        content: article.content.substring(0, 150) + '...', // Matching 'content' field name from spec
        category: article.category // Added category to citation per spec
    }));

        // Determine if confidence is sufficient (increased from 70 to 80 per requirements)
        const isConfident = confidence >= 80;
        return {
            answer: answerText,
            confidence,
            isConfident,
            citations,
            generatedAt: new Date().toISOString(),
            queryContext: {
                originalQuery: query,
                normalized: queryLower,
                sessionScoped: true,
                permissionLevel: currentUser.role.id,
                redactedFields: ['ssn', 'creditCard'] // Mock context controls
            },
            guardrails: {
                passedSafetyCheck: true,
                policyCompliant: true,
                sourceVerified: true // All sources are verified
            }
        };
    };

    return withTimeout(performAIGeneration(), AI_GENERATION_TIMEOUT_MS);
};

// API Mock. Todo: Replace with actual API call as GET /api/permissions/me.
// Simulate permission check (RBAC)
export const checkPermissions = async () => {
    // Timeout: 3 seconds for permission checks
    const PERMISSIONS_TIMEOUT_MS = 3000;

    const performPermissionCheck = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));

        const user = getCurrentUser();
        return {
            userId: user.id,
            role: user.role.name,
            accessLevel: user.role.id,
            level: user.role.level,
            allowedCategories: user.role.allowedCategories,
            restrictedContent: user.role.restrictedTags.length > 0
        };
    };

    return withTimeout(performPermissionCheck(), PERMISSIONS_TIMEOUT_MS);
};

// API Mock. Todo: Replace with actual API call as POST /api/ai/feedback (body: { responseId, feedback }).
// Simulate feedback submission
export const submitFeedback = async (responseId, feedback) => {
    // Timeout: 5 seconds for feedback submission
    const FEEDBACK_TIMEOUT_MS = 5000;

    const performFeedbackSubmission = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));

        // feedback logged for demo; keep but do not spam console in production

        return {
            success: true,
            feedbackId: `fb-${Date.now()}`,
            message: 'Thank you for your feedback',
            responseId,
            received: feedback
        };
    };

    return withTimeout(performFeedbackSubmission(), FEEDBACK_TIMEOUT_MS);
};
