/**
 * Mock RBAC (Role-Based Access Control) Data
 * Simulates enterprise permission system for knowledge management
 */

import type { KnowledgeArticle } from '../types/knowledge';

// Define roles with their permission levels
export const ROLES = {
    SUPPORT_AGENT: {
        id: 'support_agent',
        name: 'Support Agent',
        level: 1,
        description: 'Frontline customer support',
        allowedCategories: ['General', 'Account', 'Billing', 'Technical'],
        restrictedTags: ['internal', 'confidential', 'executive'],
        canViewDraft: false,
        canViewRestricted: false
    },
    SENIOR_AGENT: {
        id: 'senior_agent',
        name: 'Senior Agent',
        level: 2,
        description: 'Experienced support with escalation access',
        allowedCategories: ['General', 'Account', 'Billing', 'Technical'],
        restrictedTags: ['executive'],
        canViewDraft: false,
        canViewRestricted: true
    },
    KNOWLEDGE_AUTHOR: {
        id: 'knowledge_author',
        name: 'Knowledge Author',
        level: 3,
        description: 'Content creator and editor',
        allowedCategories: ['General', 'Account', 'Billing', 'Technical', 'Security'],
        restrictedTags: ['executive'],
        canViewDraft: true,
        canViewRestricted: true
    },
    ADMIN: {
        id: 'admin',
        name: 'Administrator',
        level: 4,
        description: 'Full system access',
        allowedCategories: ['General', 'Account', 'Billing', 'Technical', 'Security'],
        restrictedTags: [],
        canViewDraft: true,
        canViewRestricted: true
    }
};

// Mock users for demo
export const MOCK_USERS = [
    {
        id: 'user-001',
        name: 'Alex Johnson',
        email: 'alex.johnson@company.com',
        role: ROLES.SUPPORT_AGENT,
        avatar: '👤',
        department: 'Customer Support'
    },
    {
        id: 'user-002',
        name: 'Sarah Chen',
        email: 'sarah.chen@company.com',
        role: ROLES.SENIOR_AGENT,
        avatar: '👩‍💼',
        department: 'Technical Support'
    },
    {
        id: 'user-003',
        name: 'Michael Torres',
        email: 'michael.torres@company.com',
        role: ROLES.KNOWLEDGE_AUTHOR,
        avatar: '✍️',
        department: 'Knowledge Management'
    },
    {
        id: 'user-004',
        name: 'Emily Davis',
        email: 'emily.davis@company.com',
        role: ROLES.ADMIN,
        avatar: '👑',
        department: 'IT Administration'
    }
];

// Access levels for articles
export const ACCESS_LEVELS = {
    PUBLIC: { id: 'public', name: 'Public', icon: '🌐', color: '#36b37e' },
    INTERNAL: { id: 'internal', name: 'Internal', icon: '🏢', color: '#0047AB' },
    RESTRICTED: { id: 'restricted', name: 'Restricted', icon: '🔒', color: '#ff991f' },
    CONFIDENTIAL: { id: 'confidential', name: 'Confidential', icon: '🔐', color: '#de350b' }
};

// Get current user (simulated - can be switched for demo)
let currentUserId = 'user-001'; // Default to Support Agent

export const getCurrentUser = () => {
    return MOCK_USERS.find(u => u.id === currentUserId) || MOCK_USERS[0];
};

export const setCurrentUser = (userId) => {
    currentUserId = userId;
};

// Check if user can access an article
export const canAccessArticle = (article: KnowledgeArticle, user = getCurrentUser()) => {
    const role = user.role;

    // Check category access
    if (!role.allowedCategories.includes(article.category)) {
        return { allowed: false, reason: 'Category not authorized' };
    }

    // Check restricted tags
    const hasRestrictedTag = article.tags.some(tag =>
        role.restrictedTags.includes(tag.toLowerCase())
    );
    if (hasRestrictedTag) {
        return { allowed: false, reason: 'Contains restricted content' };
    }

    // Check access level
    if (article.accessLevel === 'restricted' && !role.canViewRestricted) {
        return { allowed: false, reason: 'Insufficient permission level' };
    }

    if (article.accessLevel === 'confidential' && role.level < 4) {
        return { allowed: false, reason: 'Admin access required' };
    }

    // Check draft status
    if (article.status === 'draft' && !role.canViewDraft) {
        return { allowed: false, reason: 'Draft content not visible' };
    }

    return { allowed: true, reason: null };
};

// Filter articles based on user permissions
export const filterByPermissions = (articles: KnowledgeArticle[], user = getCurrentUser()) => {
    return articles.map(article => {
        const access = canAccessArticle(article, user);
        return {
            ...article,
            _accessAllowed: access.allowed,
            _accessReason: access.reason
        };
    }).filter(article => article._accessAllowed);
};

// Get permission summary for UI
export const getPermissionSummary = (user = getCurrentUser()) => {
    return {
        userId: user.id,
        userName: user.name,
        role: user.role.name,
        level: user.role.level,
        categories: user.role.allowedCategories,
        restrictions: user.role.restrictedTags.length > 0
            ? `Cannot view: ${user.role.restrictedTags.join(', ')}`
            : 'No restrictions',
        canViewDraft: user.role.canViewDraft,
        canViewRestricted: user.role.canViewRestricted
    };
};

// --- Tenant (Enterprise Customer) ---
export const TENANT = {
    id: 'tenant-jpmorgan',
    name: 'JP Morgan Chase',
    shortName: 'JPMorgan',
    logo: '🏦',
    primaryColor: '#0A4D8C',
    industry: 'Financial Services'
};

// --- End Customers (People the Agent is helping) ---
export const MOCK_END_CUSTOMERS = [
    {
        id: 'cust-001',
        name: 'John Smith',
        accountNumber: '****4521',
        tier: 'Premier Banking',
        since: '2018',
        phone: '+1 (555) 123-4567',
        recentIssue: 'Password reset request'
    },
    {
        id: 'cust-002',
        name: 'Maria Garcia',
        accountNumber: '****8832',
        tier: 'Private Client',
        since: '2015',
        phone: '+1 (555) 987-6543',
        recentIssue: 'Wire transfer inquiry'
    },
    {
        id: 'cust-003',
        name: 'David Lee',
        accountNumber: '****2209',
        tier: 'Business Banking',
        since: '2020',
        phone: '+1 (555) 456-7890',
        recentIssue: 'API integration help'
    }
];

let currentEndCustomerId = 'cust-001';

export const getCurrentEndCustomer = () => {
    return MOCK_END_CUSTOMERS.find(c => c.id === currentEndCustomerId) || MOCK_END_CUSTOMERS[0];
};

export const setCurrentEndCustomer = (customerId: string) => {
    currentEndCustomerId = customerId;
};

export const getTenant = () => TENANT;
