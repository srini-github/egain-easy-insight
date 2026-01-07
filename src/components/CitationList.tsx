import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';

/**
 * Citation list component for AI responses
 * Shows numbered sources with snippets
 */
const CitationList = ({ citations, onCitationClick }) => {
    if (!citations || citations.length === 0) return null;

    return (
        <div style={{ marginTop: '16px' }}>
            <div
                style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '8px'
                }}
            >
                Sources
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {citations.map((citation) => (
                    <div
                        key={citation.id}
                        onClick={() => onCitationClick && onCitationClick(citation.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '10px 12px',
                            background: '#f8fafc',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f1f5f9';
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f8fafc';
                            e.currentTarget.style.borderColor = 'var(--border-color)';
                        }}
                    >
                        {/* Citation content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginBottom: '4px'
                                }}
                            >
                                <FileText size={14} color="var(--primary-color)" />
                                <span
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    {citation.title}
                                </span>
                                <span className="tag" style={{ fontSize: '0.65rem', padding: '1px 6px', margin: 0 }}>
                                    {citation.category}
                                </span>
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--text-secondary)',
                                        fontFamily: 'monospace'
                                    }}
                                >
                                    ID: {citation.id}
                                </span>
                            </div>

                            <p
                                style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-secondary)',
                                    lineHeight: '1.4',
                                    margin: 0,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical'
                                }}
                            >
                                {citation.content}
                            </p>
                        </div>

                        {/* Link icon */}
                        <ExternalLink size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CitationList;
