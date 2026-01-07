import { Check, RefreshCw } from 'lucide-react';
import './IntentPanel.css';

/**
 * Intent Detection Panel - Shows detected intent with confidence
 * Matches eGain's intent UI with chips and confirmation button
 */
const IntentPanel = ({ query, confidence, onConfirm, isConfirmed }) => {
    // Extract intent from query
    const detectIntent = (q) => {
        const lower = q.toLowerCase();
        if (lower.includes('password') || lower.includes('reset')) {
            return { category: 'Account Support', action: 'Password Reset' };
        }
        if (lower.includes('mobile') || lower.includes('app') || lower.includes('crash')) {
            return { category: 'Technical', action: 'Troubleshooting' };
        }
        if (lower.includes('payment') || lower.includes('billing') || lower.includes('invoice')) {
            return { category: 'Billing', action: 'Payment Management' };
        }
        if (lower.includes('outlook') || lower.includes('sync')) {
            return { category: 'Technical', action: 'Integration Help' };
        }
        if (lower.includes('security') || lower.includes('policy')) {
            return { category: 'Security', action: 'Policy Inquiry' };
        }
        if (lower.includes('stock') || lower.includes('price') || lower.includes('market')) {
            return { category: 'General', action: 'Information Request' };
        }
        return { category: 'General', action: 'Knowledge Query' };
    };

    const intent = detectIntent(query);

    return (
        <div className="intent-panel">
            <div className="intent-content">
                <span className="intent-label">
                    INTENT
                </span>

                <div className="intent-chips">
                    <span className="chip">
                        {intent.category}
                    </span>

                    <span className="chip-separator">›</span>

                    <span className="chip">
                        {intent.action}
                    </span>

                    <span className={`confidence-chip ${confidence >= 85 ? 'confidence-high' : 'confidence-medium'}`}>
                        {confidence}%
                    </span>
                </div>
            </div>

            <div className="intent-actions">
                {isConfirmed ? (
                    <span className="confirmed-badge">
                        <Check size={14} />
                        Confirmed
                    </span>
                ) : (
                    <button
                        onClick={onConfirm}
                        className="confirm-button"
                    >
                        Confirm
                    </button>
                )}
                <button className="refresh-button">
                    <RefreshCw size={16} />
                </button>
            </div>
        </div>
    );
};

export default IntentPanel;
