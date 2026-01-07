# eGain Easy Insight - AI-Powered Knowledge Management

> A modern, production-ready React application demonstrating intelligent knowledge search with AI-powered responses, personalized customer experiences, and role-based access control.

**Live Demo:** [Coming Soon - Deploy to Vercel/Netlify]

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [User Experience Highlights](#user-experience-highlights)
- [Project Structure](#project-structure)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Testing](#testing)
- [Browser Support](#browser-support)
- [License](#license)

---

## Overview

eGain Easy Insight is a sophisticated knowledge management application that combines traditional keyword search with AI-powered intelligent responses. The application demonstrates enterprise-grade features including:

- **Hybrid Search**: Combines keyword-based search with RAG (Retrieval-Augmented Generation) AI responses
- **Customer Personalization**: Tailors responses based on customer tier (Standard, Premier, Private Client)
- **Role-Based Access Control (RBAC)**: Different content visibility for Support Agent, Supervisor, and Admin roles
- **Production-Ready**: Network resilience, error handling, performance optimization, and accessibility

Built with React 19, TypeScript, and Vite, this application showcases modern web development best practices and production-ready architecture.

---

## Key Features

### 🔍 Intelligent Search
- **Dual Search Modes**: Keyword search + AI-generated answers
- **Auto-suggestions**: Real-time search suggestions with debouncing
- **Advanced Filtering**: Category, date range, and custom date filtering
- **Multiple Sort Options**: Relevance, date, and alphabetical sorting
- **Virtual Scrolling**: Handles 1000+ results efficiently

### 🤖 AI-Powered Responses
- **Confidence Scoring**: AI responses include confidence levels (0-100%)
- **Citation Support**: All AI answers cite source articles
- **Low Confidence Handling**: Graceful degradation when AI lacks information
- **Feedback System**: Users can rate responses and suggest improvements
- **Answer Editing**: Inline editing for knowledge base contributions

### 👥 Personalization & RBAC
- **Customer Tier-Based Responses**: Different greetings and content for Premier/Private/Standard customers
- **Role-Based Filtering**: Content visibility based on Support Agent/Supervisor/Admin roles
- **Session Management**: User switching with persistent search history
- **Permission-Aware UI**: Features adapt to user's access level

### ⚡ Performance & Resilience
- **Network Resilience**: Automatic retry with exponential backoff
- **Timeout Handling**: Configurable timeouts for all API calls
- **Request Cancellation**: AbortController prevents race conditions
- **Context Splitting**: 4 separate contexts to minimize re-renders
- **Memoization**: 42+ usages of useMemo/useCallback/memo
- **Lazy Loading**: Code splitting for optimal bundle size

### 🎨 User Experience
- **Skeleton Loading**: Perceived performance with skeleton screens
- **Error Boundaries**: Graceful error handling with recovery options
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Keyboard Navigation**: Full keyboard support for power users
- **URL State Management**: Shareable search URLs

---

## Technology Stack

### Core
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **CSS Modules** - Scoped styling

### Libraries
- **lucide-react** - Modern icon library
- **react-window** - Virtual scrolling for performance

### Development Tools
- **Vitest** - Fast unit testing
- **Testing Library** - User-centric testing
- **ESLint** - Code quality and consistency

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **npm** 10+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd egain-1_vs_code

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### First Steps

1. **Try Demo Queries**: Click any of the suggested queries at the top
2. **Switch Users**: Use the dropdown to switch between different user roles
3. **Toggle Customers**: See how responses change for different customer tiers
4. **Explore Features**: Try filtering, sorting, and AI responses

---

## Architecture

### Component Hierarchy

```
App
├─ SessionProvider (user/role state)
├─ CustomerProvider (customer context)
├─ SearchProvider (4 split contexts)
│   ├─ SearchQueryContext
│   ├─ SearchFiltersContext
│   ├─ SearchResultsContext
│   └─ SearchActionsContext
└─ AIProvider (AI responses, permissions)
```

### Data Flow

```
User Input → useSearch Hook → Service Layer → Network Utils (retry/timeout)
                    ↓
            Search Results → Client-Side Filtering → Virtual Scrolling
                    ↓
            AI Generation → useAISearch Hook → AIAnswerPanel
                    ↓
            Feedback → Submission with Retry
```

### State Management

**Context Split Strategy**: Instead of a monolithic context, the app uses 4 specialized contexts to prevent unnecessary re-renders:

- **SearchQueryContext**: Query string and suggestions (changes frequently)
- **SearchFiltersContext**: Filters and sort options (changes moderately)
- **SearchResultsContext**: Results, loading, error states (read-only for most components)
- **SearchActionsContext**: Modal and history actions (infrequent changes)

Components subscribe only to the contexts they need, dramatically reducing render cycles.

### Network Resilience

All API calls include:
- **Timeouts**: 3-15 seconds depending on operation
- **Retry Logic**: Exponential backoff with jitter (2-3 retries)
- **Error Classification**: TIMEOUT, NETWORK_ERROR, SERVER_ERROR, ABORT, UNKNOWN
- **User-Friendly Messages**: Technical errors converted to actionable messages
- **AbortSignal Support**: Prevent race conditions and memory leaks

---

## User Experience Highlights

### AI Response States

1. **High Confidence (≥80%)**: Full AI answer with citations
2. **Low Confidence (<80%)**: Agent guidance + suggestion submission
3. **Error State**: Graceful fallback to keyword search results
4. **Loading State**: Skeleton screen with smooth transitions

### Customer Personalization Examples

**Premier Banking Customer** searching "password reset":
```
"Hello Sarah Martinez! As a Premier Banking client with dedicated
relationship manager support, here's how to reset your password..."
```

**Standard Customer** same query:
```
"To reset your password, follow these steps..."
```

### Demo Queries

Try these queries to see different features:

- **"what are the enterprise security policies?"** - Custom ordering demo
- **"how do I reset my password?"** - Customer tier personalization
- **"mobile app crashing"** - Technical support flow
- **"what is the current stock price of apple?"** - Low confidence handling

---

## Project Structure

```
egain-1_vs_code/
├── src/
│   ├── components/           # React components
│   │   ├── AIAnswerPanel.tsx        # AI response orchestrator
│   │   ├── AIAnswerFull.tsx         # Confident AI answers
│   │   ├── AIAnswerLowConfidence.tsx
│   │   ├── AIAnswerError.tsx
│   │   ├── SearchBar.tsx            # Search input + suggestions
│   │   ├── SearchResults.tsx        # Virtual scrolling results
│   │   ├── Filters.tsx              # Advanced filtering
│   │   ├── ArticleCard.tsx          # Memoized result card
│   │   ├── FeedbackPanel.tsx        # AI feedback system
│   │   └── ...
│   ├── context/              # React contexts
│   │   ├── SearchProvider.tsx       # 4 split search contexts
│   │   ├── AIProvider.tsx           # AI state management
│   │   ├── CustomerProvider.tsx     # Customer context
│   │   └── SessionProvider.tsx      # User/role state
│   ├── hooks/                # Custom hooks
│   │   ├── useSearch.ts             # Search logic + retry
│   │   ├── useAISearch.ts           # AI generation + retry
│   │   └── useURLState.ts           # URL state sync
│   ├── services/             # API layer
│   │   └── api/
│   │       ├── articleService.ts    # Article search (mock)
│   │       └── aiService.ts         # AI responses (mock)
│   ├── utils/                # Utilities
│   │   ├── networkUtils.ts          # Timeout, retry, REST helpers
│   │   └── validation.ts            # Input validation + XSS prevention
│   ├── data/                 # Mock data
│   │   ├── mockArticles.ts          # Sample knowledge base
│   │   └── mockRBAC.ts              # RBAC configuration
│   ├── types/                # TypeScript types
│   │   └── knowledge.ts
│   ├── App.tsx               # Root component
│   └── main.tsx              # Entry point
├── public/                   # Static assets
├── package.json
├── tsconfig.json
├── vite.config.js
└── README.md
```

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at http://localhost:5173 |
| `npm run dev -- --force` | Force rebuild (if you encounter module issues) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

### Development Workflow

1. **Component Development**: All components are in `src/components/` with co-located CSS modules
2. **Type Safety**: Use TypeScript for all new code, define interfaces in `src/types/`
3. **State Management**: Follow the context split pattern, avoid prop drilling
4. **Performance**: Use `memo`, `useMemo`, `useCallback` for expensive operations
5. **Testing**: Write tests alongside components (`.test.tsx` files)

### Code Quality Standards

- **TypeScript Coverage**: ~95% (minimal `any` usage)
- **Component Size**: Keep components under 200 lines
- **CSS Modules**: Use scoped styles, avoid inline styles
- **Memoization**: Memoize expensive computations and callbacks
- **Error Handling**: All API calls wrapped with try-catch + error classification

---

## Production Deployment

### Ready for Backend Integration

The application is ready for backend API integration. All API calls are currently mocked with the following structure:

**5 API Endpoints** (documented in mock services):

1. `POST /api/knowledge/search` - Article search
2. `GET /api/knowledge/suggestions?query={term}` - Auto-suggestions
3. `POST /api/ai/answer` - AI response generation
4. `GET /api/permissions/me` - User permissions
5. `POST /api/ai/feedback` - Feedback submission

**Migration Path**: Replace mock implementations with REST API helpers already included:

```typescript
// Before (Mock)
export const searchKnowledge = async ({ query, filters, sortBy, signal }) => {
  // ... 15 lines of mock logic
};

// After (Real API - 1 line!)
import { apiPost } from '../../utils/networkUtils';
export const searchKnowledge = async ({ query, filters, sortBy, signal }) => {
  return apiPost('/api/knowledge/search', { query, filters, sortBy }, { signal, timeout: 10000 });
};
```

All timeout, retry, and error handling is automatic.

### Environment Configuration

Create `.env` file for production:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_ENV=production
```

### Build for Production

```bash
# Build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

The production build:
- Minifies JavaScript/CSS
- Optimizes images and assets
- Generates source maps
- Creates `dist/` folder ready for deployment

---

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch
```

### Test Coverage

Current coverage includes:
- Service layer unit tests (`articleService.test.ts`, `aiService.test.ts`)
- Mock data validation
- Network utility functions

**Recommended additions**:
- Component tests for SearchBar, SearchResults, AIAnswerPanel
- Hook tests for useSearch, useAISearch
- Integration tests for user flows
- E2E tests with Playwright

---

## Browser Support

- **Chrome/Edge**: Latest 2 versions ✅
- **Firefox**: Latest 2 versions ✅
- **Safari**: Latest 2 versions ✅
- **Mobile**: iOS Safari 14+, Chrome Android ✅

**Modern JavaScript Required**: Uses ES2020+ features (optional chaining, nullish coalescing).

---

## Free Deployment Options

### Recommended: Vercel (Easiest)

1. **Push to GitHub** (this repository)
2. **Import to Vercel**: https://vercel.com/new
3. **Configure**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Deploy**: Instant deployment + auto-deploy on git push

**URL**: `https://your-project.vercel.app`

### Alternative: Netlify

1. **Push to GitHub**
2. **Import to Netlify**: https://app.netlify.com/start
3. **Configure**:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Deploy**

**URL**: `https://your-project.netlify.app`

### Alternative: GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
"deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

**URL**: `https://yourusername.github.io/repo-name`

**Note**: Requires `base` configuration in `vite.config.js`:
```js
export default defineConfig({
  base: '/repo-name/',
  // ...
})
```

---

## Performance Metrics

**Bundle Size**: ~150KB gzipped (initial load)

**Performance Features**:
- Virtual scrolling for 1000+ items
- Code splitting (lazy loaded modals)
- Debounced search suggestions (300ms)
- Memoized components prevent re-renders
- Request deduplication via AbortController

**Network Resilience**:
- 2-3 automatic retries for failed requests
- 3-15 second timeouts (operation-specific)
- Exponential backoff with jitter

---

## Future Enhancements

Potential improvements documented in codebase:

- [ ] Comprehensive test suite (target: 70%+ coverage)
- [ ] Accessibility audit (WCAG 2.1 AA compliance)
- [ ] Error logging integration (Sentry)
- [ ] Offline support with service workers
- [ ] Advanced keyboard shortcuts
- [ ] Rate limiting protection
- [ ] Toast notification system
- [ ] Dark mode support

---

## License

MIT License - feel free to use this code for learning and demonstration purposes.

---

## Contact

For questions about this demonstration project, please reach out via GitHub issues.

**Built with ❤️ using React 19, TypeScript, and modern web best practices.**
