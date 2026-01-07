import type { KnowledgeArticle, KnowledgeCategory, KnowledgeAccessLevel } from '../types/knowledge';

// Helper to generate realistic data
const CATEGORIES: KnowledgeCategory[] = ['Account', 'Technical', 'Billing', 'Security', 'General'];

const TEMPLATES: Record<KnowledgeCategory, { t: string; s: string }[]> = {
    Account: [
        { t: 'Resetting Password', s: 'How to safely reset your account password via email or SMS.' },
        { t: 'Updating Profile', s: 'Change your display name, avatar, and contact preferences.' },
        { t: 'Deactivating Account', s: 'Steps to temporarily or permanently close your account.' },
        { t: 'Link Social Layouts', s: 'Connect Google, Facebook, or Apple ID for easier login.' },
        { t: 'Privacy Settings', s: 'Manage who can see your activity and personal data.' },
        { t: 'Account Recovery Options', s: 'Setting up backup email addresses and security questions for account recovery.' },
        { t: 'Email Verification Process', s: 'How to verify your email address and resend verification links.' },
        { t: 'Username Change Policy', s: 'Guidelines and restrictions for changing your account username.' },
        { t: 'Account Security Dashboard', s: 'Overview of security status, recent activity, and device management.' }
    ],
    Technical: [
        { t: 'Connection Issues', s: 'Troubleshooting common timeout and latency errors.' },
        { t: 'Browser Compatibility', s: 'Recommended browsers and clearing cache/cookies.' },
        { t: 'API Rate Limits', s: 'Understanding 429 errors and optimization strategies.' },
        { t: 'Mobile App Crash', s: 'Steps to resolve unexpected crashes on iOS and Android.' },
        { t: 'Integration Setup', s: 'Guide to generating API keys and webhooks.' },
        { t: 'Database Connection Pooling', s: 'Optimizing connection pool settings for high-traffic applications.' },
        { t: 'SSL Certificate Installation', s: 'Installing and renewing SSL certificates for secure connections.' },
        { t: 'Load Balancer Configuration', s: 'Setting up and troubleshooting load balancers for distributed systems.' },
        { t: 'Webhook Retry Logic', s: 'Understanding webhook delivery failures and automatic retry mechanisms.' }
    ],
    Billing: [
        { t: 'Invoice Explanation', s: 'breakdown of taxes, fees, and service charges.' },
        { t: 'Payment Methods', s: 'Adding or removing credit cards and bank accounts.' },
        { t: 'Refund Policy', s: 'Conditions under which you are eligible for a refund.' },
        { t: 'Upgrading Plan', s: 'Compare tiers and switch to a higher capacity plan.' },
        { t: 'Billing Contacts', s: 'Assigning a dedicated email for financial correspondence.' },
        { t: 'Usage-Based Billing', s: 'Understanding metered billing cycles and overage charges.' },
        { t: 'Annual vs Monthly Plans', s: 'Cost comparison and savings when choosing annual billing.' },
        { t: 'Tax Documentation', s: 'Accessing tax forms, W-9, and VAT exemption certificates.' },
        { t: 'Credit Balance Management', s: 'How credits are applied and monitoring your account balance.' }
    ],
    Security: [
        { t: '2FA Setup', s: 'Enabling two-factor authentication for enhanced protection.' },
        { t: 'Suspicious Activity', s: 'What to do if you notice unrecognized logins.' },
        { t: 'Password Policy', s: 'Organization requirements for password complexity.' },
        { t: 'Session Managment', s: 'Reviewing active sessions and remotely logging out.' },
        { t: 'Audit Logs', s: 'Accessing and exporting security audit trails.' },
        { t: 'API Key Rotation', s: 'Best practices for rotating API keys and maintaining security.' },
        { t: 'IP Whitelisting', s: 'Restricting access to your account from approved IP addresses only.' },
        { t: 'Data Encryption Standards', s: 'Understanding encryption at rest and in transit for sensitive data.' },
        { t: 'Security Incident Response', s: 'Procedures for reporting and responding to security breaches.' }
    ],
    General: [
        { t: 'Getting Started', s: 'A quick tour of the main dashboard features.' },
        { t: 'Community Guidelines', s: 'Rules for interacting in the public forums.' },
        { t: 'Feature Request', s: 'How to submit ideas for new product features.' },
        { t: 'Support Hours', s: 'When our team is available to help you live.' },
        { t: 'Office Locations', s: 'Physical addresses and mailing information.' },
        { t: 'Keyboard Shortcuts', s: 'Complete list of keyboard shortcuts to improve productivity.' },
        { t: 'Mobile App Download', s: 'Where to download official mobile apps for iOS and Android.' },
        { t: 'Service Status Page', s: 'Checking real-time system status and planned maintenance windows.' },
        { t: 'Export Your Data', s: 'How to request a complete export of your account data.' }
    ]
};

const daysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
};

const CREATED_OFFSETS = [1, 3, 5, 20];

const createTimelineGenerator = () => {
    let index = 0;
    return (): { created: string; lastUpdated: string } => {
        const offset = CREATED_OFFSETS[index % CREATED_OFFSETS.length];
        index += 1;
        const updatedOffset = Math.max(offset - 1, 0);
        return {
            created: daysAgo(offset),
            lastUpdated: daysAgo(updatedOffset)
        };
    };
};

const generateArticles = (): KnowledgeArticle[] => {
    const articles: KnowledgeArticle[] = [];
    let globalId = 1;
    const nextTimeline = createTimelineGenerator();

    CATEGORIES.forEach((category) => {
        const categoryTemplates = TEMPLATES[category];
        const templateCount = categoryTemplates.length;

        // Generate 20 articles per category
        for (let i = 1; i <= 20; i++) {
            const template = categoryTemplates[(i - 1) % templateCount]; // Cycle through all templates

            // Vary the title slightly to avoid exact duplicates
            const titleVariation = i <= templateCount ? template.t : `${template.t} - Part ${Math.ceil(i / templateCount)}`;

            // Randomize mock stats
            const viewCount = Math.floor(Math.random() * 5000) + 100;
            const relevance = Math.floor(Math.random() * 40) + 60; // 60-100

            // Random date within last year
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 365));

            // Assign access levels - most public, some restricted
            const accessLevels: KnowledgeAccessLevel[] = ['public', 'public', 'public', 'internal', 'restricted'];
            const accessLevel = accessLevels[i % 5];

            // Some articles are drafts
            const status: KnowledgeArticle['status'] = i % 10 === 0 ? 'draft' : 'published';

            // Add confidential/internal tags to some articles
            const baseTags: string[] = [category.toLowerCase(), 'guide', 'help', template.t.split(' ')[0].toLowerCase()];
            if (accessLevel === 'restricted') baseTags.push('internal');
            if (category === 'Security' && i % 3 === 0) baseTags.push('confidential');

            articles.push({
                id: globalId.toString(),
                title: titleVariation,
                content: `${template.s} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.`,
                category,
                tags: baseTags,
                relevanceScore: relevance,
                viewCount: viewCount,
                createdDate: date.toISOString(),
                lastUpdated: date.toISOString(),
                accessLevel,
                status: status
            });
            globalId++;
        }
    });

    // --- Add Specific Demo Articles for RBAC Testing ---

    // 1. Support Agent (Public)
    articles.push({
        id: '1001',
        title: 'How to Reset Customer Password',
        content: 'Standard procedure for resetting customer passwords via the admin panel. Ensure identity verification first. Ask for last 4 digits of SSN.',
        category: 'Account',
        tags: ['guide', 'password', 'support'],
        relevanceScore: 95,
        viewCount: 1200,
        createdDate: daysAgo(5),
        lastUpdated: daysAgo(2),
        accessLevel: 'public',
        status: 'published'
    });

    // 2. Senior Agent (Internal/Technical)
    {
        const { created: created1002, lastUpdated: updated1002 } = nextTimeline();
        articles.push({
        id: '1002',
        title: 'Advanced Server Diagnostics',
        content: 'Internal guide for diagnosing 500 errors on the payment gateway. Check logs at /var/log/payment-service. Restart service if memory > 90%.',
        category: 'Technical',
        tags: ['troubleshooting', 'internal', 'server'],
        relevanceScore: 92,
        viewCount: 350,
        createdDate: created1002,
        lastUpdated: updated1002,
        accessLevel: 'internal',
        status: 'published'
        });
    }

    // 3. Knowledge Author (Drafts)
    {
        const { created: created1003, lastUpdated: updated1003 } = nextTimeline();
        articles.push({
        id: '1003',
        title: 'Q4 Product Roadmap (DRAFT)',
        content: 'Upcoming features for Q4 include AI Search v2, new billing dashboard, and mobile app refresh. DO NOT SHARE EXTERNALLY.',
        category: 'General',
        tags: ['roadmap', 'planning', 'draft'],
        relevanceScore: 88,
        viewCount: 10,
        createdDate: created1003,
        lastUpdated: updated1003,
        accessLevel: 'restricted',
        status: 'draft'
        });
    }

    // 4. Admin (Confidential/Security)
    {
        const { created: created1004, lastUpdated: updated1004 } = nextTimeline();
        articles.push({
        id: '1004',
        title: 'Executive Security Audit 2024',
        content: 'CONFIDENTIAL: Results of the annual penetration test. Critical vulnerabilities found in legacy auth module. Remediation plan attached.',
        category: 'Security',
        tags: ['audit', 'confidential', 'executive'],
        relevanceScore: 99,
        viewCount: 5,
        createdDate: created1004,
        lastUpdated: updated1004,
        accessLevel: 'confidential',
        status: 'published'
        });
    }

    // --- Deterministic Demo Articles ---

    articles.push({
        id: '2001',
        title: 'Password Reset Runbook',
        content: 'Step-by-step reference for handling end-user password resets across SSO and native login flows. Covers verification, reset initiation, and confirmation messaging.',
        category: 'Account',
        tags: ['demo', 'password', 'reset'],
        relevanceScore: 98,
        viewCount: 2400,
        createdDate: daysAgo(8),
        lastUpdated: daysAgo(3),
        accessLevel: 'public',
        status: 'published'
    });

    {
        const { created: created2002, lastUpdated: updated2002 } = nextTimeline();
        articles.push({
        id: '2002',
        title: 'Outlook Sync Troubleshooting Checklist',
        content: 'Definitive checklist for aligning Outlook desktop profiles with the internal knowledge base connector. Includes plug-in install steps and escalation paths.',
        category: 'General',
        tags: ['demo', 'outlook', 'sync'],
        relevanceScore: 94,
        viewCount: 1800,
        createdDate: created2002,
        lastUpdated: updated2002,
        accessLevel: 'public',
        status: 'published'
        });
    }

    {
        const { created: created2003, lastUpdated: updated2003 } = nextTimeline();
        articles.push({
        id: '2003',
        title: 'Enterprise Security Policy Compendium',
        content: 'Comprehensive policy reference for handling regulated data, admin access reviews, and escalation paths for privileged users.',
        category: 'Security',
        tags: ['demo', 'policy', 'internal'],
        relevanceScore: 97,
        viewCount: 220,
        createdDate: created2003,
        lastUpdated: updated2003,
        accessLevel: 'internal',
        status: 'published'
        });
    }

    {
        const { created: created2004, lastUpdated: updated2004 } = nextTimeline();
        articles.push({
        id: '2004',
        title: 'Knowledge Sync Connector Release Notes',
        content: 'Version-by-version changelog for the Outlook knowledge sync plug-in, including deployment prerequisites and rollback guidance.',
        category: 'General',
        tags: ['demo', 'sync', 'release'],
        relevanceScore: 91,
        viewCount: 960,
        createdDate: created2004,
        lastUpdated: updated2004,
        accessLevel: 'public',
        status: 'published'
        });
    }

    {
        const { created: created2005, lastUpdated: updated2005 } = nextTimeline();
        articles.push({
        id: '2005',
        title: 'Security Policy Overview (Public Extract)',
        content: 'Summarized security expectations for frontline roles covering acceptable use, password hygiene, and incident escalation paths. Links to full documents for authorized users.',
        category: 'General',
        tags: ['demo', 'security', 'overview'],
        relevanceScore: 88,
        viewCount: 1450,
        createdDate: created2005,
        lastUpdated: updated2005,
        accessLevel: 'public',
        status: 'published'
        });
    }

    {
        const { created: created2006, lastUpdated: updated2006 } = nextTimeline();
        articles.push({
        id: '2006',
        title: 'Real-Time Market Data Limitations',
        content: 'Explains why live stock quotes are not stored in the knowledge base and directs agents to approved financial data sources.',
        category: 'General',
        tags: ['demo', 'finance', 'guidance'],
        relevanceScore: 82,
        viewCount: 1100,
        createdDate: created2006,
        lastUpdated: updated2006,
        accessLevel: 'public',
        status: 'published'
        });
    }

    {
        const { created: created2007, lastUpdated: updated2007 } = nextTimeline();
        articles.push({
        id: '2007',
        title: 'Security Architecture Playbook',
        content: 'Internal-only breakdown of enterprise security controls, privileged access reviews, and remediation procedures for elevated agents.',
        category: 'Security',
        tags: ['demo', 'policy', 'restricted'],
        relevanceScore: 94,
        viewCount: 410,
        createdDate: created2007,
        lastUpdated: updated2007,
        accessLevel: 'restricted',
        status: 'published'
        });
    }

    {
        const { created: created2008, lastUpdated: updated2008 } = nextTimeline();
        articles.push({
        id: '2008',
        title: 'Security Policy Draft Addendum',
        content: 'Draft appendix covering upcoming security policy changes that requires Knowledge Author review before publication.',
        category: 'Security',
        tags: ['demo', 'policy', 'draft'],
        relevanceScore: 90,
        viewCount: 60,
        createdDate: created2008,
        lastUpdated: updated2008,
        accessLevel: 'internal',
        status: 'draft'
        });
    }

    // Add a confidential security policy article that only Admin can see
    {
        const { created: created2009, lastUpdated: updated2009 } = nextTimeline();
        articles.push({
        id: '2009',
        title: 'Executive Security Compliance Report (Confidential)',
        content: 'CONFIDENTIAL: Board-level security compliance report covering SOC 2, ISO 27001 audit results, and executive risk assessments. Admin access only.',
        category: 'Security',
        tags: ['demo', 'policy', 'confidential', 'executive'],
        relevanceScore: 99,
        viewCount: 12,
        createdDate: created2009,
        lastUpdated: updated2009,
        accessLevel: 'confidential',
        status: 'published'
        });
    }

    // Billing Demo Articles
    {
        const { created: created2013, lastUpdated: updated2013 } = nextTimeline();
        articles.push({
        id: '2013',
        title: 'Updating Payment Methods',
        content: 'Step-by-step guide to update your payment method. Navigate to Account Settings > Billing > Payment Methods. Click "Add Payment Method" to add a new card or bank account. To update existing methods, click the edit icon next to the payment method. For security, you may need to verify your identity. Supported payment types include credit cards, debit cards, and ACH bank transfers.',
        category: 'Billing',
        tags: ['demo', 'billing', 'payment', 'update'],
        relevanceScore: 95,
        viewCount: 3200,
        createdDate: created2013,
        lastUpdated: updated2013,
        accessLevel: 'public',
        status: 'published'
        });
    }

    {
        const { created: created2014, lastUpdated: updated2014 } = nextTimeline();
        articles.push({
        id: '2014',
        title: 'Payment Method Security Best Practices',
        content: 'Important security guidelines for managing payment methods. Always use secure connections when updating payment information. Enable two-factor authentication for billing changes. Review your payment methods regularly and remove unused cards. Monitor your billing statements for unauthorized charges. Contact support immediately if you notice suspicious activity.',
        category: 'Billing',
        tags: ['demo', 'billing', 'security', 'payment'],
        relevanceScore: 92,
        viewCount: 1850,
        createdDate: created2014,
        lastUpdated: updated2014,
        accessLevel: 'public',
        status: 'published'
        });
    }

    {
        const { created: created2015, lastUpdated: updated2015 } = nextTimeline();
        articles.push({
        id: '2015',
        title: 'Troubleshooting Payment Method Issues',
        content: 'Common payment method issues and solutions. If card verification fails, check that billing address matches card details. Expired cards must be updated before processing payments. Some banks may block international transactions - contact your bank to authorize. If payments are declined, verify sufficient funds and correct CVV. For persistent issues, try a different payment method or contact support.',
        category: 'Billing',
        tags: ['demo', 'billing', 'troubleshooting', 'payment'],
        relevanceScore: 91,
        viewCount: 2100,
        createdDate: created2015,
        lastUpdated: updated2015,
        accessLevel: 'public',
        status: 'published'
        });
    }

    // Mobile App Crash Demo Articles
    {
        const { created: created2010, lastUpdated: updated2010 } = nextTimeline();
        articles.push({
        id: '2010',
        title: 'Mobile App Crash Troubleshooting Guide',
        content: 'Comprehensive guide to diagnosing and resolving mobile app crashes on iOS and Android. Start by checking app version, clearing cache, and ensuring latest OS updates are installed. For iOS: force quit and restart. For Android: clear app data under Settings > Apps. If crashes persist after device restart, try uninstalling and reinstalling the app.',
        category: 'Technical',
        tags: ['demo', 'mobile', 'crash', 'troubleshooting'],
        relevanceScore: 96,
        viewCount: 2850,
        createdDate: created2010,
        lastUpdated: updated2010,
        accessLevel: 'public',
        status: 'published'
        });
    }

    {
        const { created: created2011, lastUpdated: updated2011 } = nextTimeline();
        articles.push({
        id: '2011',
        title: 'iOS App Memory Management Best Practices',
        content: 'Understanding and preventing iOS app crashes due to memory issues. Common causes include memory leaks, background process overload, and insufficient device memory. Recommended steps: close background apps, restart device, check available storage (Settings > General > iPhone Storage), and ensure iOS version compatibility.',
        category: 'Technical',
        tags: ['demo', 'mobile', 'ios', 'memory'],
        relevanceScore: 93,
        viewCount: 1680,
        createdDate: created2011,
        lastUpdated: updated2011,
        accessLevel: 'public',
        status: 'published'
        });
    }

    {
        const { created: created2012, lastUpdated: updated2012 } = nextTimeline();
        articles.push({
        id: '2012',
        title: 'Android App Stability Issues Resolution',
        content: 'Step-by-step guide for resolving Android app stability and crash issues. Check for conflicting apps, update Google Play Services, clear app cache and data, verify sufficient device storage, and ensure Android OS is up to date. For persistent issues, try booting in safe mode to identify third-party app conflicts.',
        category: 'Technical',
        tags: ['demo', 'mobile', 'android', 'stability'],
        relevanceScore: 94,
        viewCount: 2240,
        createdDate: created2012,
        lastUpdated: updated2012,
        accessLevel: 'public',
        status: 'published'
        });
    }

    return articles;
};

export const MOCK_ARTICLES = generateArticles();
