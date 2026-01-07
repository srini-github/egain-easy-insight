import { User, Phone, Calendar, AlertCircle } from 'lucide-react';
import { useCustomer } from '../context/CustomerProvider';
import { getTenant } from '../data/mockRBAC';
import styles from './CustomerContextCard.module.css';

/**
 * Customer Context Card
 * Displays current customer information to provide context for AI answers
 */
const CustomerContextCard = () => {
    const { currentCustomer, switchCustomer, allCustomers } = useCustomer();
    const tenant = getTenant();

    // Determine tier class based on customer tier
    const getTierClass = (tier: string) => {
        if (tier === 'Premier Banking') return styles.tierPremier;
        if (tier === 'Private Client') return styles.tierPrivate;
        if (tier === 'Business Banking') return styles.tierBusiness;
        return styles.tierDefault;
    };

    return (
        <div className={styles.container}>
            {/* Header with Tenant Branding */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.tenantLogo}>{tenant.logo}</span>
                    <span className={styles.headerTitle}>
                        Customer Context
                    </span>
                </div>

                {/* Customer Switcher */}
                <select
                    value={currentCustomer.id}
                    onChange={(e) => switchCustomer(e.target.value)}
                    className={styles.customerSwitcher}
                >
                    {allCustomers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                            {customer.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Customer Details */}
            <div className={styles.detailsGrid}>
                {/* Customer Name & Account */}
                <div className={styles.customerInfo}>
                    <div className={styles.avatar}>
                        <User size={18} />
                    </div>
                    <div>
                        <div className={styles.customerName}>
                            {currentCustomer.name}
                        </div>
                        <div className={styles.accountNumber}>
                            Account {currentCustomer.accountNumber}
                        </div>
                    </div>
                </div>

                {/* Tier Badge */}
                <div className={styles.tierContainer}>
                    <div className={`${styles.tierBadge} ${getTierClass(currentCustomer.tier)}`}>
                        {currentCustomer.tier}
                    </div>
                </div>

                {/* Phone */}
                <div className={styles.infoItem}>
                    <Phone size={14} />
                    <span>{currentCustomer.phone}</span>
                </div>

                {/* Customer Since */}
                <div className={styles.infoItem}>
                    <Calendar size={14} />
                    <span>Since {currentCustomer.since}</span>
                </div>
            </div>

            {/* Recent Issue */}
            {currentCustomer.recentIssue && (
                <div className={styles.recentIssue}>
                    <AlertCircle size={14} color="#faad14" />
                    <span className={styles.recentIssueText}>
                        Recent: {currentCustomer.recentIssue}
                    </span>
                </div>
            )}
        </div>
    );
};

export default CustomerContextCard;
