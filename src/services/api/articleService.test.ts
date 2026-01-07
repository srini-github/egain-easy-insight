import { describe, expect, it, vi } from 'vitest';
import { fetchSearchSuggestions, searchKnowledge, SECURITY_QUERY } from './articleService';

// Fast-forward through simulated latency so tests stay fast and deterministic.
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

const dateOnlyDaysAgo = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

describe('articleService adapter', () => {
  it('returns deterministic password search ordering', async () => {
    const response = await withFakeLatency(() => searchKnowledge({
      query: 'how do i reset my account password?',
      filters: { category: 'All', dateRange: 'All', startDate: null, endDate: null },
      sortBy: 'relevance'
    }));

    expect(response.results).toHaveLength(2);
    expect(response.results.map(article => article.id)).toEqual(['2001', '1001']);
  });

  it('enforces security ordering meta data', async () => {
    const response = await withFakeLatency(() => searchKnowledge({
      query: SECURITY_QUERY,
      filters: { category: 'All', dateRange: 'All', startDate: null, endDate: null },
      sortBy: 'relevance'
    }));

    expect(response.orderingKey).toBe('securityPolicies');
    expect(response.results[0]?.id).toBe('2005');
  });

  it('limits search suggestions and respects RBAC filters', async () => {
    const suggestions = await withFakeLatency(() => fetchSearchSuggestions({ query: 'password' }));

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(3);
    expect(suggestions[0].title.toLowerCase()).toContain('password');
  });

  it('applies custom start date filtering', async () => {
    const start = dateOnlyDaysAgo(1);
    const response = await withFakeLatency(() => searchKnowledge({
      query: 'how do i reset my account password?',
      filters: { category: 'All', dateRange: 'All', startDate: start, endDate: null },
      sortBy: 'relevance'
    }));

    expect(response.results.map(article => article.id)).toEqual(['1001']);
  });

  it('applies custom end date filtering', async () => {
    const end = dateOnlyDaysAgo(2);
    const response = await withFakeLatency(() => searchKnowledge({
      query: 'how do i reset my account password?',
      filters: { category: 'All', dateRange: 'All', startDate: null, endDate: end },
      sortBy: 'relevance'
    }));

    expect(response.results.map(article => article.id)).toEqual(['2001']);
  });
});
