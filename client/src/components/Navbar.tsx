import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, LogOut, LayoutDashboard, Calculator, Lightbulb, UserCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'calculator', name: 'Calculator', icon: Calculator },
    { id: 'suggestions', name: 'Habits Tracker', icon: Lightbulb },
  ];

  return (
    <nav className="glass-panel" style={{ borderRadius: '0 0 var(--radius-lg) var(--radius-lg)', padding: '1rem 2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }} aria-label="Main Navigation">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
        <Leaf size={28} color="var(--primary)" aria-hidden="true" />
        <span style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          CarbonAware
        </span>
      </div>

      <ul style={{ display: 'flex', listStyle: 'none', gap: '1rem', alignItems: 'center' }} role="menubar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li role="none" key={item.id}>
              <button
                role="menuitem"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: 'none',
                  color: isActive ? 'var(--accent)' : 'var(--text-main)',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <Icon size={18} aria-hidden="true" />
                {item.name}
              </button>
            </li>
          );
        })}
      </ul>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <UserCheck size={16} color="var(--accent)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</span>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            background: user.role === 'ADMIN' ? 'var(--error)' : 'var(--primary)',
            color: user.role === 'ADMIN' ? '#ffffff' : 'var(--text-dark)',
            padding: '2px 6px',
            borderRadius: '4px',
            marginLeft: '0.2rem'
          }}>
            {user.role}
          </span>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
          aria-label="Logout"
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};
