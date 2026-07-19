'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Clock, MapPin, Users, Phone, User, Mail, Download, ExternalLink, Loader2, XCircle, ImageIcon, CheckCircle2, Sparkles, Send, Heart, Shirt, ChevronLeft, ChevronRight } from 'lucide-react';
import QRCode from 'qrcode';

interface Ticket { name: string; token: string; }

const MEMORY_SLIDES = [
  { src: '/Mr.Felix1.jpeg', caption: 'Raise a Toast to Five Decades' },
  { src: '/Mr.Felix2.jpeg', caption: 'An Exquisite Dinner Reception' },
  { src: '/Mr.Felix6.jpeg', caption: 'Sweet Celebrations & Joy' },
  { src: '/Mr.Felix5.jpeg', caption: 'Celebrating' },
];

// ─── RSVP Page Slideshow / Carousel ────────────────────────────────────────────
function MemoryCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % MEMORY_SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const prev = () => setIndex(i => (i - 1 + MEMORY_SLIDES.length) % MEMORY_SLIDES.length);
  const next = () => setIndex(i => (i + 1) % MEMORY_SLIDES.length);

  return (
    <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-3xl border border-[#c9a84c]/20 shadow-2xl">
      {/* Inner border line */}
      <div className="absolute inset-1.5 border border-[#c9a84c]/10 rounded-[1.4rem] pointer-events-none z-20" />

      {MEMORY_SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          style={{ transitionProperty: 'opacity, transform' }}
        >
          <img src={slide.src} alt={slide.caption} className="w-full h-full object-cover object-top select-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-6 left-0 right-0 text-center px-4">
            <span className="text-[9px] tracking-[0.3em] uppercase text-[#ffe066] font-bold">Memory Gallery</span>
            <p className="text-sm font-semibold text-white mt-1">{slide.caption}</p>
          </div>
        </div>
      ))}

      {/* Manual buttons */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-[#c9a84c]/15 bg-black/50 text-[#c9a84c] flex items-center justify-center transition-all z-20 backdrop-blur-md cursor-pointer"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-[#c9a84c]/15 bg-black/50 text-[#c9a84c] flex items-center justify-center transition-all z-20 backdrop-blur-md cursor-pointer"
        aria-label="Next image"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots indicators */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
        {MEMORY_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === index ? 'bg-[#c9a84c] w-4' : 'bg-white/40'
              }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Golden Dust / Sparkles Effect ──────────────────────────────────────────────
function GoldDust() {
  const [particles, setParticles] = useState<any[]>([]);
  useEffect(() => {
    const list = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 8,
      duration: 8 + Math.random() * 10,
      size: 1.5 + Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.5,
    }));
    setParticles(list);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-gradient-to-b from-[#ffe066] to-[#c9a84c] shadow-[0_0_6px_rgba(201,168,76,0.5)]"
          style={{
            bottom: '-10px',
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animation: `gold-drift-rsvp ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes gold-drift-rsvp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.6; }
          100% { transform: translateY(-105vh) scale(0.7); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Gift Pass Envelope unwrapping Animation ─────────────────────────────────────
function EnvelopeUnwrap({ tickets, onDownload }: { tickets: Ticket[]; onDownload: (t: string, n: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSlideOut, setIsSlideOut] = useState(false);
  const [isFadeEnvelope, setIsFadeEnvelope] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  const handleOpen = () => {
    if (isOpen) return;
    setIsOpen(true);
    // Envelope opens, then pass slides up
    setTimeout(() => {
      setIsSlideOut(true);
    }, 800);
    // Then fade envelope away and scale ticket card
    setTimeout(() => {
      setIsFadeEnvelope(true);
    }, 2200);
    // Finally complete transition and show final layout
    setTimeout(() => {
      setAnimationComplete(true);
    }, 3000);
  };

  if (animationComplete) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-10 animate-fadeInUp">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mx-auto border border-[#c9a84c]/25 shadow-[0_0_15px_rgba(201,168,76,0.1)]">
            <CheckCircle2 className="w-5 h-5 text-[#ffe066]" />
          </div>
          <span className="text-[#c9a84c]/60 text-[9px] tracking-[0.4em] uppercase font-bold">Unwrapped successfully</span>
          <h2 className="text-3xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
            Your Entry Passes
          </h2>
          <p className="text-[#f5f0e8]/55 text-xs max-w-md mx-auto leading-relaxed">
            Please download your secure QR pass or print them out. You will need to show this QR pass at the entry gate.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-center">
          {tickets.map((t, i) => (
            <TicketCard key={t.token} ticket={t} idx={i} onDownload={onDownload} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 w-full max-w-md mx-auto relative min-h-[500px]">

      {/* Sparkles / Gold Dust Burst */}
      {isOpen && <GoldDust />}

      <div
        className="text-center mb-8 space-y-2 relative z-10 transition-opacity duration-700"
        style={{ opacity: isFadeEnvelope ? 0 : 1 }}
      >
        <span className="text-[#c9a84c]/65 text-[10px] tracking-[0.3em] uppercase font-bold">rsvp confirmed</span>
        <h2 className="text-3xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
          Unwrap Your Invitation
        </h2>
        <p className="text-[#f5f0e8]/50 text-xs">
          {isOpen ? 'Opening your invitation pack...' : 'Your entry pass has arrived in a golden envelope. Click the wax seal to open it.'}
        </p>
      </div>

      {/* 3D Envelope Container */}
      <div
        className="w-full aspect-[1.4] relative"
        style={{ perspective: '1200px' }}
      >

        {/* 1. Envelope Back Panel (z-index 5) */}
        <div
          className="absolute inset-0 bg-[#120d04] rounded-2xl border border-[#c9a84c]/15 transition-opacity duration-700"
          style={{
            zIndex: 5,
            opacity: isFadeEnvelope ? 0 : 1
          }}
        />

        {/* 2. Floating Ticket Pass (z-index 10) */}
        <div
          className="absolute bottom-4 left-0 right-0 z-10 transition-all duration-[1200ms] ease-out"
          style={{
            transform: isFadeEnvelope
              ? 'translateY(-100px) scale(1)'
              : isSlideOut
                ? 'translateY(-280px) scale(0.9)'
                : 'translateY(60px) scale(0.5)',
            opacity: isOpen ? 1 : 0.2,
          }}
        >
          {tickets.length > 0 && (
            <TicketCard ticket={tickets[0]} idx={0} onDownload={onDownload} />
          )}
        </div>

        {/* 3. Envelope Front Pocket (z-index 20) */}
        <div
          className="absolute bottom-0 inset-x-0 h-[65%] bg-[#17130a] rounded-b-2xl border-x border-b border-[#c9a84c]/25 shadow-[0_15px_40px_rgba(0,0,0,0.8)] transition-all duration-700"
          style={{
            zIndex: 20,
            opacity: isFadeEnvelope ? 0 : 1,
            pointerEvents: isFadeEnvelope ? 'none' : 'auto'
          }}
        >
          {/* Inner shade for pocket */}
          <div className="absolute inset-1 border border-[#c9a84c]/10 rounded-xl" />

          {/* Bottom fold */}
          <div
            className="absolute bottom-0 inset-x-0 h-full bg-gradient-to-t from-[#100b03] to-[#1c1407]"
            style={{ clipPath: 'polygon(0 40%, 100% 40%, 50% 100%)' }}
          />
          {/* Left fold */}
          <div
            className="absolute inset-y-0 left-0 w-[60%] bg-gradient-to-r from-[#120d04] to-[#171106]"
            style={{ clipPath: 'polygon(0 0, 48% 50%, 0 100%)' }}
          />
          {/* Right fold */}
          <div
            className="absolute inset-y-0 right-0 w-[60%] bg-gradient-to-l from-[#120d04] to-[#171106]"
            style={{ clipPath: 'polygon(100% 0, 52% 50%, 100% 100%)' }}
          />
        </div>

        {/* 4. Top Flap (z-index 30) */}
        <div
          className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-[#f0d060] to-[#c9a84c] rounded-t-2xl z-30 transition-all duration-700 ease-in-out shadow-lg"
          style={{
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            transformOrigin: 'top center',
            transform: isOpen ? 'rotateX(180deg)' : 'rotateX(0deg)',
            opacity: isFadeEnvelope ? 0 : 1,
          }}
        />

        {/* Wax Seal lock button */}
        <button
          onClick={handleOpen}
          disabled={isOpen}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-r from-[#a6822c] via-[#ffe066] to-[#a6822c] border border-[#ffe066] shadow-[0_0_20px_rgba(255,224,102,0.4)] z-40 flex items-center justify-center transition-all duration-500 cursor-pointer ${isOpen ? 'scale-0 opacity-0 rotate-180' : 'hover:scale-105 active:scale-95'
            }`}
          style={{
            opacity: isFadeEnvelope ? 0 : 1,
            pointerEvents: isFadeEnvelope ? 'none' : 'auto'
          }}
          aria-label="Open envelope wax seal"
        >
          <Sparkles className="w-5 h-5 text-black shrink-0" />
        </button>

        {/* Interactive action banner */}
        {!isOpen && (
          <div className="absolute bottom-[-50px] left-0 right-0 text-center animate-pulse">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[#ffe066] font-bold">
              Click Wax Seal To Open
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RSVPForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', attending: '', guests: '0' });
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdTickets, setCreatedTickets] = useState<Ticket[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [invite, setInvite] = useState<any>(null);

  useEffect(() => {
    if (!token) { setTokenError('A valid RSVP invitation token is required to secure your pass.'); setIsValidating(false); return; }
    const run = async () => {
      try {
        const res = await fetch(`/api/invite/${token}`);
        const data = await res.json();
        if (data.success) {
          if (data.invite.rsvpSubmitted) {
            setTokenError('This personal RSVP invitation link has already been used.');
          } else {
            setInvite(data.invite);
            setFormData(p => ({
              ...p,
              name: data.invite.name,
              email: data.invite.email || '',
              phone: data.invite.phone || ''
            }));
          }
        } else {
          setTokenError('This invitation link is invalid or has expired.');
        }
      } catch { setTokenError('Connection error — please refresh the page and try again.'); }
      finally { setIsValidating(false); }
    };
    run();
  }, [token]);

  const handleGuestsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const n = parseInt(e.target.value) || 0;
    setFormData({ ...formData, guests: e.target.value });
    const needed = n;
    setGuestNames(prev => {
      const next = [...prev];
      while (next.length < needed) next.push('');
      if (next.length > needed) next.splice(needed);
      return next;
    });
  };

  const handleGuestName = (i: number, v: string) => {
    const next = [...guestNames]; next[i] = v; setGuestNames(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErrorMsg('');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token, name: formData.name, email: formData.email, phone: formData.phone,
          attending: formData.attending, guests: (parseInt(formData.guests) || 0) + 1,
          guestNames: formData.attending === 'yes' ? guestNames : [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (formData.attending === 'yes')
          setCreatedTickets(data.invites.map((inv: any) => ({ name: inv.name, token: inv.token })));
        setSubmitted(true);
      } else {
        setErrorMsg(data.message || 'Failed to submit RSVP.');
      }
    } catch { setErrorMsg('Network error — please try again.'); }
    finally { setLoading(false); }
  };

  const downloadQr = async (tok: string, name: string) => {
    try {
      const element = document.getElementById(`ticket-card-${tok}`);
      if (element) {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(element, {
          scale: 2.5,
          useCORS: true,
          backgroundColor: null,
          logging: false,
        });
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name.replace(/\s+/g, '_')}_Ticket.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const url = await QRCode.toDataURL(tok, { width: 600, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
        const a = document.createElement('a');
        a.href = url; a.download = `${name.replace(/\s+/g, '_')}_QR_Pass.png`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error generating ticket image:', err);
      try {
        const url = await QRCode.toDataURL(tok, { width: 600, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
        const a = document.createElement('a');
        a.href = url; a.download = `${name.replace(/\s+/g, '_')}_QR_Pass.png`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isValidating) return (
    <main className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center animate-pulse-gold"
          style={{ border: '1px solid #c9a84c', boxShadow: '0 0 30px rgba(201,168,76,0.3)' }}>
          <Loader2 className="w-7 h-7 text-[#c9a84c] animate-spin" />
        </div>
        <p className="text-[#c9a84c]/50 text-[10px] tracking-[0.4em] uppercase">Validating Invitation Pass…</p>
      </div>
    </main>
  );

  // ── Token Error state ───────────────────────────────────────────────────────
  if (tokenError) return (
    <main className="min-h-screen flex items-center justify-center bg-[#050505] p-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.06),transparent_70%)]" />
      <div className="max-w-md w-full card-dark rounded-3xl p-10 text-center space-y-6 shadow-2xl relative border border-[#c9a84c]/25">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/30">
          <XCircle className="w-6 h-6 text-red-500" />
        </div>
        <h2 className="text-2xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>Verification Failed</h2>
        <p className="text-[#f5f0e8]/60 text-sm leading-relaxed">{tokenError}</p>
        <Ornament />
      </div>
    </main>
  );

  // ── Declined state ──────────────────────────────────────────────────────────
  if (submitted && formData.attending === 'no') return (
    <main className="min-h-screen flex items-center justify-center bg-[#050505] p-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.06),transparent_70%)]" />
      <div className="max-w-md w-full card-dark rounded-3xl p-10 text-center space-y-6 shadow-2xl relative border border-[#c9a84c]/25 animate-zoomIn">
        <div className="w-14 h-14 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mx-auto border border-[#c9a84c]/20">
          <Send className="w-6 h-6 text-[#ffe066]" />
        </div>
        <h2 className="text-3xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>Response Saved</h2>
        <p className="text-[#f5f0e8]/65 text-sm leading-relaxed">
          Thank you for letting us know, <strong className="text-[#f0d060]">{formData.name}</strong>.<br />
          We are sorry you cannot attend and you will be greatly missed at Felix's 50th celebration!
        </p>
        <Ornament><Heart className="w-3.5 h-3.5 text-[#c9a84c]/50 animate-pulse" /></Ornament>
      </div>
    </main>
  );

  // ── Unwrapping animation triggers first on confirm ─────────────────────────
  if (submitted) return (
    <main className="min-h-screen py-16 px-6 bg-[#050505] relative overflow-hidden flex flex-col items-center justify-center">
      <GoldDust />
      <EnvelopeUnwrap tickets={createdTickets} onDownload={downloadQr} />
    </main>
  );

  // ── RSVP Form state ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen py-16 px-6 bg-[#050505] relative overflow-hidden flex flex-col items-center justify-center">
      <GoldDust />

      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-[#c9a84c]/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#c9a84c]/4 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-4xl w-full space-y-16 relative z-10">

        {/* Page title header */}
        <div className="text-center space-y-2">
          <span className="text-[#c9a84c]/65 text-[10px] tracking-[0.4em] uppercase font-bold">Secure entry ticket</span>
          <h1 className="text-4xl md:text-6xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
            Confirm Attendance
          </h1>
          <p className="text-[#f5f0e8]/55 text-xs max-w-sm mx-auto leading-relaxed">
            Kindly RSVP below to confirm your seat and generate your customized golden access pass.
          </p>
        </div>

        {/* Grid layout containing Carousel on left and Form on right (No parent cards!) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Left Column: Memory Slideshow Carousel & Event Details */}
          <div className="lg:col-span-6 space-y-10">
            <MemoryCarousel />

            {/* Event details plaque */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-bold text-[#c9a84c]/65 tracking-[0.3em] uppercase">Celebration Agenda</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow icon={<Calendar className="w-4 h-4 text-[#ffe066]" />} label="Date" value="Saturday, November 28, 2026" />
                <DetailRow icon={<Clock className="w-4 h-4 text-[#ffe066]" />} label="Time" value="1:00 PM – 8:00 PM" />
                <DetailRow icon={<MapPin className="w-4 h-4 text-[#ffe066]" />} label="Location" value="Gallani event center,NO 1 Abel awe close,Ajao street, GRA, Jericho Ibadan" />
                <DetailRow icon={<Shirt className="w-4 h-4 text-[#ffe066]" />} label="Dress Code" value="Strictly white with Gold head wear." />
              </div>
              <p className="text-[#f5f0e8]/45 text-xs italic leading-relaxed text-center sm:text-left pt-2">
                "Join us for an evening of luxury, dining, and live musical entertainment as we celebrate Felix's extraordinary life journey."
              </p>
            </div>
          </div>

          {/* Right Column: RSVP Input Form (Blends directly with page) */}
          <div className="lg:col-span-6 space-y-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
                Response Card
              </h2>
              <p className="text-[#c9a84c]/50 text-[9px] tracking-widest uppercase">Kindly respond before November 21, 2026</p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs flex items-start gap-3">
                <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <GoldInput id="name" label="Full Name" type="text" icon={<User className="w-4 h-4 text-[#c9a84c]/50" />} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Your full name" required />
              <GoldInput id="email" label="Email Address" type="email" icon={<Mail className="w-4 h-4 text-[#c9a84c]/50" />} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="your@email.com" required />
              <GoldInput id="phone" label="Phone Number" type="tel" icon={<Phone className="w-4 h-4 text-[#c9a84c]/50" />} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+234 000 000 0000" required />

              {/* Attending toggle */}
              <div>
                <label className="block text-[9px] font-bold text-[#c9a84c]/65 tracking-[0.25em] uppercase mb-2">
                  Will you attend Felix's 50th?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <AttendCard
                    icon={<CheckCircle2 className="w-5 h-5 animate-pulse" />} label="Joyfully Attending" sublabel="Count me in"
                    checked={formData.attending === 'yes'}
                    onClick={() => setFormData({ ...formData, attending: 'yes' })}
                  />
                  <AttendCard
                    icon={<XCircle className="w-5 h-5" />} label="Regretfully Decline" sublabel="Sending love"
                    checked={formData.attending === 'no'}
                    onClick={() => setFormData({ ...formData, attending: 'no' })}
                  />
                </div>
              </div>

              {/* Guest count */}
              {formData.attending === 'yes' && (
                <div className="space-y-4 animate-fadeInUp">
                  <div>
                    <label htmlFor="guests" className="block text-[9px] font-bold text-[#c9a84c]/65 tracking-[0.25em] uppercase mb-1.5">
                      Number of Additional Guests
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a84c]/50" />
                      <select
                        id="guests" value={formData.guests} onChange={handleGuestsChange}
                        className="w-full pl-11 pr-4 py-3.5 bg-[#111] border border-[#c9a84c]/22 rounded-xl text-white text-base md:text-xs focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/55 transition-all appearance-none cursor-pointer"
                      >
                        {Array.from({ length: Math.max(0, (invite?.maxUses || 1) - 1) + 1 }, (_, i) => i).map(n => (
                          <option key={n} value={n} className="bg-[#111]">
                            {n === 0 ? 'No additional guests' : `${n} Additional Guest${n > 1 ? 's' : ''}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {guestNames.map((n, i) => (
                    <GoldInput
                      key={i} id={`guest-${i}`} label={`Additional Guest ${i + 1} Full Name`} type="text"
                      icon={<User className="w-4 h-4 text-[#c9a84c]/50" />}
                      value={n} onChange={e => handleGuestName(i, e.target.value)}
                      placeholder={`Additional guest ${i + 1}'s full name`} required
                    />
                  ))}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !formData.attending}
                className="w-full py-4 btn-gold rounded-xl font-bold text-xs tracking-[0.25em] uppercase disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting RSVP…</span></>
                ) : (
                  <span>Submit RSVP Response</span>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* ── Bottom photo collage ── */}
        <div className="animate-fadeInUp space-y-4 pt-12 border-t border-[#c9a84c]/10">
          <p className="text-center text-[#c9a84c]/45 text-[9px] tracking-[0.4em] uppercase font-bold">
            🎞 Memory Moments
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <PhotoFrame label="Grand Reception" imageSrc="/champagne_toast.png" className="rounded-2xl h-24" />
            <PhotoFrame label="Decor Setup" imageSrc="/golden_decor.png" className="rounded-2xl h-24" />
            <PhotoFrame label="Jubilee Cover" imageSrc="/premium_cover.png" className="rounded-2xl h-24" />
            <PhotoFrame label="Luxury Cake" imageSrc="/luxury_cake.png" className="rounded-2xl h-24" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-[#c9a84c]/30 text-[9px] tracking-[0.35em] uppercase">
            Celebrating 50 Golden Years · Felix
          </p>
        </div>
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5 p-4 rounded-xl border border-[#c9a84c]/15 bg-[#c9a84c]/5">
      <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[#c9a84c]/55 text-[9px] tracking-[0.2em] uppercase font-bold">{label}</p>
        <p className="text-white text-xs font-semibold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function GoldInput({ id, label, type, icon, value, onChange, placeholder, required }: {
  id: string; label: string; type: string; icon: React.ReactNode;
  value: string; onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder: string; required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[9px] font-bold text-[#c9a84c]/65 tracking-[0.2em] uppercase mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2">{icon}</span>
        <input
          type={type} id={id} required={required} value={value} onChange={onChange}
          className="w-full pl-11 pr-4 py-3.5 bg-[#111] border border-[#c9a84c]/22 rounded-xl text-white placeholder-[#f5f0e8]/18 focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/55 transition-all text-base md:text-xs"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function AttendCard({ icon, label, sublabel, checked, onClick }: {
  icon: React.ReactNode; label: string; sublabel: string; checked: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button" onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${checked
        ? 'border-[#c9a84c]/70 bg-[#c9a84c]/10 shadow-[0_0_20px_rgba(201,168,76,0.15)] scale-[1.01]'
        : 'border-[#c9a84c]/15 bg-[#111] hover:border-[#c9a84c]/35 hover:bg-[#c9a84c]/5'
        }`}
    >
      <div className={`text-[#ffe066] transition-transform ${checked ? 'scale-105' : 'opacity-70'}`}>{icon}</div>
      <span className={`text-[11px] font-bold tracking-wide text-center ${checked ? 'text-[#f0d060]' : 'text-[#f5f0e8]/45'}`}>
        {label}
      </span>
      <span className={`text-[8px] tracking-wider uppercase ${checked ? 'text-[#c9a84c]/60' : 'text-[#f5f0e8]/25'}`}>
        {sublabel}
      </span>
    </button>
  );
}

function Ornament({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 w-32 mx-auto mt-4">
      <span className="h-[1px] bg-gradient-to-r from-transparent to-[#c9a84c]/40 flex-1" />
      {children ? (
        <span className="shrink-0">{children}</span>
      ) : (
        <span className="text-[#c9a84c]/40 text-xs select-none">✦</span>
      )}
      <span className="h-[1px] bg-gradient-to-l from-transparent to-[#c9a84c]/40 flex-1" />
    </div>
  );
}

function PhotoFrame({ label, imageSrc, className }: { label: string; imageSrc: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden group border border-[#c9a84c]/20 shadow-md ${className || ''}`}>
      <img
        src={imageSrc}
        alt={label}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 select-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-2 text-center" />
      <div className="absolute bottom-2 left-0 right-0 text-center px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <span className="text-[9px] font-bold text-white tracking-wider uppercase">{label}</span>
      </div>
    </div>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────
function TicketCard({ ticket, idx, onDownload }: { ticket: Ticket; idx: number; onDownload: (t: string, n: string) => void }) {
  const [qrUrl, setQrUrl] = useState('');
  useEffect(() => {
    QRCode.toDataURL(ticket.token, { width: 400, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQrUrl).catch(console.error);
  }, [ticket.token]);

  return (
    <div
      id={`ticket-card-${ticket.token}`}
      className="rounded-[2rem] overflow-hidden flex flex-col shadow-2xl border border-[#c9a84c]/35 relative bg-[#0e0a03]"
    >
      {/* Subtle inner border */}
      <div className="absolute inset-1.5 border border-[#c9a84c]/10 rounded-[1.8rem] pointer-events-none z-20" />

      {/* Header */}
      <div
        className="px-6 py-5 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1200 0%, #2e2000 50%, #1a1200 100%)' }}
      >
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#c9a84c 0,#c9a84c 1px,transparent 1px,transparent 10px)' }} />
        <div
          className="absolute -right-6 -top-6 w-24 h-24 rounded-full animate-spin-slow opacity-15"
          style={{ border: '1px solid #c9a84c' }}
        />
        <p className="text-[#c9a84c]/55 text-[8px] tracking-[0.5em] uppercase relative z-10 mb-0.5">A Golden Celebration</p>
        <p className="font-bold text-xl text-white relative z-10" style={{ fontFamily: "var(--font-playfair)" }}>
          Felix's 50th Birthday
        </p>
        <div className="flex items-center justify-between mt-2.5 relative z-10 px-1">
          <span className="text-[9px] text-[#c9a84c]/60 tracking-widest uppercase">Pass #{idx + 1}</span>
          <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold text-[#0a0800] bg-gradient-to-r from-[#c9a84c] to-[#ffe066]">
            ✦ Confirmed
          </span>
        </div>
      </div>

      {/* Tear line */}
      <div className="flex items-center px-3 bg-[#0e0a03]">
        <div className="ticket-hole -ml-5 animate-pulse" />
        <div className="flex-1 border-t border-dashed border-[#c9a84c]/20" />
        <div className="ticket-hole -mr-5 animate-pulse" />
      </div>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col items-center text-center space-y-4">
        <div>
          <h4 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: "var(--font-playfair)" }}>{ticket.name}</h4>
          <p className="text-[9px] text-[#c9a84c]/35 font-mono mt-0.5">ID: {ticket.token.slice(0, 10)}</p>
        </div>

        {qrUrl ? (
          <div className="p-3 bg-white rounded-2xl shadow-xl relative border border-[#c9a84c]/30">
            <img src={qrUrl} alt="Entry QR" className="w-36 h-36" />
          </div>
        ) : (
          <div className="w-36 h-36 flex items-center justify-center rounded-2xl border border-[#c9a84c]/20">
            <Loader2 className="w-6 h-6 text-[#c9a84c] animate-spin" />
          </div>
        )}

        <div className="w-full grid grid-cols-2 gap-2 py-3 border-y border-[#c9a84c]/10 text-[10px] text-left">
          <div>
            <p className="text-[#c9a84c]/45 uppercase tracking-wider text-[8px] mb-0.5">Date & Time</p>
            <p className="text-white font-semibold">Nov 28, 2026 · 1 - 8 PM</p>
          </div>
          <div>
            <p className="text-[#c9a84c]/45 uppercase tracking-wider text-[8px] mb-0.5">Venue</p>
            <p className="text-white font-semibold">GRA, Jericho, Ibadan</p>
          </div>
        </div>

        <div className="w-full flex gap-3 pt-1" data-html2canvas-ignore="true">
          <button
            onClick={() => onDownload(ticket.token, ticket.name)}
            className="flex-1 py-2.5 btn-gold rounded-xl text-[9px] font-bold tracking-widest uppercase flex items-center justify-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <a
            href={`/invite/${ticket.token}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-xl text-[9px] font-bold tracking-widest uppercase text-[#c9a84c] flex items-center justify-center gap-1 hover:bg-[#c9a84c]/10 transition-colors"
            style={{ border: '1px solid rgba(201,168,76,0.3)' }}
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Pass
          </a>
        </div>
      </div>
    </div>
  );
}

export default function RSVPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-10 h-10 text-[#c9a84c] animate-spin" />
      </div>
    }>
      <RSVPForm />
    </Suspense>
  );
}
