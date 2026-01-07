import React from 'react';
import { Lightbulb, ChevronRight } from 'lucide-react';
import { useSearchQuery } from '../context/SearchProvider';
import styles from './DemoQueries.module.css';

const DEMO_QUERIES = [
    {
        id: 'confident',
        label: 'Account Question',
        query: 'How do I reset my account password?',
        useCase: 'AI-Answer has context of the customer seeing support, change the customer to see the difference.'
    },
    {
        id: 'technical',
        label: 'Technical Question',
        query: 'My mobile app keeps crashing',
        useCase: 'Shows AI-generated troubleshooting steps for technical issues with relevant article citations.'
    },
    {
        id: 'billing',
        label: 'Billing Question',
        query: 'How do I update my payment method?',
        useCase: 'Demonstrates billing-related queries with step-by-step guidance for payment management.'
    },
    {
        id: 'rbac',
        label: 'RBAC Filtering (Security)',
        query: 'What are the enterprise security policies?',
        useCase: 'Compare results between "Support Agent" and "Admin" roles to see permission-based filtering.'
    },
    {
        id: 'pagination',
        label: 'Result Pagination',
        query: 'account',
        useCase: 'Demonstrates "Load More" pagination with 10+ results. Shows initial 10 articles with a button to load more.'
    },
    {
        id: 'insufficient',
        label: 'Insufficient Data',
        query: 'What is the current stock price of Apple?',
        useCase: 'Shows fallback to keyword search when AI lacks sufficient information to generate a confident answer.'
    }
];

const DemoQueries = () => {
    // Optimized: Only subscribe to query context for demo actions
    const { runDemoQuery } = useSearchQuery();
    return (
        <div className={`demo-queries-section ${styles.container}`}>
            <div className={styles.header}>
                <div className={styles.iconWrapper}>
                    <Lightbulb size={20} color="#f59e0b" />
                </div>
                <h3 className={styles.title}>
                    Demo Use Cases - Select one to try
                </h3>
            </div>

            <div className={styles.grid}>
                {DEMO_QUERIES.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => runDemoQuery(item.query)}
                        className={styles.queryCard}
                    >
                        <div className={styles.queryCardHeader}>
                            <span className={styles.queryLabel}>
                                {item.label}
                            </span>
                            <ChevronRight size={14} color="var(--text-secondary)" />
                        </div>
                        <div className={styles.queryText}>
                            "{item.query}"
                        </div>
                        <div className={styles.queryDescription}>
                            {item.useCase}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DemoQueries;
