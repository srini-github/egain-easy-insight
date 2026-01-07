import React, { memo } from 'react';
import { Eye, FileText, CheckCircle, Clock } from 'lucide-react';
import type { KnowledgeArticle } from '../types/knowledge';
import styles from './ArticleCard.module.css';

type ArticleCardProps = {
    article: KnowledgeArticle;
    onClick: (_article: KnowledgeArticle) => void;
};

const ArticleCard = memo(({ article, onClick }: ArticleCardProps) => {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    return (
        <div className={`card-panel ${styles.card}`}
            role="button"
            tabIndex={0}
            aria-labelledby={`article-title-${article.id}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick(article);
                }
            }}
            onClick={() => onClick(article)}
        >
            <div className={styles.cardBody}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.iconWrapper}>
                            <FileText size={20} color="var(--primary-color)" />
                        </div>
                        <div>
                            <h3 id={`article-title-${article.id}`} className={styles.title}>
                                {article.title}
                            </h3>
                            <div className={styles.metadata}>
                                <span className={`badge ${styles.categoryBadge}`}>
                                    {article.category}
                                </span>
                                <span>•</span>
                                <span>ID: {article.id}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.relevanceScore}>
                        <div className={styles.scoreValue}>
                            {article.relevanceScore}%
                        </div>
                        <div className={styles.scoreLabel}>Match</div>
                    </div>
                </div>

                <p className={styles.content}>
                    {article.content}
                </p>

                <div className={styles.tags}>
                    {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className={styles.tag}>
                            #{tag}
                        </span>
                    ))}
                    {article.tags.length > 3 && <span className={styles.tagMore}>+{article.tags.length - 3} more</span>}
                </div>
            </div>

            <div className={styles.footer}>
                <div className={styles.footerLeft}>
                    <span className={styles.footerItem}>
                        <Clock size={14} /> {formatDate(article.lastUpdated)}
                    </span>
                    <span className={styles.footerItem}>
                        <Eye size={14} /> {article.viewCount.toLocaleString()}
                    </span>
                </div>
                <div className={styles.footerStatus}>
                    <CheckCircle size={14} /> Published
                </div>
            </div>
        </div>
    );
});

export default ArticleCard;
