import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { useSearchFilters } from '../context/SearchProvider';
import { validateDateRange } from '../utils/validation';
import styles from './Filters.module.css';

const Filters = () => {
    // Optimized: Only subscribe to filters context, not entire search context
    const { filters, setFilters } = useSearchFilters();
    const categories = ['All', 'Account', 'Technical', 'Billing', 'Security', 'General'];
    const dateRanges = ['All', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'Last year'];
    const [dateError, setDateError] = useState('');

    const handleStartDateChange = (value) => {
        const normalized = value || null;
        const next = {
            ...filters,
            startDate: normalized,
            dateRange: normalized ? 'All' : filters.dateRange
        };
        if (normalized && next.endDate && new Date(next.endDate) < new Date(normalized)) {
            next.endDate = normalized;
        }

        // Validate date range
        const validation = validateDateRange(normalized, next.endDate);
        if (!validation.valid) {
            setDateError(validation.error || '');
            return;
        }

        setDateError('');
        setFilters(next);
    };

    const handleEndDateChange = (value) => {
        const normalized = value || null;
        const next = {
            ...filters,
            endDate: normalized,
            dateRange: normalized ? 'All' : filters.dateRange
        };
        if (normalized && next.startDate && new Date(normalized) < new Date(next.startDate)) {
            next.startDate = normalized;
        }

        // Validate date range
        const validation = validateDateRange(next.startDate, normalized);
        if (!validation.valid) {
            setDateError(validation.error || '');
            return;
        }

        setDateError('');
        setFilters(next);
    };

    return (
        <div className={`card-panel filters-container ${styles.container}`}>
            <div className={styles.section}>
                <h5 className={styles.sectionTitle}>
                    <Filter size={14} color="var(--text-secondary)" />
                    Categories
                </h5>
                <div className={styles.optionsGrid}>
                    {categories.map(cat => (
                        <label
                            key={cat}
                            className={`${styles.filterLabel} ${filters.category === cat ? styles.filterLabelActive : ''}`}
                        >
                            <input
                                type="radio"
                                name="category"
                                checked={filters.category === cat}
                                onChange={() => setFilters({ ...filters, category: cat })}
                                className={styles.filterRadio}
                            />
                            <span className={styles.filterText}>{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <h5 className={styles.sectionTitle}>
                    <Filter size={14} color="var(--text-secondary)" />
                    Date Range
                </h5>
                <div className={styles.optionsGrid}>
                    {dateRanges.map(range => (
                        <label
                            key={range}
                            className={`${styles.filterLabel} ${filters.dateRange === range ? styles.filterLabelActive : ''}`}
                        >
                            <input
                                type="radio"
                                name="dateRange"
                                checked={filters.dateRange === range}
                                onChange={() => setFilters({
                                    ...filters,
                                    dateRange: range,
                                    startDate: null,
                                    endDate: null
                                })}
                                className={styles.filterRadio}
                            />
                            <span className={styles.filterText}>{range}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className={styles.section}>
                <h5 className={styles.sectionTitle}>
                    <Filter size={14} color="var(--text-secondary)" />
                    Custom Dates
                </h5>
                <div className={styles.customDatesContainer}>
                    <label className={styles.dateLabel}>
                        Start Date
                        <input
                            type="date"
                            value={filters.startDate ?? ''}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className={`input-field ${styles.dateInput}`}
                            max={filters.endDate ?? undefined}
                        />
                    </label>
                    <label className={styles.dateLabel}>
                        End Date
                        <input
                            type="date"
                            value={filters.endDate ?? ''}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                            className={`input-field ${styles.dateInput}`}
                            min={filters.startDate ?? undefined}
                        />
                    </label>

                    {/* Date Validation Error */}
                    {dateError && (
                        <div className={styles.dateError}>
                            {dateError}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Filters;
