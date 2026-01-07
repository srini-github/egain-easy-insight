import React, { useEffect, useRef } from 'react';
import { X, ThumbsUp, ThumbsDown, Share2, Printer, Clock, Eye, Edit3 } from 'lucide-react';
import { useAIContext } from '../context/AIProvider';

const ArticleModal = ({ article, onClose }) => {
    const modalRef = useRef(null);
    const { permissions } = useAIContext();
    const userLevel = permissions?.level ?? 1;
    const canEdit = userLevel >= 3;

    useEffect(() => {
        // Lock body scroll while modal is open
        if (article) {
            document.body.style.overflow = 'hidden';
            // Focus the modal for accessibility
            requestAnimationFrame(() => modalRef.current?.focus());
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [article]);

    if (!article) return null;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const handleEdit = () => {
        if (!article) return;
        alert(`Opening Article Editor for: ${article.title}`);
    };

    return (
        <>
            <div
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
                    zIndex: 99, opacity: article ? 1 : 0,
                    pointerEvents: article ? 'auto' : 'none',
                    transition: 'opacity 0.3s'
                }}
                onClick={onClose}
            />

            <div
                className="glass-panel"
                style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    width: '100%', maxWidth: '700px',
                    zIndex: 100, borderRadius: '20px 0 0 20px',
                    padding: '40px', overflowY: 'auto',
                    transform: article ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: '#ffffff',
                    boxShadow: '-10px 0 30px rgba(0,0,0,0.1)'
                }}
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                tabIndex={-1}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') onClose && onClose();
                }}
            >
                <button
                    className="btn-ghost"
                    style={{ position: 'absolute', top: '24px', right: '24px', padding: '8px', zIndex: 20 }}
                    onClick={onClose}
                >
                    <X size={24} />
                </button>

                {article && (
                    <div className="animate-fade-in">
                        {/* Header Row: Category/ID left, Relevance right */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', marginRight: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="tag" style={{ margin: 0 }}>{article.category}</span>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>ID: {article.id}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, color: article.relevanceScore > 80 ? 'var(--success)' : 'var(--text-primary)', fontSize: '1.1rem' }}>
                                    {article.relevanceScore}%
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Match</div>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '16px', lineHeight: 1.3, fontWeight: 700, color: 'var(--primary-color)' }}>
                            {article.title}
                        </h1>

                        {/* Meta Row: Updated | Views */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={16} /> Updated {formatDate(article.lastUpdated)}
                            </span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Eye size={16} /> {article.viewCount.toLocaleString()} views
                            </span>
                        </div>

                        <div style={{ lineHeight: '1.6', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '32px' }}>
                            <p style={{ whiteSpace: 'pre-line' }}>{article.content}</p>
                        </div>

                        {/* Tags */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
                            {article.tags.map(tag => (
                                <span key={tag} style={{ fontSize: '0.75rem', padding: '4px 12px', borderRadius: '16px', background: 'rgba(9, 30, 66, 0.04)', color: 'var(--text-secondary)' }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        <div style={{
                            borderTop: '1px solid rgba(0,0,0,0.1)',
                            paddingTop: '24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '16px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 500 }}>Was this helpful?</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button className="btn-ghost"><ThumbsUp size={20} /></button>
                                    <button className="btn-ghost"><ThumbsDown size={20} /></button>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {canEdit && (
                                    <button
                                        className="btn-primary"
                                        onClick={handleEdit}
                                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
                                    >
                                        <Edit3 size={16} />
                                        Edit Article
                                    </button>
                                )}
                                <button className="btn-ghost" title="Share"><Share2 size={20} /></button>
                                <button className="btn-ghost" title="Print"><Printer size={20} /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ArticleModal;
