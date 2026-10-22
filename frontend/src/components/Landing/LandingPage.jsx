import { useState, useEffect } from 'react';
import { Button, Badge, Card } from '../common';

/**
 * LandingPage Component for Boardly
 * Premium SaaS landing page with 3D hero canvas, mouse-tracking tilt, floating orbital chips,
 * and staggered text entrance animations. Strictly Burgundy & Cream design system.
 */
export default function LandingPage({ onGetStarted, onSignIn }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [heroReady, setHeroReady] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger entrance animation shortly after mount
  useEffect(() => {
    const t = setTimeout(() => setHeroReady(true), 80);
    return () => clearTimeout(t);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  // Mouse-tracking tilt for 3D board
  const handleHeroMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * 5, y: dx * -9 });
  };

  const handleHeroMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
      ),
      title: 'Real-Time Collaboration',
      desc: 'Watch teammates draw and update the board live with sub-50ms sync. Multi-user cursor tracking built in.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
        </svg>
      ),
      title: 'Infinite Creative Canvas',
      desc: 'Sketch ideas, map architectures, and organize workflows on an expansive collaborative canvas with 60 FPS panning.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
        </svg>
      ),
      title: 'Precision Vector Drawing',
      desc: 'Freehand pen strokes, geometric shapes, customizable stroke widths, and dashed connectors tuned for clarity.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      title: 'Collaborative Sticky Notes',
      desc: 'Add pastel cream and blush notes to brainstorm asynchronously. Color-tag thoughts and attribute ideas seamlessly.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      ),
      title: 'Instant 6-Character Join',
      desc: 'Invite collaborators with a clean room code like X9K-72M. Instant join flow with zero friction.',
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
      title: 'One-Click Board Export',
      desc: 'Export your boards as high-resolution PNG images. Embed directly into PRs, design documentation, or team wikis.',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Launch a Whiteboard',
      desc: 'Start with a clean canvas or a curated system architecture blueprint in one click.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M12 8v8M8 12h8" />
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Share the Room Code',
      desc: 'Share a 6-character room code or instant link. Teammates jump in without waiting.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Create in Real Time',
      desc: 'Draw, annotate, and brainstorm together with live cursors and instant socket synchronization.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6F2] text-[#292323] font-sans overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-xl shadow-xs' : 'bg-white/80 backdrop-blur-md'
        } border-b border-[#E8DDD8]`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a
            href="#"
            className="flex items-center gap-2.5 group"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-[#7F1D3F] flex items-center justify-center shadow-burgundy-btn group-hover:bg-[#651630] transition-colors">
              <span className="material-symbols-outlined text-white text-[20px]">draw</span>
            </div>
            <span className="font-headline font-bold text-xl text-[#292323] tracking-tight">Boardly</span>
          </a>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#786C6C]">
            <button onClick={() => scrollTo('features')} className="hover:text-[#292323] transition-colors">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-[#292323] transition-colors">How It Works</button>
            <button onClick={() => scrollTo('collaboration')} className="hover:text-[#292323] transition-colors">Collaboration</button>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onSignIn}>Sign In</Button>
            <Button variant="primary" size="sm" onClick={onGetStarted}>Get Started Free</Button>
          </div>

          <button
            type="button"
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-[#FAF6F2] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-[#292323] rounded transition-transform duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[#292323] rounded transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-[#292323] rounded transition-transform duration-200 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E8DDD8] bg-white px-4 py-4 flex flex-col gap-3 animate-fade-in-up">
            <button onClick={() => scrollTo('features')} className="text-left text-sm font-medium text-[#786C6C] hover:text-[#292323] py-1.5 transition-colors">Features</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-left text-sm font-medium text-[#786C6C] hover:text-[#292323] py-1.5 transition-colors">How It Works</button>
            <button onClick={() => scrollTo('collaboration')} className="text-left text-sm font-medium text-[#786C6C] hover:text-[#292323] py-1.5 transition-colors">Collaboration</button>
            <hr className="border-[#E8DDD8]" />
            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={onSignIn}>Sign In</Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={onGetStarted}>Get Started</Button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section
        className="pt-24 pb-20 md:pt-36 md:pb-28 px-4 sm:px-6 max-w-7xl mx-auto"
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — editorial copy */}
          <div className="max-w-xl">
            <div className="mb-6 animate-hero-text" style={{ animationDelay: '0ms' }}>
              <Badge variant="live" size="md">Your Space to Create Together</Badge>
            </div>

            <h1
              className="font-headline font-extrabold text-4xl md:text-5xl lg:text-[58px] leading-[1.08] tracking-tight text-[#292323] mb-5 animate-hero-text"
              style={{ animationDelay: '100ms' }}
            >
              Think together.{' '}<br />
              <span className="text-[#7F1D3F]">Build ideas</span>{' '}<br />
              together.
            </h1>

            <p
              className="text-[#786C6C] text-lg leading-relaxed mb-8 max-w-lg animate-hero-text"
              style={{ animationDelay: '200ms' }}
            >
              Boardly is a real-time collaborative whiteboard where teams turn ideas into production-ready plans. Sketch concepts, share notes, and brainstorm seamlessly on an infinite canvas.
            </p>

            <div className="flex flex-wrap gap-3 mb-8 animate-hero-text" style={{ animationDelay: '300ms' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={onGetStarted}
                icon={<span className="material-symbols-outlined text-[20px]">auto_awesome</span>}
              >
                Start Your Whiteboard
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => scrollTo('features')}
                icon={<span className="material-symbols-outlined text-[18px]">arrow_downward</span>}
                iconPosition="right"
              >
                Explore Features
              </Button>
            </div>

            <p className="text-xs text-[#786C6C] font-medium flex items-center gap-2 animate-hero-text" style={{ animationDelay: '400ms' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#7F1D3F]" />
              Zero installation required • Instant room code collaboration
            </p>
          </div>

          {/* Right — 3D whiteboard showcase */}
          <div className="relative flex items-center justify-center select-none" style={{ minHeight: '440px' }}>

            {/* ── Orbital floating chips ── */}

            {/* TOP-LEFT: Collaborators pill */}
            <div className="absolute z-20 animate-chip-1" style={{ top: '6%', left: '-2%' }}>
              <div className="bg-white border border-[#E8DDD8] rounded-2xl px-3.5 py-2.5 shadow-[0_8px_28px_rgba(41,35,35,0.13)] flex items-center gap-2.5 whitespace-nowrap">
                <div className="flex -space-x-1.5">
                  {['#7F1D3F', '#A63D57', '#786C6C'].map((c, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full ring-2 ring-white flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ backgroundColor: c }}
                    >
                      {['A', 'S', 'M'][i]}
                    </div>
                  ))}
                </div>
                <span className="text-[#292323] font-semibold text-[11px]">3 collaborating</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#7F1D3F] animate-pulse" />
              </div>
            </div>

            {/* TOP-RIGHT: Real-time sync badge */}
            <div className="absolute z-20 animate-chip-2" style={{ top: '1%', right: '-1%' }}>
              <div className="bg-[#7F1D3F] rounded-2xl px-3.5 py-2 shadow-[0_8px_24px_rgba(127,29,63,0.38)] flex items-center gap-2 text-xs font-semibold text-white whitespace-nowrap">
                <span className="material-symbols-outlined text-[15px]">sync</span>
                Real-time sync
              </div>
            </div>

            {/* LEFT-MID: Sticky note chip */}
            <div className="absolute z-20 animate-chip-3" style={{ left: '-6%', top: '42%' }}>
              <div className="bg-[#FFF8F0] border border-[#E8DDD8] rounded-xl p-3 shadow-[0_6px_22px_rgba(41,35,35,0.11)] w-36">
                <p className="text-[8px] font-bold uppercase tracking-wider text-[#7F1D3F] mb-1.5 font-mono">Sprint Goal</p>
                <p className="text-[10px] text-[#292323] leading-relaxed">Ship real-time sync before end of sprint.</p>
                <p className="text-right text-[8px] text-[#786C6C] mt-1.5 font-bold">— Alex</p>
              </div>
            </div>

            {/* BOTTOM-RIGHT: Room code chip */}
            <div className="absolute z-20 animate-chip-1" style={{ bottom: '3%', right: '-3%', animationDelay: '1.5s' }}>
              <div className="bg-white border border-[#E8DDD8] rounded-2xl px-3.5 py-2.5 shadow-[0_8px_28px_rgba(41,35,35,0.13)] flex items-center gap-2 whitespace-nowrap">
                <span className="text-[9px] font-bold text-[#786C6C] uppercase tracking-wider font-mono">Room</span>
                <div className="flex gap-1">
                  {'X9K72M'.split('').map((ch, i) => (
                    <div key={i} className="w-5 h-6 rounded-lg flex items-center justify-center font-headline font-extrabold text-[10px] border bg-[#FFF8F0] border-[#E8DDD8] text-[#7F1D3F]">
                      {ch}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BOTTOM-LEFT: Export chip */}
            <div className="absolute z-20 animate-chip-2" style={{ bottom: '13%', left: '-5%', animationDelay: '3s' }}>
              <div className="bg-white border border-[#E8DDD8] rounded-2xl px-3 py-2 shadow-[0_6px_20px_rgba(41,35,35,0.10)] flex items-center gap-1.5 text-[11px] font-semibold text-[#292323] whitespace-nowrap">
                <span className="material-symbols-outlined text-[14px] text-[#7F1D3F]">download</span>
                Export as PNG
              </div>
            </div>

            {/* ── 3D Board ── */}
            <div className="relative w-full" style={{ perspective: '1200px', perspectiveOrigin: '50% 40%' }}>
              <div
                className={heroReady ? 'animate-board-entrance' : 'opacity-0'}
                style={{
                  transform: heroReady
                    ? `perspective(1200px) rotateX(${4 + tilt.x}deg) rotateY(${-8 + tilt.y}deg)`
                    : undefined,
                  transition: 'transform 0.18s ease-out',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                  animationFillMode: 'forwards',
                }}
              >
                {/* Ambient glow behind board */}
                <div
                  className="absolute -inset-3 rounded-[32px] pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse at 60% 40%, rgba(127,29,63,0.13) 0%, transparent 68%)',
                    filter: 'blur(16px)',
                  }}
                />

                {/* Board surface */}
                <div
                  className="relative rounded-3xl overflow-hidden border border-[#E8DDD8] bg-[#FAF6F2]"
                  style={{
                    aspectRatio: '4/3',
                    boxShadow: `
                      0 2px 0 rgba(255,255,255,0.9) inset,
                      0 36px 88px rgba(41,35,35,0.20),
                      0 10px 24px rgba(41,35,35,0.12),
                      0 2px 6px rgba(41,35,35,0.08)
                    `,
                  }}
                >
                  {/* Dotted canvas grid */}
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: 'radial-gradient(#D6CECA 1.5px, transparent 1.5px)',
                      backgroundSize: '24px 24px',
                      backgroundColor: '#FAF6F2',
                    }}
                  />

                  {/* Top bar */}
                  <div className="absolute top-0 left-0 right-0 h-10 bg-white/95 border-b border-[#E8DDD8] flex items-center justify-between px-4 z-10 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-[#FFF8F0] border border-[#E8DDD8] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#7F1D3F] text-[12px]">draw</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#292323]">Q4 Architecture Sprint</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {['#7F1D3F', '#A63D57', '#786C6C'].map((c, i) => (
                        <div
                          key={i}
                          className="w-5 h-5 rounded-full ring-2 ring-white shadow-xs flex items-center justify-center text-white text-[7px] font-bold"
                          style={{ backgroundColor: c }}
                        >
                          {['A', 'S', 'M'][i]}
                        </div>
                      ))}
                      <div className="ml-1 px-2 py-0.5 rounded-md bg-[#7F1D3F] text-white text-[9px] font-bold">Share</div>
                    </div>
                  </div>

                  {/* Canvas content */}
                  <div className="absolute inset-0 pt-10 overflow-hidden">

                    {/* Node card 1 */}
                    <div className="absolute bg-white rounded-2xl shadow-md border border-[#E8DDD8] p-3.5 w-48 hover:shadow-lg transition-shadow" style={{ left: '6%', top: '16%' }}>
                      <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-[#E8DDD8]">
                        <span className="w-2 h-2 rounded-full bg-[#7F1D3F]" />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[#7F1D3F]">API Gateway</span>
                        <span className="ml-auto text-[7px] text-[#786C6C] font-mono">v2.1</span>
                      </div>
                      <p className="text-[10px] font-extrabold text-[#292323] mb-0.5">INGRESS CONTROLLER</p>
                      <p className="text-[7.5px] text-[#786C6C] mb-2">Edge Route Guard &amp; SSL</p>
                      <div className="grid grid-cols-2 gap-1.5 bg-[#FAF6F2] rounded-xl p-1.5 text-[7px] font-mono">
                        <div><div className="text-[#786C6C]">Latency</div><div className="font-bold text-[#292323]">14ms</div></div>
                        <div><div className="text-[#786C6C]">Uptime</div><div className="font-bold text-[#7F1D3F]">99.99%</div></div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <svg className="absolute pointer-events-none" style={{ left: '33%', top: '22%', width: '80px', height: '30px', overflow: 'visible' }}>
                      <defs>
                        <marker id="lp-arrow" markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
                          <path d="M 0 0 L 5 2.5 L 0 5 z" fill="#7F1D3F" />
                        </marker>
                      </defs>
                      <path d="M 0 15 Q 40 0 80 15" fill="none" stroke="#7F1D3F" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#lp-arrow)" />
                    </svg>

                    {/* Node card 2 */}
                    <div className="absolute bg-white rounded-2xl shadow-md border border-[#E8DDD8] p-3.5 w-48 hover:shadow-lg transition-shadow" style={{ left: '50%', top: '14%' }}>
                      <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-[#E8DDD8]">
                        <span className="w-2 h-2 rounded-full bg-[#A63D57]" />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-[#A63D57]">Core Runtime</span>
                        <span className="ml-auto text-[7px] text-[#786C6C] font-mono">v3.0</span>
                      </div>
                      <p className="text-[10px] font-extrabold text-[#292323] mb-0.5">SERVICE MESH</p>
                      <p className="text-[7.5px] text-[#786C6C] mb-2">Event Orchestrator</p>
                      <div className="grid grid-cols-2 gap-1.5 bg-[#FAF6F2] rounded-xl p-1.5 text-[7px] font-mono">
                        <div><div className="text-[#786C6C]">Latency</div><div className="font-bold text-[#292323]">2ms</div></div>
                        <div><div className="text-[#786C6C]">Pods</div><div className="font-bold text-[#A63D57]">6 Pods</div></div>
                      </div>
                    </div>

                    {/* Cream sticky note */}
                    <div className="absolute bg-[#FFF8F0] border border-[#E8DDD8] rounded-xl p-3 shadow-sm w-36 hover:rotate-1 transition-transform" style={{ left: '8%', bottom: '22%' }}>
                      <div className="flex items-center gap-1 mb-1.5 border-b border-[#E8DDD8] pb-1">
                        <span className="text-[7px] font-bold uppercase tracking-wider text-[#7F1D3F]">Architecture Note</span>
                        <span className="material-symbols-outlined text-[10px] text-[#7F1D3F] ml-auto">push_pin</span>
                      </div>
                      <p className="text-[7.5px] text-[#292323] leading-relaxed">Ensure broker maintains idempotent retry queue.</p>
                      <div className="mt-1.5 text-right text-[6.5px] text-[#786C6C] font-bold">— Alice</div>
                    </div>

                    {/* Rose sticky note */}
                    <div className="absolute bg-[#FAF6F2] border border-[#E8B7C2] rounded-xl p-3 shadow-sm w-32 hover:-rotate-1 transition-transform" style={{ right: '6%', bottom: '16%' }}>
                      <div className="flex items-center gap-1 mb-1.5 border-b border-[#E8B7C2]/60 pb-1">
                        <span className="text-[7px] font-bold uppercase tracking-wider text-[#7F1D3F]">Follow Up</span>
                      </div>
                      <p className="text-[7.5px] text-[#292323] leading-relaxed">Review caching strategy with infra team.</p>
                      <div className="mt-1.5 text-right text-[6.5px] text-[#786C6C] font-bold">— Sarah</div>
                    </div>

                    {/* Cursor A */}
                    <div className="absolute pointer-events-none" style={{ left: '52%', bottom: '34%' }}>
                      <div className="relative">
                        <svg viewBox="0 0 24 24" fill="none" style={{ width: '16px', height: '16px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
                          <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#7F1D3F" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                        <div className="absolute top-4 left-4 px-2 py-0.5 rounded-full text-white text-[7px] font-bold whitespace-nowrap shadow-sm" style={{ backgroundColor: '#7F1D3F' }}>Alex M.</div>
                      </div>
                    </div>

                    {/* Cursor B */}
                    <div className="absolute pointer-events-none" style={{ right: '22%', top: '55%' }}>
                      <div className="relative">
                        <svg viewBox="0 0 24 24" fill="none" style={{ width: '16px', height: '16px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
                          <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#A63D57" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
                        <div className="absolute top-4 left-4 px-2 py-0.5 rounded-full text-white text-[7px] font-bold whitespace-nowrap shadow-sm" style={{ backgroundColor: '#A63D57' }}>Sarah C.</div>
                      </div>
                    </div>
                  </div>

                  {/* Dark floating toolbar */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-[#292524] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-stone-700/60">
                    <div className="w-6 h-6 rounded-full bg-[#7F1D3F] flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[12px]">near_me</span>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[#D6CECA]">
                      <span className="material-symbols-outlined text-[12px]">edit</span>
                    </div>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[#D6CECA]">
                      <span className="material-symbols-outlined text-[12px]">note_alt</span>
                    </div>
                    <div className="w-px h-4 bg-stone-700 mx-0.5" />
                    <div className="w-3 h-3 rounded-full bg-[#7F1D3F]" />
                    <div className="w-3 h-3 rounded-full bg-[#292323]" />
                    <div className="w-3 h-3 rounded-full bg-[#A63D57]" />
                  </div>

                  {/* LIVE HUD pill */}
                  <div className="absolute top-14 left-3 bg-white/90 backdrop-blur-sm border border-[#E8DDD8] rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7F1D3F] animate-pulse" />
                    <span className="text-[8px] font-bold tracking-wider text-[#786C6C] uppercase font-mono">LIVE · 3 online</span>
                  </div>

                  {/* Right-edge depth shadow */}
                  <div className="absolute right-0 inset-y-0 w-3 pointer-events-none" style={{ background: 'linear-gradient(to left, rgba(41,35,35,0.07), transparent)' }} />
                  {/* Bottom-edge depth shadow */}
                  <div className="absolute bottom-0 inset-x-0 h-3 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(41,35,35,0.07), transparent)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS / TRUST BAR ── */}
      <div className="border-t border-b border-[#E8DDD8] bg-white/60 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-[#786C6C] font-medium">
          <span>Trusted by modern collaborative teams:</span>
          <div className="flex items-center gap-6 flex-wrap justify-center font-bold text-[#292323]">
            {['Engineering Teams', 'Design Studios', 'Remote Startups', 'Product Squads', 'Creative Orgs'].map((n) => (
              <span key={n} className="hover:text-[#7F1D3F] transition-colors">{n}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center mb-14">
          <div className="mb-4"><Badge variant="burgundy" size="md">Core Capabilities</Badge></div>
          <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-[#292323] mb-4 tracking-tight">
            Everything You Need to <br className="hidden sm:block" /> Think Together
          </h2>
          <p className="text-[#786C6C] max-w-xl mx-auto text-base leading-relaxed">
            A focused visual toolkit built for real collaboration — clean, responsive, and effortlessly intuitive.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <Card key={i} interactive padding="lg" className="group flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FFF8F0] border border-[#E8DDD8] flex items-center justify-center text-[#7F1D3F] mb-4 group-hover:bg-[#7F1D3F] group-hover:text-white group-hover:border-[#7F1D3F] transition-all duration-200 shadow-xs">
                  {f.icon}
                </div>
                <h3 className="font-headline font-bold text-lg text-[#292323] mb-2">{f.title}</h3>
                <p className="text-sm text-[#786C6C] leading-relaxed">{f.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-white scroll-mt-20 border-t border-b border-[#E8DDD8]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="mb-4"><Badge variant="burgundy" size="md">Fast &amp; Frictionless</Badge></div>
            <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-[#292323] mb-4 tracking-tight">
              From Blank Canvas to Big Ideas
            </h2>
            <p className="text-[#786C6C] max-w-lg mx-auto text-base leading-relaxed">
              Three simple steps to go from zero to collaborative flow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                <Card padding="lg" variant="container" className="hover:border-[#7F1D3F] transition-all group h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#7F1D3F] flex items-center justify-center text-white shadow-burgundy-btn shrink-0 group-hover:bg-[#651630] transition-colors">
                        {s.icon}
                      </div>
                      <div className="font-headline font-extrabold text-4xl text-[#E8DDD8] leading-none pt-1">{s.num}</div>
                    </div>
                    <h3 className="font-headline font-bold text-lg text-[#292323] mb-2">{s.title}</h3>
                    <p className="text-sm text-[#786C6C] leading-relaxed">{s.desc}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COLLABORATION HIGHLIGHT ── */}
      <section id="collaboration" className="py-20 px-4 sm:px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl border border-[#E8DDD8] overflow-hidden shadow-xs">
            <div className="grid md:grid-cols-2 items-center">
              {/* Text side */}
              <div className="p-8 md:p-12">
                <div className="mb-6"><Badge variant="live" size="md">Real-Time Collaboration</Badge></div>
                <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-[#292323] mb-4 tracking-tight leading-tight">
                  One Shared Canvas. <br /> Everyone's Vision.
                </h2>
                <p className="text-[#786C6C] text-base leading-relaxed mb-8">
                  Watch live cursor trajectories, discuss architectural decisions via color-coded sticky notes, and build collective momentum in an uncluttered creative environment.
                </p>

                <div className="space-y-3 mb-8">
                  {[
                    { name: 'Alex Morgan', role: 'Drawing with Pen tool', color: '#7F1D3F', init: 'AM' },
                    { name: 'Sarah Chen', role: 'Adding sticky notes & labels', color: '#A63D57', init: 'SC' },
                    { name: 'Marcus Osei', role: 'Reviewing in View-Only mode', color: '#786C6C', init: 'MO' },
                  ].map((c, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF6F2] border border-[#E8DDD8]">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs ring-2 ring-white" style={{ backgroundColor: c.color }}>
                        {c.init}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#292323] leading-snug">{c.name}</p>
                        <p className="text-xs text-[#786C6C]">{c.role}</p>
                      </div>
                      <div className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: c.color }} />
                    </div>
                  ))}
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={onGetStarted}
                  icon={<span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                  iconPosition="right"
                >
                  Start Collaborating
                </Button>
              </div>

              {/* Visual side */}
              <div className="bg-[#FAF6F2] border-t md:border-t-0 md:border-l border-[#E8DDD8] p-8 flex flex-col gap-4 min-h-[360px]">
                <div className="bg-white rounded-2xl p-4 border border-[#E8DDD8] shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#786C6C] mb-2 font-mono">Sample Room Code</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-1.5">
                      {'X9K72M'.split('').map((ch, i) => (
                        <div key={i} className="w-8 h-9 rounded-xl flex items-center justify-center font-headline font-extrabold text-sm border bg-[#FFF8F0] border-[#E8DDD8] text-[#7F1D3F]">
                          {ch}
                        </div>
                      ))}
                    </div>
                    <Button variant="secondary" size="xs">Copy</Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 bg-[#FFF8F0] border border-[#E8DDD8] rounded-2xl p-3 shadow-xs">
                    <p className="text-[9px] font-bold uppercase text-[#7F1D3F] mb-1 font-mono">Sprint Goal</p>
                    <p className="text-[11px] text-[#292323] leading-relaxed">Ship real-time canvas sync before end of sprint.</p>
                    <p className="text-right text-[8px] text-[#786C6C] mt-2 font-bold">— Alex</p>
                  </div>
                  <div className="flex-1 bg-[#FAF6F2] border border-[#E8B7C2] rounded-2xl p-3 shadow-xs">
                    <p className="text-[9px] font-bold uppercase text-[#7F1D3F] mb-1 font-mono">Action Item</p>
                    <p className="text-[11px] text-[#292323] leading-relaxed">Design review complete with high accessibility.</p>
                    <p className="text-right text-[8px] text-[#786C6C] mt-2 font-bold">— Sarah</p>
                  </div>
                </div>

                <div className="bg-white border border-[#E8DDD8] rounded-2xl p-4 relative overflow-hidden h-28 shadow-xs">
                  <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(#D6CECA 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  <div className="relative h-full flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="none" style={{ width: '14px', height: '14px' }}>
                        <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#7F1D3F" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                      <span className="px-2 py-0.5 rounded-full text-white text-[8px] font-bold bg-[#7F1D3F]">Alex M. (Drawing)</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="px-2 py-0.5 rounded-full text-white text-[8px] font-bold bg-[#A63D57]">Sarah C. (Annotating)</span>
                      <svg viewBox="0 0 24 24" fill="none" style={{ width: '14px', height: '14px' }}>
                        <path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="#A63D57" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative bg-[#FFF8F0] rounded-3xl border border-[#E8DDD8] overflow-hidden shadow-xs px-8 py-14">
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#D6CECA 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }} />
            <div className="relative z-10">
              <div className="mb-5"><Badge variant="burgundy" size="md">Get Started Free</Badge></div>
              <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-[#292323] mb-4 tracking-tight">
                Your Next Breakthrough <br /> Starts on Boardly.
              </h2>
              <p className="text-[#786C6C] text-base leading-relaxed mb-8 max-w-md mx-auto">
                Create a whiteboard, invite your teammates with a room code, and bring ideas to life.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button variant="primary" size="lg" onClick={onGetStarted} icon={<span className="material-symbols-outlined text-[20px]">auto_awesome</span>}>
                  Get Started Free
                </Button>
                <Button variant="outline" size="lg" onClick={onSignIn}>Sign In</Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#E8DDD8] bg-white py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-[#7F1D3F] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[16px]">draw</span>
                </div>
                <span className="font-headline font-bold text-base text-[#292323]">Boardly</span>
              </div>
              <p className="text-sm text-[#786C6C] leading-relaxed max-w-xs">A real-time collaborative whiteboard for teams who think better together.</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#292323] mb-3">Product</p>
              <div className="flex flex-col gap-2">
                <button onClick={() => scrollTo('features')} className="text-sm text-left text-[#786C6C] hover:text-[#292323] transition-colors">Features</button>
                <button onClick={() => scrollTo('how-it-works')} className="text-sm text-left text-[#786C6C] hover:text-[#292323] transition-colors">How It Works</button>
                <button onClick={() => scrollTo('collaboration')} className="text-sm text-left text-[#786C6C] hover:text-[#292323] transition-colors">Collaboration</button>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#292323] mb-3">Account</p>
              <div className="flex flex-col gap-2">
                <button onClick={onSignIn} className="text-sm text-left text-[#786C6C] hover:text-[#292323] transition-colors">Sign In</button>
                <button onClick={onGetStarted} className="text-sm text-left text-[#786C6C] hover:text-[#292323] transition-colors">Get Started Free</button>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E8DDD8] pt-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-[#786C6C]">© {new Date().getFullYear()} Boardly. All rights reserved.</p>
            <p className="text-xs text-[#786C6C]">Built for teams who create together.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
