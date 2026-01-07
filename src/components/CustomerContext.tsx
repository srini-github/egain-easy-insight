import { useState, useRef, useEffect } from 'react';
import { Phone, ChevronDown } from 'lucide-react';
import { useCustomer } from '../context/CustomerProvider';

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
        <div className="customer-context-bar" style={{
            background: '#f8fafc',
            borderBottom: '1px solid var(--border-color)',
            padding: '8px 8px 8px 8px',
            marginBottom: '-20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            fontSize: '0.8125rem',
            minHeight: 0
        }}>
            {/* Customer Selector */}
            <div className="customer-selector-section" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                }}>
                    Customer
                </span>
                
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: '#fff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: tierColors[currentCustomer.tier] || 'var(--primary-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                        }}>
                            {currentCustomer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                                {currentCustomer.name}
                            </div>
                        </div>
                        <ChevronDown size={14} color="var(--text-secondary)" />
                    </button>

                    {isOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '4px',
                            background: '#fff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 100,
                            overflow: 'hidden',
                            minWidth: '240px'
                        }}>
                            {allCustomers.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => handleSelectCustomer(c.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: 'none',
                                        background: c.id === currentCustomer.id ? '#f0f7ff' : 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: tierColors[c.tier] || 'var(--primary-color)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontWeight: 600,
                                        fontSize: '0.7rem'
                                    }}>
                                        {c.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                                            {c.name}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
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
            <div className="customer-divider" style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

            {/* Account Info */}
            <div className="customer-info-grid" style={{ display: 'flex', alignItems: 'center', gap: '20px', color: 'var(--text-secondary)' }}>
                <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Account</span>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{currentCustomer.accountNumber}</div>
                </div>
                <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Tier</span>
                    <div style={{
                        fontWeight: 500,
                        color: tierColors[currentCustomer.tier] || 'var(--text-primary)'
                    }}>
                        {currentCustomer.tier}
                    </div>
                </div>
                <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Phone</span>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={11} />
                        {currentCustomer.phone}
                    </div>
                </div>
            </div>

            {/* Divider */}
            <div className="customer-divider" style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

            {/* Current Issue */}
            <div style={{ color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Reason for Call</span>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {currentCustomer.recentIssue}
                </div>
            </div>
        </div>
    );
};

export default CustomerContext;
