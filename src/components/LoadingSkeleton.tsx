import styles from './LoadingSkeleton.module.css';

/**
 * Loading skeleton component for better perceived performance
 * Shows placeholder UI while content is loading
 */

export const ArticleCardSkeleton = () => {
    return (
        <div className={`card-panel ${styles.articleCardContainer}`}>
            {/* Title skeleton */}
            <div className={`${styles.skeletonBar} ${styles.titleSkeleton}`} />

            {/* Content skeleton lines */}
            <div className={`${styles.skeletonBar} ${styles.contentLine} ${styles.contentLine1}`} />
            <div className={`${styles.skeletonBar} ${styles.contentLine} ${styles.contentLine2}`} />

            {/* Footer skeleton */}
            <div className={styles.footerContainer}>
                <div className={`${styles.skeletonBar} ${styles.footerItem} ${styles.footerItem1}`} />
                <div className={`${styles.skeletonBar} ${styles.footerItem} ${styles.footerItem2}`} />
                <div className={`${styles.skeletonBar} ${styles.footerItem} ${styles.footerItem3}`} />
            </div>
        </div>
    );
};

export const AIAnswerSkeleton = () => {
    return (
        <div className={`card-panel ${styles.aiAnswerContainer}`}>
            {/* Header skeleton */}
            <div className={styles.headerContainer}>
                <div className={`${styles.skeletonBar} ${styles.aiIconSkeleton}`} />
                <div className={`${styles.skeletonBar} ${styles.aiBadgeSkeleton}`} />
            </div>

            {/* Content skeleton */}
            <div className={`${styles.skeletonBar} ${styles.aiContentLine} ${styles.aiContentLine1}`} />
            <div className={`${styles.skeletonBar} ${styles.aiContentLine} ${styles.aiContentLine2}`} />
            <div className={`${styles.skeletonBar} ${styles.aiContentLine} ${styles.aiContentLine3}`} />
        </div>
    );
};

export const SearchResultsSkeleton = ({ count = 3 }: { count?: number }) => {
    return (
        <div>
            {Array.from({ length: count }).map((_, index) => (
                <ArticleCardSkeleton key={index} />
            ))}
        </div>
    );
};
