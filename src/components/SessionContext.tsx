import React from 'react';
import { Shield, Eye, Lock, User } from 'lucide-react';

/**
 * Session context display component
 * Shows permission level, redaction notices, and session scope
 */
const SessionContext = ({ context, permissions, compact = false }) => {
    if (!context && !permissions) return null;

    const getPermissionColor = (level) => {
        switch (level) {
            case 'admin': return '#6554c0';
            case 'agent': return 'var(--primary-color)';
            case 'standard': return '#36b37e';
            default: return 'var(--text-secondary)';
        }
    };

    if (compact) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                }}
            >
                <Shield size={12} />
                <span>{permissions?.role || 'Agent'}</span>
                {context?.sessionScoped && (
                    <>
                        <span>•</span>
                        <Lock size={12} />
                        <span>Session Scoped</span>
                    </>
                )}
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                background: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem'
            }}
        >
            {/* Permission level */}
            {permissions && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: 'white',
                        border: `1px solid ${getPermissionColor(permissions.accessLevel)}`
                    }}
                >
                    <User size={12} color={getPermissionColor(permissions.accessLevel)} />
                    <span style={{ fontWeight: 500, color: getPermissionColor(permissions.accessLevel) }}>
                        {permissions.role?.replace('_', ' ').toUpperCase() || 'AGENT'}
                    </span>
                </div>
            )}

            {/* Session scope */}
            {context?.sessionScoped && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                    <Lock size={12} />
                    <span>Session Scoped</span>
                </div>
            )}

            {/* Redacted fields notice */}
            {context?.redactedFields && context.redactedFields.length > 0 && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: '#fffae6',
                        color: '#ff991f'
                    }}
                >
                    <Eye size={12} />
                    <span style={{ fontSize: '0.75rem' }}>
                        {context.redactedFields.length} field(s) redacted
                    </span>
                </div>
            )}

            {/* Source verified badge */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: 'auto',
                    color: '#36b37e'
                }}
            >
                <Shield size={12} />
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Verified Sources</span>
            </div>
        </div>
    );
};

export default SessionContext;
