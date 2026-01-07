import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Shield, Lock, Eye } from 'lucide-react';
import { MOCK_USERS } from '../data/mockRBAC';
import { useSession } from '../context/SessionProvider';

/**
 * User Switcher Component
 * Allows switching between demo users to show RBAC filtering effects
 */
const UserSwitcher = () => {
    const { currentUser, permissionSummary, switchUser } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
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

    const handleUserChange = (user) => {
        switchUser(user.id);
        setIsOpen(false);
    };

    const permissions = permissionSummary;

    return (
        <div style={{ position: 'relative' }} ref={containerRef}>
            {/* Current User Button - Light header style */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 12px',
                    background: (isOpen || isHovered) ? 'var(--primary-light)' : 'transparent',
                    border: '1px solid',
                    borderColor: (isOpen || isHovered) ? 'rgba(196, 30, 142, 0.2)' : 'transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                }}
            >
                <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    color: 'var(--primary-color)',
                    border: '1px solid rgba(196, 30, 142, 0.2)'
                }}>
                    {currentUser.avatar}
                </div>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{currentUser.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{currentUser.role.name}</div>
                </div>
                <ChevronDown size={14} color="var(--text-secondary)" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: 'white',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 100,
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Switch User (Demo)
                    </div>
                    {MOCK_USERS.map(user => (
                        <button
                            key={user.id}
                            onClick={() => handleUserChange(user)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                width: '100%',
                                border: 'none',
                                background: user.id === currentUser.id ? '#e6effc' : 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.background = user.id === currentUser.id ? '#e6effc' : 'transparent'}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{user.avatar}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{user.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.role.name}</div>
                            </div>
                            {user.role.level === 4 && (
                                <span style={{ fontSize: '0.6rem', padding: '2px 6px', background: '#6554c0', color: 'white', borderRadius: '4px' }}>FULL</span>
                            )}
                        </button>
                    ))}

                    {/* Permission summary in dropdown */}
                    <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-color)', background: '#f8fafc' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            <Shield size={12} />
                            <span>Level {permissions.level}/4</span>
                            <span style={{ margin: '0 4px' }}>•</span>
                            {permissions.canViewRestricted ? (
                                <span style={{ color: '#36b37e', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Eye size={10} /> Restricted Access
                                </span>
                            ) : (
                                <span style={{ color: '#de350b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Lock size={10} /> Limited Access
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserSwitcher;
