import React from 'react';
import styles from './ConfidenceMeter.module.css';

/**
 * Visual confidence indicator for AI responses
 * Color-coded: Green (High), Yellow (Medium), Red (Low)
 */
const ConfidenceMeter = ({ confidence, showLabel = true }) => {
    const getConfidenceLevel = () => {
        if (confidence >= 85) return { level: 'High', color: '#36b37e', bgColor: '#e3fcef' };
        if (confidence >= 80) return { level: 'Medium', color: '#ff991f', bgColor: '#fffae6' };
        return { level: 'Low', color: '#de350b', bgColor: '#ffebe6' };
    };

    const { level, color, bgColor } = getConfidenceLevel();

    return (
        <div className={styles.container}>
            {/* Progress bar */}
            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{
                        width: `${confidence}%`,
                        background: color
                    }}
                />
            </div>

            {/* Badge */}
            <span
                data-tooltip="This score represents the AI's internal certainty based on source verification."
                className={styles.badge}
                style={{
                    background: bgColor,
                    color: color
                }}
            >
                {showLabel ? `${level} ${confidence}% CONFIDENCE` : `${confidence}% CONFIDENCE`}
            </span>
        </div>
    );
};

export default ConfidenceMeter;
