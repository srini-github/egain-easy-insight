import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { generateAIResponse, checkPermissions, submitFeedback } from './aiService';
import { MOCK_ARTICLES } from '../../data/mockArticles';
import * as RBAC from '../../data/mockRBAC';

// Fast-forward util to keep mocked latency from slowing tests.
const withFakeLatency = async <T>(action: () => Promise<T>): Promise<T> => {
  vi.useFakeTimers();
  try {
    const pending = action();
    await vi.runAllTimersAsync();
    return await pending;
  } finally {
    vi.useRealTimers();
  }
};

// Ensure Math.random() never trips the 5% failure branch during deterministic tests.
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.6);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('aiService adapter', () => {
  it('returns high-confidence password guidance with citations', async () => {
    vi.spyOn(RBAC, 'getCurrentUser').mockReturnValue(RBAC.MOCK_USERS[0]);
    const articles = MOCK_ARTICLES.filter(article => ['2001', '1001'].includes(article.id));

    const response = await withFakeLatency(() => generateAIResponse('how do I reset my account password?', articles));

    expect(response.answer.toLowerCase()).toContain('reset the password');
    expect(response.isConfident).toBe(true);
    expect(response.citations.length).toBeGreaterThan(0);
    expect(response.guardrails.sourceVerified).toBe(true);
  });

  it('prioritizes knowledge author security citations', async () => {
    vi.spyOn(RBAC, 'getCurrentUser').mockReturnValue({
      ...RBAC.MOCK_USERS[2],
      role: { ...RBAC.MOCK_USERS[2].role, id: 'knowledge_author' }
    });

    const articles = MOCK_ARTICLES.filter(article => ['2005', '2003', '2007', '2008'].includes(article.id));
    const response = await withFakeLatency(() => generateAIResponse('what are the enterprise security policies?', articles));
    expect(response.citations[0]?.id).toBe('2003');
  });

  it('mirrors RBAC state via checkPermissions', async () => {
    const mockedUser = RBAC.MOCK_USERS[1];
    vi.spyOn(RBAC, 'getCurrentUser').mockReturnValue(mockedUser);

    const perms = await withFakeLatency(() => checkPermissions());
    expect(perms.userId).toBe(mockedUser.id);
    expect(perms.role).toBe(mockedUser.role.name);
    expect(perms.allowedCategories).toEqual(mockedUser.role.allowedCategories);
  });

  it('echoes submitted feedback payloads', async () => {
    const feedbackPayload = { type: 'helpful', timestamp: new Date().toISOString() };
    const response = await withFakeLatency(() => submitFeedback('resp-123', feedbackPayload));

    expect(response.success).toBe(true);
    expect(response.responseId).toBe('resp-123');
    expect(response.received).toEqual(feedbackPayload);
  });
});
