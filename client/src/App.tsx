import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { SkipLink } from './components/SkipLink';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { Calculator } from './pages/Calculator';
import { Suggestions } from './pages/Suggestions';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-gradient)' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '45px', height: '45px', animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: '1.2rem', fontSize: '1.1rem', color: 'var(--text-muted)' }}>Loading CarbonAware...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SkipLink />
      
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main 
        id="main-content" 
        tabIndex={-1} 
        style={{ flex: 1, padding: '0 2rem 3rem 2rem', maxWidth: '1200px', width: '100%', margin: '0 auto', outline: 'none' }}
      >
        {activeTab === 'dashboard' && (
          <Dashboard onNavigateToCalculator={() => setActiveTab('calculator')} />
        )}
        {activeTab === 'calculator' && (
          <Calculator onCalculationComplete={() => setActiveTab('dashboard')} />
        )}
        {activeTab === 'suggestions' && (
          <Suggestions />
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', borderTop: '1px solid var(--border-glass)', background: 'rgba(11, 19, 41, 0.4)' }}>
        <p>&copy; {new Date().getFullYear()} CarbonAware Awareness Platform. Build for Green Tech Hackathon MVP.</p>
        <p style={{ marginTop: '0.3rem', fontSize: '0.75rem' }}>Secured with AES-256 equivalent hashing & short-lived token checks.</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;
