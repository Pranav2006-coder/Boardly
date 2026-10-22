import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../common';

/**
 * AuthPage Component for Boardly
 * Dual tab (Login / Sign Up), one-click demo profiles, rich canvas floating elements.
 * Reuses shared Button, Input, and Badge components.
 */
export default function AuthPage({ onLoginSuccess }) {
  const { login, register, demoLogin } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let res;
    if (tab === 'login') {
      res = await login(email, password);
    } else {
      res = await register(name, email, password);
    }

    setLoading(false);
    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError(res.error || 'Authentication failed');
    }
  };

  const handleDemo = async (role) => {
    setLoading(true);
    setError('');
    const res = await demoLogin(role);
    setLoading(false);
    if (res.success && onLoginSuccess) onLoginSuccess();
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans bg-[#FAF6F2] text-[#292323]">
      {/* Burgundy & Cream ambient background glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#FFF8F0] opacity-80 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[480px] h-[480px] rounded-full bg-[#E8DDD8]/50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-[#FAF6F2] blur-3xl" />
        {/* Subtle neutral dotted grid overlay */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#D6CECA 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E8DDD8] shadow-xs">
        <div className="h-16 w-full max-w-[1440px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-[#7F1D3F] flex items-center justify-center shadow-burgundy-btn group-hover:bg-[#651630] transition-colors">
                <span className="material-symbols-outlined text-white text-[20px]">draw</span>
              </div>
              <span className="font-headline text-[22px] font-bold tracking-tight text-[#292323] group-hover:text-[#7F1D3F] transition-colors">
                Boardly
              </span>
            </div>
            <div className="h-4 w-px bg-[#E8DDD8] hidden sm:block" />
            <span className="hidden sm:inline-block text-xs text-[#786C6C] font-medium">
              Real-Time Visual Collaboration
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleDemo('alex')}
              icon={<span className="w-2 h-2 rounded-full bg-[#7F1D3F] animate-pulse" />}
            >
              Demo: Alex
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDemo('sarah')}
              icon={<span className="w-2 h-2 rounded-full bg-[#A63D57]" />}
            >
              Demo: Sarah
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full pt-20 pb-12 min-h-screen flex flex-col justify-center items-center px-4">
        {/* Floating canvas art elements (Burgundy & Cream) */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
          {/* Floating Sticky (Top Left) */}
          <div className="absolute top-28 left-[6%] md:left-[10%] w-48 h-44 bg-[#FFF8F0] rounded-2xl shadow-lg rotate-[-5deg] p-4 opacity-90 hidden sm:flex flex-col justify-between transition-transform duration-700 hover:rotate-[-1deg] border border-[#E8DDD8]">
            <div className="flex items-center justify-between border-b border-[#E8DDD8] pb-1.5">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#7F1D3F]">Sprint 14</span>
              <span className="w-2 h-2 rounded-full bg-[#7F1D3F]" />
            </div>
            <div className="space-y-1.5 mt-2">
              <div className="h-2 w-4/5 bg-[#E8B7C2]/60 rounded" />
              <div className="h-2 w-3/5 bg-[#E8B7C2]/40 rounded" />
              <div className="h-2 w-2/3 bg-[#E8B7C2]/30 rounded" />
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-5 h-5 rounded-full bg-[#7F1D3F] flex items-center justify-center text-[9px] font-bold text-white">AM</div>
              <span className="text-[10px] font-medium text-[#786C6C] font-mono">architecture.fig</span>
            </div>
          </div>

          {/* Floating Collaborator Cursor */}
          <div className="absolute top-[32%] left-[4%] md:left-[12%] flex flex-col items-start gap-1 opacity-90 hidden md:flex animate-pulse" style={{ animationDuration: '4s' }}>
            <svg className="w-5 h-5 -rotate-12 drop-shadow-md" fill="#7F1D3F" viewBox="0 0 24 24">
              <path d="M3.5 2.5l14 7-6 1.8-3.2 6.2z" />
            </svg>
            <div className="px-2.5 py-1 rounded-full bg-[#7F1D3F] text-white text-[11px] font-semibold tracking-wide shadow-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E8B7C2]" />
              Sarah is drafting
            </div>
          </div>

          {/* Floating Selection Box (Bottom Right) */}
          <div className="absolute bottom-[16%] right-[6%] md:right-[12%] w-60 h-40 border-2 border-dashed border-[#A63D57]/60 rounded-2xl p-3 opacity-85 hidden lg:flex flex-col justify-between bg-white/80 backdrop-blur-xs border-[#E8DDD8]">
            <div className="flex justify-between items-center text-[11px] text-[#7F1D3F] font-mono font-bold">
              <span>Frame 02: Flowchart</span>
              <span className="material-symbols-outlined text-sm">aspect_ratio</span>
            </div>
            <div className="flex gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#FFF8F0] border border-[#E8B7C2] flex items-center justify-center text-[#7F1D3F] text-xs font-bold">API</div>
              <div className="w-9 h-9 rounded-xl bg-[#FAF6F2] border border-[#E8DDD8] flex items-center justify-center text-[#292323] text-xs font-bold">AUTH</div>
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E8DDD8] flex items-center justify-center text-[#A63D57] text-xs font-bold">SYNC</div>
            </div>
            <div className="text-[10px] text-[#786C6C] font-mono">1420 × 860px • 60 FPS</div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="relative z-10 w-full max-w-[460px] mx-auto">
          <div className="absolute -inset-2 bg-gradient-to-br from-[#E8B7C2]/30 via-[#FFF8F0]/40 to-transparent rounded-3xl blur-xl opacity-70 -z-10" />

          <div className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(41,35,35,0.12)] p-7 sm:p-9 border border-[#E8DDD8] relative animate-fade-in-up">
            {/* Logo & Headline */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#7F1D3F] flex items-center justify-center shadow-burgundy-btn mb-3 hover:scale-105 transition-transform duration-200">
                <span className="material-symbols-outlined text-white text-[26px]">draw</span>
              </div>
              <h1 className="font-headline text-2xl font-bold tracking-tight text-[#292323] text-center">Boardly</h1>
              <p className="text-xs text-[#786C6C] text-center mt-0.5">Create. Collaborate. Imagine.</p>
            </div>

            {/* Tab Switcher */}
            <div className="bg-[#FFF8F0] p-1 rounded-2xl flex items-center mb-6 border border-[#E8DDD8]">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); }}
                className={`flex-1 py-2 text-center text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  tab === 'login'
                    ? 'bg-[#7F1D3F] text-white shadow-sm'
                    : 'text-[#786C6C] hover:text-[#292323]'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">lock</span>
                Login
              </button>
              <button
                type="button"
                onClick={() => { setTab('signup'); setError(''); }}
                className={`flex-1 py-2 text-center text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  tab === 'signup'
                    ? 'bg-[#7F1D3F] text-white shadow-sm'
                    : 'text-[#786C6C] hover:text-[#292323]'
                }`}
              >
                <span className="material-symbols-outlined text-[17px]">person_add</span>
                Sign Up
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'signup' && (
                <Input
                  label="FULL NAME"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  icon={<span className="material-symbols-outlined text-[19px]">badge</span>}
                />
              )}

              <Input
                label="WORK EMAIL"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                icon={<span className="material-symbols-outlined text-[19px]">mail</span>}
              />

              <div>
                <Input
                  label="PASSWORD"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<span className="material-symbols-outlined text-[19px]">lock</span>}
                  rightIcon={
                    <span className="material-symbols-outlined text-[19px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  }
                  onRightIconClick={() => setShowPassword(!showPassword)}
                />
              </div>

              {tab === 'login' && (
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#7F1D3F] border-[#E8DDD8]"
                    />
                    <label htmlFor="remember" className="text-xs text-[#786C6C] select-none cursor-pointer">
                      Remember me
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => alert('For this demo, use the instant demo buttons below.')}
                    className="text-xs text-[#7F1D3F] hover:text-[#651630] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                icon={<span className="material-symbols-outlined text-base">arrow_forward</span>}
                iconPosition="right"
                className="h-11 mt-2"
              >
                {tab === 'login' ? 'Continue to Workspace' : 'Create Free Account'}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="h-px bg-[#E8DDD8] flex-1" />
              <span className="px-3 text-[11px] uppercase tracking-wider text-[#786C6C] font-medium">or continue with</span>
              <div className="h-px bg-[#E8DDD8] flex-1" />
            </div>

            {/* SSO Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemo('alex')}
                icon={<span className="material-symbols-outlined text-[18px] text-[#7F1D3F]">domain</span>}
              >
                Google SSO
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDemo('sarah')}
                icon={<span className="material-symbols-outlined text-[18px] text-[#7F1D3F]">terminal</span>}
              >
                GitHub SSO
              </Button>
            </div>

            {/* Demo Quick Bar */}
            <div className="bg-[#FFF8F0] border border-[#E8B7C2]/60 rounded-2xl p-3 text-center">
              <span className="text-[11px] font-semibold text-[#7F1D3F] uppercase tracking-wider block mb-2">
                Instant One-Click Demo
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="white"
                  size="xs"
                  className="flex-1"
                  onClick={() => handleDemo('alex')}
                  icon={<span className="w-2 h-2 rounded-full bg-[#7F1D3F]" />}
                >
                  Alex (Lead)
                </Button>
                <Button
                  variant="white"
                  size="xs"
                  className="flex-1"
                  onClick={() => handleDemo('sarah')}
                  icon={<span className="w-2 h-2 rounded-full bg-[#A63D57]" />}
                >
                  Sarah (Designer)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
