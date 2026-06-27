'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, MapPin, Sparkles, Wine, Compass, Shirt, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const CAROUSEL_IMAGES = [
  { src: '/premium_cover.png', title: 'Moniye’s 50th Jubilee', subtitle: 'A Golden Celebration of Life' },
  { src: '/champagne_toast.png', title: 'Raise a Toast', subtitle: 'Celebrating five decades of grace' },
  { src: '/golden_decor.png', title: 'An Exquisite Evening', subtitle: 'Fine dining & beautiful memories' },
  { src: '/luxury_cake.png', title: 'Sweet Achievements', subtitle: 'A life filled with blessings' },
];

// ─── Image Slideshow / Carousel Component ──────────────────────────────────────
function HeroCarousel() {
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
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            i === index ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
          }`}
          style={{ transitionProperty: 'opacity, transform' }}
        >
          <img src={img.src} alt={img.title} className="w-full h-full object-cover select-none" />
          {/* Multi-layered premium overlays */}
          <div className="absolute inset-0 bg-[#050505]/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#050505]/40 to-[#050505]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#050505_95%)]" />
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
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 12, 5, 0.8) 0%, rgba(32, 24, 8, 0.8) 100%)',
                border: '1px solid rgba(201, 168, 76, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
              }}
            >
              <span className="text-2xl md:text-3xl font-extrabold font-display gold-text">
                {String(val).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[8px] tracking-[0.25em] uppercase text-[#c9a84c]/60 mt-2 font-bold">
              {label}
            </span>
          </div>
          {i < 3 && (
            <span className="text-xl font-light text-[#c9a84c]/30 mb-6 animate-pulse">·</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [tokenInput, setTokenInput] = useState('');
  const router = useRouter();

  const handleAccessRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      router.push(`/rsvp?token=${tokenInput.trim()}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#f5f0e8] relative flex flex-col overflow-x-hidden">
      
      {/* Golden dust & screen overlays */}
      <GoldDust />

      {/* ── SECTION 1: HERO VIEWPORT (Full Screen) ── */}
      <section className="relative min-h-screen w-full flex flex-col justify-between items-center px-6 py-12 text-center">
        {/* Slideshow background */}
        <HeroCarousel />

        {/* Top Header Badge */}
        <div className="relative z-20 animate-fadeInUp mt-4">
          <div className="flex items-center gap-3">
            <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#c9a84c]" />
            <span className="text-[10px] tracking-[0.6em] uppercase text-[#ffe066] font-bold">
              Moniye’s Golden Jubilee
            </span>
            <span className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#c9a84c]" />
          </div>
        </div>

        {/* Centered Typography & Action */}
        <div className="max-w-3xl w-full space-y-8 relative z-20 my-auto">
          <div className="space-y-4">
            <p className="text-5xl md:text-7xl text-[#f0d060] select-none" style={{ fontFamily: 'var(--font-great-vibes)' }}>
              Celebrating 50 Years
            </p>
            <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-none font-display">
              GRACE, LOVE & <br/>
              <span className="shimmer-text">ELEGANCE</span>
            </h1>
          </div>

          {/* Luxury Divider */}
          <div className="flex items-center justify-center gap-4 w-48 mx-auto">
            <span className="h-[1px] bg-gradient-to-r from-transparent to-[#c9a84c]/50 flex-1" />
            <Sparkles className="w-4 h-4 text-[#c9a84c] animate-pulse" />
            <span className="h-[1px] bg-gradient-to-l from-transparent to-[#c9a84c]/50 flex-1" />
          </div>

          {/* Countdown timer */}
          <div className="space-y-4">
            <p className="text-[#c9a84c]/50 text-[9px] tracking-[0.4em] uppercase font-bold">
              Counting down to the grand celebration
            </p>
            <Countdown />
          </div>

          {/* Code Access Input (Replaces card button) */}
          <div className="max-w-md mx-auto pt-6">
            <form onSubmit={handleAccessRsvp} className="flex flex-col sm:flex-row gap-3 items-center w-full bg-black/40 p-2 border border-[#c9a84c]/30 rounded-2xl backdrop-blur-md">
              <input
                type="text"
                placeholder="Enter Invitation Code"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                className="w-full bg-transparent px-4 py-2.5 outline-none text-sm placeholder-[#f5f0e8]/30 font-medium text-white"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-[#c9a84c] to-[#ffe066] hover:shadow-[0_0_20px_rgba(201,168,76,0.5)] transition-all text-[#050505] font-black tracking-widest text-xs uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer shrink-0"
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

        {/* Scroll helper */}
        <div className="relative z-20 flex flex-col items-center gap-2 text-[#c9a84c]/40 text-[9px] tracking-[0.3em] uppercase font-bold animate-bounce mt-4 select-none">
          <span>Scroll to Discover</span>
          <span className="text-xs">↓</span>
        </div>
      </section>

      {/* ── SECTION 2: SLIDE-THROUGH GALLERY / THEME DETAILS (Seamless flow) ── */}
      <section className="relative py-24 px-6 max-w-5xl mx-auto w-full space-y-24 z-20">
        
        {/* Intro statement */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-5xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
            The Golden Jubilee Celebration
          </h2>
          <p className="text-[#f5f0e8]/65 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Half a century of remarkable memories, lessons, and blessings. We invite you to step into an evening of high fashion, culinary arts, and toast to Moniye’s beautiful milestone.
          </p>
        </div>

        {/* Interactive Event Schedule / Detail Rows (Integrated, cardless design) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

        {/* Highlights List */}
        <div className="space-y-8">
          <div className="text-center">
            <span className="text-[10px] tracking-[0.4em] uppercase text-[#ffe066] font-bold">The Agenda</span>
            <h3 className="text-2xl md:text-4xl font-normal mt-1" style={{ fontFamily: 'var(--font-playfair)' }}>What to Expect</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <HighlightCard 
              icon={<Wine className="w-5 h-5 text-[#ffe066] shrink-0" />}
              title="Champagne Reception"
              desc="A luxury selection of fine bubbly drinks accompanied by gourmet canapés upon your arrival."
            />
            <HighlightCard 
              icon={<Sparkles className="w-5 h-5 text-[#ffe066] shrink-0" />}
              title="Live String Quartet"
              desc="Classical jazz and acoustic interpretations of timeless classics during the grand dinner."
            />
            <HighlightCard 
              icon={<Compass className="w-5 h-5 text-[#ffe066] shrink-0" />}
              title="Memories Exhibition"
              desc="A museum-like path highlighting the journey, achievements, and blessings of Moniye's life."
            />
          </div>
        </div>

      </section>

      {/* ── SECTION 3: FOOTER BANNER ── */}
      <footer className="w-full py-12 mt-12 bg-black border-t border-[#c9a84c]/15 text-center relative z-20">
        <div className="max-w-xl mx-auto space-y-4 px-6">
          <p className="text-3xl text-[#ffe066]" style={{ fontFamily: 'var(--font-great-vibes)' }}>
            Celebrating Moniye
          </p>
          <p className="text-[#c9a84c]/50 text-[10px] tracking-[0.4em] uppercase font-bold">
            Five Decades of Grace &nbsp;·&nbsp; 2026
          </p>
          <div className="h-[1px] w-24 bg-[#c9a84c]/20 mx-auto" />
          <p className="text-[#f5f0e8]/25 text-[9px] leading-relaxed">
            This invitation portal is secure and intended strictly for the invited guests of Moniye's 50th Birthday.
          </p>
        </div>
      </footer>
    </main>
  );
}

function DetailBlock({ icon, label, title, desc }: { icon: React.ReactNode; label: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-[#121212] to-[#0e0c03] border border-[#c9a84c]/15 hover:border-[#c9a84c]/35 transition-all">
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

function HighlightCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div
      className="p-6 rounded-2xl text-left space-y-3 group hover:scale-[1.02] hover:border-[#c9a84c]/50 transition-all duration-300 cursor-default flex flex-col bg-gradient-to-br from-[#131313] to-[#0a0904] border border-[#c9a84c]/12 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
    >
      <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center border border-[#c9a84c]/15 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h4
        className="text-base font-bold text-white tracking-wide"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        {title}
      </h4>
      <p className="text-[#f5f0e8]/45 text-xs leading-relaxed">{desc}</p>
    </div>
  );
}
