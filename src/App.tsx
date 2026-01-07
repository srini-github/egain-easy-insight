import React, { Suspense, lazy } from 'react';
import { Sparkles, HelpCircle } from 'lucide-react';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import Filters from './components/Filters';
import SearchHistory from './components/SearchHistory';
import UserSwitcher from './components/UserSwitcher';
import DemoQueries from './components/DemoQueries';
import CustomerContext from './components/CustomerContext';
import ErrorBoundary from './components/ErrorBoundary';
import { SessionProvider } from './context/SessionProvider';
import { CustomerProvider } from './context/CustomerProvider';
import { SearchProvider, useSearchQuery, useSearchActions } from './context/SearchProvider';
import { AIProvider } from './context/AIProvider';
import { getTenant } from './data/mockRBAC';
import './App.css';
import jpmJpg from './assets/jpm.jpg';

const ArticleModal = lazy(() => import('./components/ArticleModal'));

const AppLayout = () => {
  // Optimized: Subscribe to specific contexts instead of entire search context
  const { hasSearched } = useSearchQuery();
  const { selectedArticle, closeArticle } = useSearchActions();
  const tenant = getTenant();

  return (
    <div className="app-container">
      <header className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="header-logo-container" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#fff',
            padding: '6px 14px 6px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(196, 30, 142, 0.2)'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              background: 'transparent',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              border: 'none',
              padding: 0
            }}>
              <img src={jpmJpg} alt="JP Morgan logo" style={{ width: 24, height: 24, display: 'block' }} />
            </div>
            <span className="header-logo-text" style={{
              fontWeight: 700,
              color: '#126BC5',
              fontSize: '1.08rem',
              fontFamily: '"Georgia", "Times New Roman", Times, serif',
              letterSpacing: '0.01em',
              textShadow: '0 1px 0 #fff, 0 0.5px 0 #126BC5',
              lineHeight: 1.1
            }}>
              JPMorgan Chase
            </span>
          </div>
          <div className="header-divider" style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />
          <div className="brand-title">
            <Sparkles color="var(--primary-color)" fill="var(--primary-color)" size={18} />
            <span>eGain Easy Insight</span>
          </div>
        </div>
        <UserSwitcher />
      </header>

      <CustomerContext />

      <div className="main-content">
        <ErrorBoundary>
          <aside className="sidebar">
            <Filters />
            <SearchHistory />
          </aside>
        </ErrorBoundary>

        <main className="results-area">
          <ErrorBoundary>
            <SearchBar />
          </ErrorBoundary>

          <ErrorBoundary>
            {!hasSearched ? (
              <div className="empty-state-container" style={{ textAlign: 'center', marginTop: '80px', opacity: 0.6 }}>
                <HelpCircle size={40} strokeWidth={1} />
                <h2 style={{ marginTop: '20px', fontWeight: 500, fontSize: '0.875rem' }}>How can we help?</h2>
                <p style={{ fontSize: '0.875rem' }}>Search for answers, guides, and troubleshooting tips.</p>
              </div>
            ) : (
              <SearchResults />
            )}
          </ErrorBoundary>

          <ErrorBoundary>
            <DemoQueries />
          </ErrorBoundary>
        </main>
      </div>

      <ErrorBoundary>
        <Suspense fallback={null}>
          <ArticleModal article={selectedArticle} onClose={closeArticle} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

function App() {
  return (
    <SessionProvider>
      <CustomerProvider>
        <SearchProvider>
          <AIProvider>
            <AppLayout />
          </AIProvider>
        </SearchProvider>
      </CustomerProvider>
    </SessionProvider>
  );
}

export default App;

