'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Sparkles, Wine, Compass, Shirt, ChevronLeft, ChevronRight, ArrowRight, Award, Gift, ArrowUp, Heart } from 'lucide-react';

const CAROUSEL_IMAGES = [
  { src: '/Mr.Felix1.jpeg', title: 'Felix’s 50th Jubilee', subtitle: 'A Golden Celebration of Life' },
  { src: '/Mr.Felix2.jpeg', title: 'Raise a Toast', subtitle: 'Celebrating five decades of grace' },
  { src: '/Mr.Felix3.jpeg', title: 'An Exquisite Evening', subtitle: 'Fine dining & beautiful memories' },
  { src: '/Mr.Felix4.jpeg', title: 'Sweet Achievements', subtitle: 'A life filled with blessings' },
  { src: '/Mr.Felix5.jpeg', title: 'Blessings', subtitle: 'A life filled with blessings' },
];

const TIMELINE_DECADES = [
  {
    decade: '1976 – 1985',
    title: 'The Golden Beginnings',
    desc: 'Born into grace, raised with wisdom. The early years lay down a foundation of compassion, integrity, and a deep appreciation for community service.'
  },
  {
    decade: '1986 – 1995',
    title: 'Academic & Creative Growth',
    desc: 'Excelled academically while discovering a passion for cultural arts, creative writing, and leadership. Nurtured lifelong friendships and ideals.'
  },
  {
    decade: '1996 – 2005',
    title: 'Family & Professional Legacy',
    desc: 'Union of hearts, professional milestones, and the birth of blessings. Built a thriving professional reputation marked by dedication and vision.'
  },
  {
    decade: '2006 – 2015',
    title: 'Strength, Grace & Leadership',
    desc: 'A period of profound personal and leadership development. Serving as a mentor, guiding peers, and establishing deeply rooted family ideals.'
  },
  {
    decade: '2016 – 2026',
    title: 'The Jubilee Horizon',
    desc: 'Five full decades of achievements, grace, and blessings. Looking back with ultimate gratitude and stepping forward into a brilliant golden horizon.'
  }
];

const ITINERARY_ITEMS = [
  { time: '06:00 PM', title: 'Arrival & Red Carpet Toast', desc: 'Champagne and gourmet canapés reception with live photography.' },
  { time: '07:15 PM', title: 'Welcome Address & Prayers', desc: 'Speeches and appreciation by family members.' },
  { time: '07:30 PM', title: 'Grand Jubilee Dinner', desc: 'An exquisite culinary experience accompanied by light musical selections.' },
  { time: '09:00 PM', title: 'The Jubilee Cake & Tribute toast', desc: 'Cutting the cake, champagne toast, and lifetime tribute video.' },
  { time: '09:30 PM', title: 'Celebration Dance Floor Opens', desc: 'Live musical performances and dancing until midnight.' },
];

// ─── Image Slideshow / Carousel Component ──────────────────────────────────────
function HeroCarousel({ showDetails }: { showDetails: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % CAROUSEL_IMAGES.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const prev = () => setIndex(i => (i - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);
  const next = () => setIndex(i => (i + 1) % CAROUSEL_IMAGES.length);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
      {CAROUSEL_IMAGES.map((img, i) => (
        <div
          key={img.src}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${i === index ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
            }`}
          style={{ transitionProperty: 'opacity, transform' }}
        >
          <img src={img.src} alt={img.title} className="w-full h-full object-cover object-top select-none" />

          {/* Base light vignette overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_100%,#050505_5%)]" />

          {/* Dynamic background overlay - fades in only when details are active */}
          <div className={`absolute inset-0 bg-[#050505]/45 transition-opacity duration-1000 ease-in-out ${showDetails ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
            }`} />
          <div className={`absolute inset-0 bg-gradient-to-b from-[#050505]/30 via-transparent to-[#050505]/85 transition-opacity duration-1000 ease-in-out ${showDetails ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
            }`} />
        </div>
      ))}

      {/* Manual buttons with glassmorphism */}
      <button
        onClick={prev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-[#c9a84c]/20 bg-black/45 hover:bg-black/85 hover:border-[#c9a84c] text-[#ffe066] flex items-center justify-center transition-all z-20 backdrop-blur-md cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-[#c9a84c]/20 bg-black/45 hover:bg-black/85 hover:border-[#c9a84c] text-[#ffe066] flex items-center justify-center transition-all z-20 backdrop-blur-md cursor-pointer"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─── Drifting Gold Dust Effect ──────────────────────────────────────────────────
function GoldDust() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const list = Array.from({ length: 45 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 15,
      size: 1.5 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.5,
      sway: 15 + Math.random() * 25,
    }));
    setParticles(list);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-b from-[#ffe066] to-[#c9a84c] shadow-[0_0_8px_rgba(201,168,76,0.6)]"
          style={{
            bottom: '-20px',
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `gold-drift ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
            '--sway-x': `${p.sway}px`,
          } as React.CSSProperties}
        />
      ))}
      <style jsx global>{`
        @keyframes gold-drift {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: 0.7; }
          50% { transform: translateY(-50vh) translateX(calc(var(--sway-x) * 0.5)) scale(1.1); }
          100% { transform: translateY(-110vh) translateX(var(--sway-x)) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Countdown Timer ────────────────────────────────────────────────────────────
function Countdown() {
  const target = new Date('2026-06-28T18:00:00');
  const calc = () => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    };
  };

  const [time, setTime] = useState(calc());
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-center gap-3 md:gap-5">
      {[
        { val: time.d, label: 'Days' },
        { val: time.h, label: 'Hours' },
        { val: time.m, label: 'Mins' },
        { val: time.s, label: 'Secs' },
      ].map(({ val, label }, i) => (
        <div key={label} className="flex items-center gap-3 md:gap-5">
          <div className="flex flex-col items-center">
            <div
              className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 12, 5, 0.8) 0%, rgba(32, 24, 8, 0.8) 100%)',
                border: '1px solid rgba(201, 168, 76, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
              }}
            >
              <span className="text-lg md:text-3xl font-extrabold font-display gold-text">
                {String(val).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[8px] tracking-[0.25em] uppercase text-[#c9a84c]/65 mt-1 md:mt-2 font-bold">
              {label}
            </span>
          </div>
          {i < 3 && (
            <span className="text-lg md:text-xl font-light text-[#c9a84c]/30 mb-4 md:mb-6 animate-pulse">·</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [tokenInput, setTokenInput] = useState('');
  const [showDetails, setShowDetails] = useState(true);
  const [isInteracted, setIsInteracted] = useState(false);
  const [activeDecade, setActiveDecade] = useState(0);
  const passcodeInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isInteracted) return;
    const timer = setTimeout(() => {
      setShowDetails(false);
    }, 6000); // Auto-hide details after 6 seconds
    return () => clearTimeout(timer);
  }, [isInteracted]);

  const handleAccessRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      router.push(`/rsvp?token=${tokenInput.trim()}`);
    }
  };

  const scrollToRsvp = () => {
    const heroSection = document.getElementById('hero');
    heroSection?.scrollIntoView({ behavior: 'smooth' });
    setShowDetails(true);
    setIsInteracted(true);
    setTimeout(() => {
      passcodeInputRef.current?.focus();
    }, 850);
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#f5f0e8] relative flex flex-col overflow-x-hidden">

      {/* Golden dust & screen overlays */}
      <GoldDust />

      {/* ── LUXURY MENU NAVBAR ── */}
      <header className="absolute top-0 left-0 right-0 z-30 flex justify-between items-center px-6 md:px-16 py-6 select-none animate-fadeInUp">
        <div className="text-[#ffe066] font-display text-lg tracking-widest font-semibold flex items-center gap-2">
          <span>F.50</span>
          <span className="text-[8px] px-2 py-0.5 border border-[#c9a84c]/30 rounded text-[#c9a84c] uppercase font-bold tracking-[0.2em]">Jubilee</span>
        </div>
        <nav className="hidden lg:flex items-center gap-10 text-[9px] tracking-[0.3em] uppercase text-[#f5f0e8]/65 font-bold">
          <a href="#itinerary" className="hover:text-[#ffe066] transition-colors relative group">
            Itinerary
            <span className="absolute bottom-[-4px] left-0 w-0 h-[1px] bg-[#c9a84c] transition-all group-hover:w-full" />
          </a>
          <a href="#legacy" className="hover:text-[#ffe066] transition-colors relative group">
            Decades Timeline
            <span className="absolute bottom-[-4px] left-0 w-0 h-[1px] bg-[#c9a84c] transition-all group-hover:w-full" />
          </a>
          <a href="#highlights" className="hover:text-[#ffe066] transition-colors relative group">
            Highlights
            <span className="absolute bottom-[-4px] left-0 w-0 h-[1px] bg-[#c9a84c] transition-all group-hover:w-full" />
          </a>
        </nav>
        <button
          onClick={scrollToRsvp}
          className="px-5 py-2 border border-[#c9a84c]/30 hover:border-[#c9a84c] rounded-full text-[9px] tracking-widest uppercase text-[#ffe066] hover:bg-[#c9a84c]/10 transition-all font-bold cursor-pointer"
        >
          Access RSVP
        </button>
      </header>

      {/* ── SECTION 1: HERO VIEWPORT (Full Screen) ── */}
      <section id="hero" className="relative min-h-screen w-full flex flex-col justify-between items-center px-6 pt-24 pb-6 md:py-12 text-center">
        {/* Slideshow background */}
        <HeroCarousel showDetails={showDetails} />

        {/* Outer details wrapper that controls visibility/transitions of both badge and details */}
        <div className={`w-full flex-1 flex flex-col justify-between items-center transition-all duration-1000 ease-in-out ${showDetails
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
          }`}>
          
          {/* Top Header Badge */}
          <div className="relative z-20 animate-fadeInUp mt-4">
            <div className="flex items-center gap-3">
              <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#c9a84c]" />
              <span className="text-[10px] tracking-[0.6em] uppercase text-[#ffe066] font-bold">
                Felix’s Golden Jubilee
              </span>
              <span className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#c9a84c]" />
            </div>
          </div>

          {/* Centered Typography & Action */}
          <div className="max-w-3xl w-full space-y-4 md:space-y-8 relative z-20 mt-auto mb-4 md:mb-12">
            {/* Manual close/hide button */}
            <button
              onClick={() => {
                setShowDetails(false);
                setIsInteracted(true);
              }}
              className="absolute -top-10 right-4 text-[#c9a84c]/50 hover:text-[#ffe066] text-[9px] tracking-widest uppercase font-bold transition-colors flex items-center gap-1 cursor-pointer"
              aria-label="Hide invitation details"
            >
              <span>Hide Info</span>
              <span className="text-xs">×</span>
            </button>
            <div className="space-y-1.5 md:space-y-4">
              <p className="text-3xl sm:text-4xl md:text-7xl text-[#f0d060] select-none" style={{ fontFamily: 'var(--font-great-vibes)' }}>
                Celebrating 50 Years
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-8xl font-black tracking-tight leading-none font-display">
                GRACE, LOVE & <br />
                <span className="shimmer-text">ELEGANCE</span>
              </h1>
            </div>

            {/* Luxury Divider */}
            <div className="hidden md:flex items-center justify-center gap-4 w-48 mx-auto">
              <span className="h-[1px] bg-gradient-to-r from-transparent to-[#c9a84c]/50 flex-1" />
              <Sparkles className="w-4 h-4 text-[#c9a84c] animate-pulse" />
              <span className="h-[1px] bg-gradient-to-l from-transparent to-[#c9a84c]/50 flex-1" />
            </div>

            {/* Countdown timer */}
            <div className="space-y-2 md:space-y-4">
              <p className="text-[#c9a84c]/50 text-[9px] tracking-[0.4em] uppercase font-bold">
                Counting down to the grand celebration
              </p>
              <Countdown />
            </div>

            {/* Code Access Input (Replaces card button) */}
            <div className="max-w-md mx-auto pt-2 md:pt-6">
              <form onSubmit={handleAccessRsvp} className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center w-full bg-black/40 p-1.5 sm:p-2 border border-[#c9a84c]/20 sm:border-[#c9a84c]/30 rounded-xl sm:rounded-2xl backdrop-blur-md">
                <input
                  ref={passcodeInputRef}
                  type="text"
                  placeholder="Enter Invitation Code"
                  value={tokenInput}
                  onChange={e => {
                    setTokenInput(e.target.value);
                    setIsInteracted(true);
                  }}
                  onFocus={() => setIsInteracted(true)}
                  className="w-full bg-transparent px-3 py-2 sm:px-4 sm:py-2.5 outline-none text-sm placeholder-[#f5f0e8]/30 font-medium text-white"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-[#c9a84c] to-[#ffe066] hover:shadow-[0_0_20px_rgba(201,168,76,0.5)] transition-all text-[#050505] font-black tracking-widest text-xs uppercase rounded-lg sm:rounded-xl flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  <span>Access RSVP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-[#c9a84c]/40 italic mt-2.5">
                *Enter your personal invitation passcode to RSVP and claim entry passes.
              </p>
            </div>
          </div>
        </div>

        {/* Reveal details button */}
        <div className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-30 transition-all duration-1000 ease-in-out ${!showDetails
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-95 pointer-events-none'
          }`}>
          <button
            onClick={() => {
              setShowDetails(true);
              setIsInteracted(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-[#c9a84c] to-[#ffe066] hover:shadow-[0_0_20px_rgba(201,168,76,0.6)] transition-all text-[#050505] font-black tracking-widest text-[9px] uppercase rounded-full flex items-center gap-2 cursor-pointer backdrop-blur-md border border-[#ffe066]/30 shadow-2xl animate-pulse-gold"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#050505]" />
            <span>View Invitation Details</span>
          </button>
        </div>

        {/* Scroll helper */}
        <div className="relative z-20 flex flex-col items-center gap-2 text-[#c9a84c]/40 text-[9px] tracking-[0.3em] uppercase font-bold animate-bounce mt-4 select-none">
          <span>Scroll to Discover</span>
          <span className="text-xs">↓</span>
        </div>
      </section>

      {/* ── SECTION 2: SLIDE-THROUGH GALLERY / THEME DETAILS (Itinerary Section) ── */}
      <section id="itinerary" className="relative py-24 px-6 max-w-5xl mx-auto w-full space-y-24 z-20">

        {/* Intro statement */}
        <div className="text-center space-y-4">
          <span className="text-[#ffe066] text-[9px] tracking-[0.4em] uppercase font-bold">The Event Agenda</span>
          <h2 className="text-3xl md:text-5xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
            The Golden Jubilee Celebration
          </h2>
          <p className="text-[#f5f0e8]/65 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Half a century of remarkable memories, lessons, and blessings. We invite you to step into an evening of high fashion, culinary arts, and toast to Felix’s beautiful milestone.
          </p>
        </div>

        {/* Two Column Layout: Event details (left) & Timeline itinerary (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Left Column: Event details cards */}
          <div className="lg:col-span-5 space-y-6">
            <DetailBlock
              icon={<Calendar className="w-6 h-6 text-[#c9a84c]" />}
              label="Celebration Date"
              title="Saturday, June 28, 2026"
              desc="Please secure entry pass via RSVP link before the deadline."
            />
            <DetailBlock
              icon={<Clock className="w-6 h-6 text-[#c9a84c]" />}
              label="Arrival Time"
              title="6:00 PM – 11:00 PM"
              desc="Cocktail reception starts at 6 PM. Grand dinner at 7:30 PM."
            />
            <DetailBlock
              icon={<MapPin className="w-6 h-6 text-[#c9a84c]" />}
              label="Event Location"
              title="Grand Event Hall, Downtown"
              desc="Exclusive valet parking will be available for all invited guests."
            />
            <DetailBlock
              icon={<Shirt className="w-6 h-6 text-[#c9a84c]" />}
              label="Dress Code Theme"
              title="Black Tie / Elegant Formal"
              desc="Colors of the night: Black, Gold and White. Strictly enforced."
            />
          </div>

          {/* Right Column: Interactive Schedule Timeline */}
          <div className="lg:col-span-7 p-8 rounded-3xl bg-gradient-to-br from-[#121212] to-[#0a0803] border border-[#c9a84c]/20 shadow-[0_12px_40px_rgba(0,0,0,0.6)] space-y-8 relative">
            <div className="absolute top-0 right-8 w-24 h-24 bg-[#c9a84c]/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <span className="text-[8px] tracking-[0.3em] uppercase text-[#ffe066] font-bold">Time Itinerary</span>
              <h3 className="text-xl font-bold text-white mt-1" style={{ fontFamily: 'var(--font-playfair)' }}>Evening Program</h3>
            </div>

            <div className="relative border-l border-[#c9a84c]/20 pl-6 ml-2 space-y-8">
              {ITINERARY_ITEMS.map((item, idx) => (
                <div key={item.time} className="relative group">
                  {/* Timeline point */}
                  <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-[#050505] border-2 border-[#ffe066] group-hover:scale-125 transition-transform duration-300" />

                  {/* Content */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-[#ffe066] font-semibold bg-[#ffe066]/10 px-2 py-0.5 rounded border border-[#ffe066]/20">
                      {item.time}
                    </span>
                    <h4 className="text-sm font-semibold text-white tracking-wide mt-1.5">{item.title}</h4>
                    <p className="text-[#f5f0e8]/50 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </section>

      {/* ── SECTION 3: INTERACTIVE DECADES TIMELINE (Legacy Timeline) ── */}
      <section id="legacy" className="relative py-24 bg-[#0a0a0a] border-y border-[#c9a84c]/15 overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#c9a84c]/3 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 space-y-16 relative z-10">

          <div className="text-center space-y-4">
            <span className="text-[#ffe066] text-[9px] tracking-[0.4em] uppercase font-bold">Decades of Grace</span>
            <h2 className="text-3xl md:text-5xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
              Felix’s Legacy Timeline
            </h2>
            <p className="text-[#f5f0e8]/65 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              Take a walk through five decades of life, family devotion, and remarkable leadership milestones.
            </p>
          </div>

          {/* Timeline Nodes */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            {TIMELINE_DECADES.map((d, idx) => (
              <button
                key={d.decade}
                onClick={() => setActiveDecade(idx)}
                className={`px-5 py-2.5 rounded-full border transition-all text-[10px] tracking-widest uppercase font-bold cursor-pointer ${activeDecade === idx
                    ? 'bg-gradient-to-r from-[#c9a84c] to-[#ffe066] text-[#050505] border-[#ffe066] shadow-[0_0_15px_rgba(201,168,76,0.4)]'
                    : 'bg-black/50 text-[#c9a84c]/80 border-[#c9a84c]/20 hover:border-[#c9a84c] hover:text-[#ffe066]'
                  }`}
              >
                {d.decade.split(' – ')[0]}s
              </button>
            ))}
          </div>

          {/* Decade Milestone Content Card */}
          <div className="max-w-3xl mx-auto">
            <div
              key={activeDecade}
              className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#131313] to-[#0e0c05] border border-[#c9a84c]/25 shadow-2xl relative overflow-hidden animate-zoomIn"
            >
              {/* Gold Ornament icon */}
              <div className="absolute top-6 right-6 text-[#c9a84c]/10 text-6xl font-serif select-none pointer-events-none">✦</div>

              <div className="space-y-4">
                <span className="text-[10px] font-mono text-[#ffe066] font-bold tracking-widest uppercase bg-[#ffe066]/10 px-3 py-1 rounded-full border border-[#ffe066]/20">
                  {TIMELINE_DECADES[activeDecade].decade}
                </span>
                <h3 className="text-2xl md:text-3xl font-normal text-white mt-2" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {TIMELINE_DECADES[activeDecade].title}
                </h3>
                <p className="text-[#f5f0e8]/70 text-sm md:text-base leading-relaxed font-light pt-2">
                  {TIMELINE_DECADES[activeDecade].desc}
                </p>
                <div className="pt-6 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ffe066] animate-ping" />
                  <span className="text-[9px] tracking-widest uppercase text-[#c9a84c]/60 font-bold">50 Years of Grace</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION 4: AN EXQUISITE EVENING AWAITS (Highlights & expectation) ── */}
      <section id="highlights" className="relative py-24 px-6 max-w-5xl mx-auto w-full space-y-16 z-20">

        <div className="text-center space-y-4">
          <span className="text-[#ffe066] text-[9px] tracking-[0.4em] uppercase font-bold">The Experience</span>
          <h2 className="text-3xl md:text-5xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
            What to Expect
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HighlightCard
            num="01"
            icon={<Wine className="w-5 h-5 text-[#ffe066] shrink-0" />}
            title="Champagne Reception"
            desc="A luxury selection of fine bubbly drinks accompanied by gourmet canapés upon your arrival."
          />
          <HighlightCard
            num="02"
            icon={<Sparkles className="w-5 h-5 text-[#ffe066] shrink-0" />}
            title="Live String Quartet"
            desc="Classical jazz and acoustic interpretations of timeless classics during the grand dinner."
          />
          <HighlightCard
            num="03"
            icon={<Compass className="w-5 h-5 text-[#ffe066] shrink-0" />}
            title="Memories Exhibition"
            desc="A museum-like path highlighting the journey, achievements, and blessings of Felix's life."
          />
        </div>
      </section>

      {/* ── SECTION 5: ROBUST FOOTER RSVP CTA CARD ── */}
      <section className="py-16 px-6 max-w-4xl mx-auto w-full relative z-20">
        <div className="p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-[#121212] via-[#0b0a03] to-[#121212] border border-[#c9a84c]/30 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#c9a84c 0,#c9a84c 1px,transparent 1px,transparent 10px)' }} />
          <div className="absolute -left-12 -top-12 w-32 h-32 rounded-full border border-[#c9a84c]/10 animate-spin-slow pointer-events-none" />

          <Heart className="w-8 h-8 text-[#ffe066] mx-auto animate-pulse" />

          <div className="space-y-2 relative z-10">
            <h3 className="text-2xl md:text-4xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
              An Exquisite Evening Awaits
            </h3>
            <p className="text-[#f5f0e8]/65 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
              We look forward to raising a glass in toast to Felix’s beautiful lifetime milestone. Secure your presence by inputting your passcode at the top invitation desk.
            </p>
          </div>

          <div className="pt-4 relative z-10">
            <button
              onClick={scrollToRsvp}
              className="px-8 py-3.5 bg-gradient-to-r from-[#c9a84c] to-[#ffe066] hover:shadow-[0_0_30px_rgba(201,168,76,0.6)] text-[#050505] font-black tracking-widest text-xs uppercase rounded-full flex items-center justify-center gap-2 mx-auto transition-all cursor-pointer"
            >
              <span>Scroll to RSVP Entry</span>
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: FOOTER BANNER ── */}
      <footer className="w-full py-12 bg-black border-t border-[#c9a84c]/15 text-center relative z-20">
        <div className="max-w-xl mx-auto space-y-4 px-6">
          <p className="text-3xl text-[#ffe066]" style={{ fontFamily: 'var(--font-great-vibes)' }}>
            Celebrating Felix
          </p>
          <p className="text-[#c9a84c]/50 text-[10px] tracking-[0.4em] uppercase font-bold">
            Five Decades of Grace &nbsp;·&nbsp; 2026
          </p>
          <div className="h-[1px] w-24 bg-[#c9a84c]/20 mx-auto" />
          <p className="text-[#f5f0e8]/25 text-[9px] leading-relaxed">
            This invitation portal is secure and intended strictly for the invited guests of Felix's 50th Birthday.
          </p>
        </div>
      </footer>
    </main>
  );
}

function DetailBlock({ icon, label, title, desc }: { icon: React.ReactNode; label: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-[#121212] to-[#0e0c03] border border-[#c9a84c]/15 hover:border-[#c9a84c]/35 transition-all shadow-md">
      <div className="w-12 h-12 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center shrink-0 border border-[#c9a84c]/20">
        {icon}
      </div>
      <div className="space-y-1">
        <span className="text-[9px] tracking-widest uppercase text-[#c9a84c]/65 font-bold">{label}</span>
        <h4 className="text-base font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-playfair)' }}>{title}</h4>
        <p className="text-[#f5f0e8]/55 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function HighlightCard({ icon, title, desc, num }: { icon: React.ReactNode; title: string; desc: string; num: string }) {
  return (
    <div
      className="p-6 rounded-2xl text-left space-y-4 group hover:scale-[1.02] hover:border-[#c9a84c]/50 transition-all duration-300 cursor-default flex flex-col bg-gradient-to-br from-[#131313] to-[#0a0904] border border-[#c9a84c]/12 shadow-[0_4px_24px_rgba(0,0,0,0.5)] relative overflow-hidden"
    >
      <div className="absolute top-2 right-4 text-xs font-mono font-bold text-[#c9a84c]/20 group-hover:text-[#c9a84c]/40 transition-colors">
        {num}
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center border border-[#c9a84c]/15 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="space-y-1">
        <h4
          className="text-base font-bold text-white tracking-wide"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {title}
        </h4>
        <p className="text-[#f5f0e8]/45 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
