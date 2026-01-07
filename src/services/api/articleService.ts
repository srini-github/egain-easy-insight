// API Mock. Todo: Remove MOCK_ARTICLES dependency when backend search API is wired.
import { MOCK_ARTICLES } from '../../data/mockArticles';
// API Mock. Todo: Remove RBAC data dependency when backend enforces permissions.
import { filterByPermissions, getPermissionSummary } from '../../data/mockRBAC';
import { withTimeout, NetworkError, NetworkErrorType } from '../../utils/networkUtils';

const ARTICLE_LOOKUP = MOCK_ARTICLES.reduce((acc, article) => {
  acc[article.id] = article;
  return acc;
}, {});

export const SECURITY_QUERY = 'what are the enterprise security policies?';
const SECURITY_ORDER = ['1004', '2003', '2007', '2008', '2005'];
const SECURITY_ORDERING_KEY = 'securityPolicies';

const DEMO_QUERY_RESULTS = {
  'how do i reset my account password?': ['2001', '1001'],
  'my mobile app keeps crashing': ['2010', '2011', '2012'],
  'how do i update my payment method?': ['2013', '2014', '2015'],
  'how to sync outlook with knowledge base?': ['2002', '2004'],
  'what is the current stock price of apple?': ['2006'],
  [SECURITY_QUERY]: ['2005', '2003', '2007', '2008', '1004'],
  'account': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '1001', '2001']
};

const simulateLatency = (min = 300, max = 600, signal = null) =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, min + Math.random() * (max - min));

    // Support abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }
  });

// Simulate network failures for testing resilience
const simulateNetworkFailure = () => {
  // 2% chance of network error for testing
  if (Math.random() < 0.02) {
    throw new NetworkError(
      'Simulated network error',
      NetworkErrorType.NETWORK_ERROR,
      true
    );
  }
};

const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
};

const fuzzyMatch = (text, term) => {
  const textLower = text.toLowerCase();
  const termLower = term.toLowerCase();
  if (textLower.includes(termLower)) return true;

  const textWords = textLower.split(/\s+/);
  const maxDistance = termLower.length > 4 ? 2 : 1;

  return textWords.some(word => {
    if (word.startsWith(termLower) || termLower.startsWith(word)) return true;
    return levenshtein(word, termLower) <= maxDistance;
  });
};

const normalizeQuery = (query = '') => query.trim().toLowerCase();

const reorderSecurityResults = (items) => {
  const orderMap = SECURITY_ORDER.reduce((acc, id, index) => {
    acc[id] = index;
    return acc;
  }, {});

  return [...items].sort((a, b) => {
    const aIdx = orderMap[a.id];
    const bIdx = orderMap[b.id];
    if (aIdx === undefined && bIdx === undefined) return 0;
    if (aIdx === undefined) return 1;
    if (bIdx === undefined) return -1;
    return aIdx - bIdx;
  });
};
const DATE_RANGE_DAYS = {
  'Last 7 days': 7,
  'Last 30 days': 30,
  'Last 90 days': 90,
  'Last year': 365
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const getArticleTimestamp = (article) => {
  const lastUpdated = article.lastUpdated ? new Date(article.lastUpdated).getTime() : 0;
  const created = article.createdDate ? new Date(article.createdDate).getTime() : 0;
  return lastUpdated || created || null;
};

const matchesDateRange = (article, range) => {
  if (!range || range === 'All') return true;
  const windowDays = DATE_RANGE_DAYS[range];
  if (!windowDays) return true;
  const reference = getArticleTimestamp(article);
  if (!reference) return true;
  const cutoff = Date.now() - windowDays * DAY_IN_MS;
  return reference >= cutoff;
};

const matchesCustomDates = (article, startDate, endDate) => {
  if (!startDate && !endDate) return true;
  const reference = getArticleTimestamp(article);
  if (!reference) return true;

  if (startDate) {
    const start = new Date(startDate).getTime();
    if (Number.isFinite(start) && reference < start) {
      return false;
    }
  }

  if (endDate) {
    const inclusiveEnd = new Date(endDate).getTime();
    if (Number.isFinite(inclusiveEnd) && reference > inclusiveEnd + DAY_IN_MS - 1) {
      return false;
    }
  }

  return true;
};

// Export filtering utilities for client-side filtering
export const filterArticlesByFilters = (articles, filters) => {
  return articles.filter(article => {
    const matchesCategory = !filters?.category || filters.category === 'All' || article.category === filters.category;
    const matchesDate = matchesDateRange(article, filters?.dateRange);
    const matchesCustomWindow = matchesCustomDates(article, filters?.startDate, filters?.endDate);
    return matchesCategory && matchesDate && matchesCustomWindow;
  });
};


export const applyResultOrdering = (orderingKey, items) => {
  if (orderingKey === SECURITY_ORDERING_KEY) {
    return reorderSecurityResults(items);
  }
  return items;
};

export const sortArticlesByKey = (list, sortKey) => {
  return [...list].sort((a, b) => {
    if (sortKey === 'relevance') return b.relevanceScore - a.relevanceScore;
    if (sortKey === 'date') return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    if (sortKey === 'popularity') return b.viewCount - a.viewCount;
    return 0;
  });
};

const findDemoArticles = (normalizedQuery) => {
  const ids = DEMO_QUERY_RESULTS[normalizedQuery];
  if (!ids) return null;
  return ids.map(id => ARTICLE_LOOKUP[id]).filter(Boolean);
};

const buildCandidateArticles = (queryWords, filters) => {
  return MOCK_ARTICLES.filter(item => {
    const searchableText = `${item.title} ${item.content} ${item.tags.join(' ')}`;
    const matchesQuery = queryWords.some(word => fuzzyMatch(searchableText, word));
    const matchesCategory = !filters?.category || filters.category === 'All' || item.category === filters.category;
    const matchesDate = matchesDateRange(item, filters?.dateRange);
    const matchesCustomWindow = matchesCustomDates(item, filters?.startDate, filters?.endDate);
    return matchesQuery && matchesCategory && matchesDate && matchesCustomWindow;
  });
};

// API Mocked. Todo: Replace with actual API call as POST /api/knowledge/search (body: { query, filters, sortBy }).
export const searchKnowledge = async ({ query, filters, sortBy = 'relevance', signal = null }) => {
  // Timeout: 10 seconds for search requests
  const SEARCH_TIMEOUT_MS = 10000;

  const performSearch = async () => {
    // Simulate potential network failure for testing resilience
    simulateNetworkFailure();

    await simulateLatency(500, 900, signal);

    if (!query || !query.trim()) {
      return { results: [], orderingKey: null };
    }

    const normalizedQuery = normalizeQuery(query);
    let candidateArticles = findDemoArticles(normalizedQuery);

    if (!candidateArticles) {
      const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
      candidateArticles = buildCandidateArticles(queryWords, filters);
    }

    if (filters?.category && filters.category !== 'All') {
      candidateArticles = candidateArticles.filter(item => item.category === filters.category);
    }

    if (filters?.dateRange && filters.dateRange !== 'All') {
      candidateArticles = candidateArticles.filter(item => matchesDateRange(item, filters.dateRange));
    }

    if (filters?.startDate || filters?.endDate) {
      candidateArticles = candidateArticles.filter(item => matchesCustomDates(item, filters.startDate, filters.endDate));
    }

    const permitted = filterByPermissions(candidateArticles);
    const sortedResults = sortArticlesByKey(permitted, sortBy);

    const orderingKey = normalizedQuery === SECURITY_QUERY ? SECURITY_ORDERING_KEY : null;
    const orderedResults = orderingKey && sortBy === 'relevance'
      ? reorderSecurityResults(sortedResults)
      : sortedResults;

    return {
      results: orderedResults.map(article => ({
        ...article,
        _permissionInfo: getPermissionSummary()
      })),
      orderingKey
    };
  };

  return withTimeout(performSearch(), SEARCH_TIMEOUT_MS, signal);
};

// API Mocked. Todo: Replace with actual API call as GET /api/knowledge/suggestions?query=<term>.
export const fetchSearchSuggestions = async ({ query, signal = null }) => {
  // Timeout: 5 seconds for suggestions (faster than search)
  const SUGGESTIONS_TIMEOUT_MS = 5000;

  const fetchSuggestions = async () => {
    // Simulate potential network failure for testing resilience
    simulateNetworkFailure();

    await simulateLatency(200, 350, signal);

    if (!query || query.trim().length < 2) {
      return [];
    }

    let matches = MOCK_ARTICLES.filter(article =>
      article.title.toLowerCase().includes(query.toLowerCase()) ||
      article.category.toLowerCase().includes(query.toLowerCase())
    );

    matches = filterByPermissions(matches);
    return matches.slice(0, 3);
  };

  return withTimeout(fetchSuggestions(), SUGGESTIONS_TIMEOUT_MS, signal);
};