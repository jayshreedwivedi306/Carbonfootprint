import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Lightbulb, 
  Plus, 
  Check, 
  Trash2, 
  Car, 
  Zap, 
  UtensilsCrossed, 
  Smile 
} from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: 'TRAVEL' | 'ENERGY' | 'DIET';
  reductionPotential: number;
}

interface AdoptedSuggestion {
  id: string;
  suggestionId: string;
  status: 'ACTIVE' | 'COMPLETED';
  completedAt: string | null;
  suggestion: Suggestion;
}

export const Suggestions: React.FC = () => {
  const { token } = useAuth();
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [adopted, setAdopted] = useState<AdoptedSuggestion[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Animation triggers
  const [successAnimationId, setSuccessAnimationId] = useState<string | null>(null);

  const API_URL = 'http://localhost:5000/api';

  const fetchData = async () => {
    try {
      const [resSugg, resAdopted] = await Promise.all([
        fetch(`${API_URL}/suggestions`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/suggestions/adopted`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!resSugg.ok || !resAdopted.ok) {
        throw new Error('Failed to fetch habit suggestions.');
      }

      const suggestionsData = await resSugg.json();
      const adoptedData = await resAdopted.json();

      setSuggestions(suggestionsData);
      setAdopted(adoptedData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error downloading suggestions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAdopt = async (suggestionId: string) => {
    try {
      const res = await fetch(`${API_URL}/suggestions/adopt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ suggestionId })
      });

      if (!res.ok) throw new Error('Could not adopt suggestion');
      
      const newAdopted = await res.json();
      setAdopted(prev => [...prev.filter(a => a.suggestionId !== suggestionId), newAdopted]);
    } catch (err) {
      alert('Action failed. Please try again.');
    }
  };

  const handleComplete = async (adoptedId: string) => {
    try {
      const res = await fetch(`${API_URL}/suggestions/adopted/${adoptedId}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Could not complete suggestion');
      
      const updated = await res.json();
      setAdopted(prev => prev.map(a => a.id === adoptedId ? updated : a));
      
      // Trigger temporary visual micro-animation
      setSuccessAnimationId(adoptedId);
      setTimeout(() => setSuccessAnimationId(null), 1500);
    } catch (err) {
      alert('Action failed. Please try again.');
    }
  };

  const handleUnadopt = async (adoptedId: string) => {
    if (!window.confirm('Are you sure you want to stop tracking this habit?')) return;
    try {
      const res = await fetch(`${API_URL}/suggestions/adopted/${adoptedId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Could not remove suggestion');
      
      setAdopted(prev => prev.filter(a => a.id !== adoptedId));
    } catch (err) {
      alert('Action failed. Please try again.');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'TRAVEL': return <Car size={18} color="var(--accent)" />;
      case 'ENERGY': return <Zap size={18} color="var(--warning)" />;
      case 'DIET': return <UtensilsCrossed size={18} color="var(--primary)" />;
      default: return <Lightbulb size={18} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>Fetching personalized recommendations...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <h2 style={{ color: 'var(--error)' }}>Load Error</h2>
        <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>{error}</p>
        <button onClick={fetchData} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  // Filter lists
  const filteredSuggestions = activeCategory === 'ALL' 
    ? suggestions 
    : suggestions.filter(s => s.category === activeCategory);

  // Group adopted suggestions by active/completed status
  const activeAdopted = adopted.filter(a => a.status === 'ACTIVE');
  const completedAdopted = adopted.filter(a => a.status === 'COMPLETED');

  // Check if a suggestion is already adopted
  const isAdopted = (id: string) => adopted.some(a => a.suggestionId === id);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Banner */}
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Habits & Action Suggestions</h1>
        <p style={{ color: 'var(--text-muted)' }}>Adopt eco-friendly habits and track your carbon reduction targets</p>
      </div>

      <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'flex-start' }}>
        
        {/* Left Side: Available Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600 }}>Explore Suggestions</h2>
            
            {/* Category Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }} role="tablist" aria-label="Suggestions Category Filter">
              {['ALL', 'TRAVEL', 'ENERGY', 'DIET'].map((cat) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: activeCategory === cat ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                    color: activeCategory === cat ? 'var(--text-dark)' : 'var(--text-main)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Suggestions list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {filteredSuggestions.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No suggestions found for this category.</p>
              ) : (
                filteredSuggestions.map((sug) => {
                  const adoptedState = isAdopted(sug.id);
                  return (
                    <div 
                      key={sug.id} 
                      style={{ 
                        background: 'rgba(11, 19, 41, 0.4)', 
                        padding: '1rem', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--border-glass)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getCategoryIcon(sug.category)}
                          <strong style={{ fontSize: '0.95rem' }}>{sug.title}</strong>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '2px 6px', borderRadius: '4px' }}>
                          -{sug.reductionPotential} kg/wk
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{sug.description}</p>
                      
                      <button
                        onClick={() => handleAdopt(sug.id)}
                        disabled={adoptedState}
                        className="btn btn-secondary"
                        style={{ alignSelf: 'flex-start', padding: '0.4rem 0.8rem', fontSize: '0.85rem', marginTop: '0.3rem', width: '100%', gap: '0.3rem' }}
                      >
                        <Plus size={16} />
                        <span>{adoptedState ? 'Habit Adopted' : 'Adopt Habit'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>

        {/* Right Side: My Active / Completed Habits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Active Checklist */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>My Active Checklist</span>
              <span style={{ fontSize: '0.8rem', background: 'var(--accent-glow)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '12px' }}>
                {activeAdopted.length}
              </span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeAdopted.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <Smile style={{ margin: '0 auto 0.5rem', display: 'block' }} size={24} />
                  <span>No active habits. Adopt some from the list!</span>
                </div>
              ) : (
                activeAdopted.map((a) => (
                  <div 
                    key={a.id} 
                    className="animate-fade-in"
                    style={{ 
                      background: successAnimationId === a.id ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)', 
                      padding: '1rem', 
                      borderRadius: 'var(--radius-md)', 
                      border: successAnimationId === a.id ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {getCategoryIcon(a.suggestion.category)}
                        <strong style={{ fontSize: '0.95rem' }}>{a.suggestion.title}</strong>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                        Reduces {a.suggestion.reductionPotential} kg CO2/wk
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleComplete(a.id)}
                        className="btn btn-primary"
                        style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)' }}
                        aria-label={`Mark "${a.suggestion.title}" as complete`}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => handleUnadopt(a.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', color: 'var(--error)' }}
                        aria-label={`Unadopt "${a.suggestion.title}"`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed Achievements */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Completed Achievements</span>
              <span style={{ fontSize: '0.8rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px' }}>
                {completedAdopted.length}
              </span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {completedAdopted.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                  No completed accomplishments in this cycle yet. Keep going!
                </p>
              ) : (
                completedAdopted.map((a) => (
                  <div 
                    key={a.id} 
                    style={{ 
                      background: 'rgba(16, 185, 129, 0.05)', 
                      padding: '0.8rem 1rem', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                        {a.suggestion.title}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                        Achieved! Saved -{a.suggestion.reductionPotential} kg CO2
                      </span>
                    </div>
                    <Check size={18} color="var(--primary)" />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
