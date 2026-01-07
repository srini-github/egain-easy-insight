import { useState, useRef, useEffect } from 'react';
import { Phone, ChevronDown } from 'lucide-react';
import { useCustomer } from '../context/CustomerProvider';
import styles from './CustomerContext.module.css';

const CustomerContext = () => {
    const { currentCustomer, switchCustomer, allCustomers } = useCustomer();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelectCustomer = (customerId: string) => {
        switchCustomer(customerId);
        setIsOpen(false);
    };

    const tierColors: Record<string, string> = {
        'Premier Banking': '#0066CC',
        'Private Client': '#6B21A8',
        'Business Banking': '#047857'
    };

    return (
        <div className={styles.contextBar}>
            {/* Customer Selector */}
            <div className={styles.customerSection}>
                <span className={styles.sectionLabel}>
                    Customer
                </span>

                <div ref={dropdownRef} className={styles.dropdownContainer}>
                    <button onClick={() => setIsOpen(!isOpen)} className={styles.customerButton}>
                        <div
                            className={styles.avatar}
                            style={{ background: tierColors[currentCustomer.tier] || 'var(--primary-color)' }}
                        >
                            {currentCustomer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className={styles.customerName}>
                            <div className={styles.nameText}>
                                {currentCustomer.name}
                            </div>
                        </div>
                        <ChevronDown size={14} color="var(--text-secondary)" />
                    </button>

                    {isOpen && (
                        <div className={styles.dropdown}>
                            {allCustomers.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleSelectCustomer(c.id)}
                                    className={`${styles.dropdownItem} ${c.id === currentCustomer.id ? styles.active : ''}`}
                                >
                                    <div
                                        className={styles.dropdownAvatar}
                                        style={{ background: tierColors[c.tier] || 'var(--primary-color)' }}
                                    >
                                        {c.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div className={styles.dropdownName}>
                                            {c.name}
                                        </div>
                                        <div className={styles.dropdownTier}>
                                            {c.tier}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Account Info */}
            <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Account</span>
                    <div className={styles.infoValue}>{currentCustomer.accountNumber}</div>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Tier</span>
                    <div
                        className={styles.infoValue}
                        style={{ color: tierColors[currentCustomer.tier] || 'var(--text-primary)' }}
                    >
                        {currentCustomer.tier}
                    </div>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Phone</span>
                    <div className={`${styles.infoValue} ${styles.phoneValue}`}>
                        <Phone size={11} />
                        {currentCustomer.phone}
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className={styles.divider} />

            {/* Current Issue */}
            <div className={`${styles.infoItem} ${styles.reasonSection}`}>
                <span className={styles.infoLabel}>Reason for Call</span>
                <div className={styles.infoValue}>
                    {currentCustomer.recentIssue}
                </div>
            </div>
        </div>
    );
};

export default CustomerContext;
