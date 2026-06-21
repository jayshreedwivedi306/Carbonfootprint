import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, Mail, Lock, Shield, ArrowRight, KeyRound, RotateCcw, CheckCircle2, Copy, Check } from 'lucide-react';

type AuthView = 'login' | 'forgot' | 'reset';

export const AuthPage: React.FC = () => {
  const { login, register, oauthLogin, forgotPassword, resetPassword, error, clearError } = useAuth();

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [view, setView] = useState<AuthView>('login');

  // Login/Register fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<string>('USER');

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [forgotSuccess, setForgotSuccess] = useState<boolean>(false);

  // Reset password fields
  const [tokenInput, setTokenInput] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const clearAll = () => {
    setFormError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAll();
    if (!email || !password) { setFormError('Please fill in all fields.'); return; }
    if (password.length < 8) { setFormError('Password must be at least 8 characters long.'); return; }
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, role);
      }
    } catch (err: any) {
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: string) => {
    setLoading(true);
    clearAll();
    try {
      const mockEmail = `mock.${provider}.${Date.now()}@hackathon.org`;
      await oauthLogin(mockEmail, provider);
    } catch (err: any) {
      setFormError(`Simulated ${provider} authentication failed.`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAll();
    if (!forgotEmail) { setFormError('Please enter your email.'); return; }
    setLoading(true);
    try {
      const data = await forgotPassword(forgotEmail);
      if (data.resetToken) {
        setResetToken(data.resetToken);
        setTokenInput(data.resetToken); // pre-fill reset form
      }
      setForgotSuccess(true);
    } catch (err: any) {
      // error set by context
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAll();
    if (!tokenInput) { setFormError('Please enter your reset token.'); return; }
    if (!newPassword || newPassword.length < 8) { setFormError('Password must be at least 8 characters long.'); return; }
    setLoading(true);
    try {
      await resetPassword(tokenInput, newPassword);
      setResetSuccess(true);
    } catch (err: any) {
      // error set by context
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(resetToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToLogin = () => {
    setView('login');
    setForgotSuccess(false);
    setResetSuccess(false);
    setForgotEmail('');
    setResetToken('');
    setTokenInput('');
    setNewPassword('');
    clearAll();
  };

  const activeError = formError || error;

  // ─── Forgot Password View ────────────────────────────────────────────────
  if (view === 'forgot') {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '1rem' }}>
        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <KeyRound size={36} color="var(--primary)" />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Forgot Password</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Enter your email and we'll generate a reset token for you
            </p>
          </div>

          {/* Error */}
          {activeError && (
            <div role="alert" aria-live="polite" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 500 }}>
              {activeError}
            </div>
          )}

          {!forgotSuccess ? (
            <form onSubmit={handleForgotSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label htmlFor="forgot-email">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                <span>{loading ? 'Generating...' : 'Generate Reset Token'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Success banner */}
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={18} color="var(--primary)" />
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Token Generated!</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  In production this would be emailed. Copy your token below and use it to reset your password.
                </p>
                {/* Token display box */}
                {resetToken && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <code style={{ flex: 1, fontSize: '0.75rem', wordBreak: 'break-all', color: 'var(--accent)', fontFamily: 'monospace' }}>
                      {resetToken}
                    </code>
                    <button
                      type="button"
                      onClick={copyToken}
                      title="Copy token"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0 }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => setView('reset')}
              >
                <span>Continue to Reset Password</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          <div style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            <button type="button" onClick={goToLogin} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              ← Back to Sign In
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ─── Reset Password View ─────────────────────────────────────────────────
  if (view === 'reset') {
    return (
      <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '1rem' }}>
        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <RotateCcw size={36} color="var(--primary)" />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Reset Password</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Enter your reset token and choose a new password</p>
          </div>

          {activeError && (
            <div role="alert" aria-live="polite" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 500 }}>
              {activeError}
            </div>
          )}

          {!resetSuccess ? (
            <form onSubmit={handleResetSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="form-group">
                <label htmlFor="reset-token">Reset Token</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="reset-token"
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste your reset token"
                    style={{ paddingLeft: '2.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    style={{ paddingLeft: '2.5rem' }}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
              <CheckCircle2 size={40} color="var(--primary)" />
              <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>Password Reset Successfully!</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>You can now sign in with your new password.</p>
              <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={goToLogin}>
                <span>Go to Sign In</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {!resetSuccess && (
            <div style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
              <button type="button" onClick={() => setView('forgot')} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                ← Back
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ─── Login / Register View ───────────────────────────────────────────────
  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.8rem', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <Leaf size={36} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
            {isLogin ? 'Welcome Back' : 'Join CarbonAware'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {isLogin ? 'Sign in to track your carbon reduction progress' : 'Start tracking and reducing your environmental impact'}
          </p>
        </div>

        {/* Error Notification */}
        {activeError && (
          <div role="alert" aria-live="polite" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error)', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 500 }}>
            {activeError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ paddingLeft: '2.5rem' }}
                required
                aria-required="true"
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
              {isLogin && (
                <button
                  type="button"
                  id="forgot-password-link"
                  onClick={() => { clearAll(); setView('forgot'); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingLeft: '2.5rem' }}
                required
                aria-required="true"
              />
            </div>
          </div>

          {/* Role selection for RBAC demonstrating */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="role">Platform Role (RBAC Demo)</label>
              <div style={{ position: 'relative' }}>
                <Shield size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ paddingLeft: '2.5rem', appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="USER" style={{ color: 'var(--text-dark)' }}>User (Standard)</option>
                  <option value="ADMIN" style={{ color: 'var(--text-dark)' }}>Administrator</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
          <span>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
        </div>

        {/* Mock OAuth Buttons */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: '0.9rem', padding: '0.6rem' }}
            disabled={loading}
            aria-label="Sign in with Google"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth('github')}
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: '0.9rem', padding: '0.6rem' }}
            disabled={loading}
            aria-label="Sign in with GitHub"
          >
            GitHub
          </button>
        </div>

        {/* Toggle Mode */}
        <div style={{ textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              clearAll();
            }}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

      </div>
    </main>
  );
};
