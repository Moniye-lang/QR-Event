'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, MapPin, Loader2, Download, CheckCircle2, Clock, Sparkles, ExternalLink, XCircle, Info, Shield, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';

interface Invite {
  name: string;
  email: string;
  token: string;
  used: boolean;
  createdAt: string;
}

// ─── Golden Dust / Particles ────────────────────────────────────────────────────
function GoldDust() {
  const [particles, setParticles] = useState<any[]>([]);
  useEffect(() => {
    const list = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 10 + Math.random() * 10,
      size: 1.5 + Math.random() * 3.5,
      opacity: 0.3 + Math.random() * 0.4,
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
            animation: `gold-drift-invite ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx global>{`
        @keyframes gold-drift-invite {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.6; }
          100% { transform: translateY(-105vh) scale(0.7); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Gift Pass Envelope unwrapping Animation ─────────────────────────────────────
function EnvelopeUnwrap({ invite, qrDataUrl }: { invite: Invite; qrDataUrl: string }) {
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
      <div className="w-full max-w-md mx-auto space-y-8 animate-fadeInUp relative z-10">
        
        {/* Pass header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#c9a84c]/10 flex items-center justify-center mx-auto border border-[#c9a84c]/25 shadow-[0_0_15px_rgba(201,168,76,0.15)]">
            <CheckCircle2 className="w-5 h-5 text-[#ffe066]" />
          </div>
          <span className="text-[#c9a84c]/65 text-[9px] tracking-[0.4em] uppercase font-bold">Unwrapped Pass</span>
          <h2 className="text-3xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
            Entry Voucher
          </h2>
        </div>

        {/* Ticket display */}
        <TicketCard invite={invite} qrDataUrl={qrDataUrl} />

        {/* Instructions Card */}
        <div className="rounded-[2.5rem] border border-[#c9a84c]/20 bg-[#0e0a03]/85 p-6 relative overflow-hidden backdrop-blur-md">
          {/* Subtle inner border */}
          <div className="absolute inset-1.5 border border-[#c9a84c]/5 rounded-[2.3rem] pointer-events-none z-20" />
          
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#c9a84c]/10">
              <Info className="w-4 h-4 text-[#ffe066] shrink-0" />
              <h3 className="text-[#ffe066] text-[10px] font-bold uppercase tracking-[0.25em] font-mono">
                Entry Pass Instructions
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center shrink-0 border border-[#c9a84c]/15">
                  <Shield className="w-3.5 h-3.5 text-[#ffe066]" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-0.5">One-Time Use Pass</h4>
                  <p className="text-[#f5f0e8]/50 text-[10px] leading-relaxed">
                    This personal invitation link and its QR pass are unique to you and valid for a <span className="text-[#ffe066] font-semibold">single entry scan</span>. Sharing this link may invalidate your ticket.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center shrink-0 border border-[#c9a84c]/15">
                  <Download className="w-3.5 h-3.5 text-[#ffe066]" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-0.5">Download to Device</h4>
                  <p className="text-[#f5f0e8]/50 text-[10px] leading-relaxed">
                    Kindly tap the <span className="text-[#ffe066] font-semibold">"Download Entry Pass"</span> button on your ticket to save or print it. We strongly advise saving it to your phone so it is available offline at check-in.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center shrink-0 border border-[#c9a84c]/15">
                  <Smartphone className="w-3.5 h-3.5 text-[#ffe066]" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider mb-0.5">Present at Check-in</h4>
                  <p className="text-[#f5f0e8]/50 text-[10px] leading-relaxed">
                    Upon arrival at the venue, present the offline downloaded pass or open this link on your device. The check-in team will scan your QR code for immediate access.
                  </p>
                </div>
              </div>
            </div>
          </div>
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
        <span className="text-[#c9a84c]/65 text-[10px] tracking-[0.3em] uppercase font-bold">invitation secured</span>
        <h2 className="text-3xl font-normal text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
          Unwrap Your Golden Pass
        </h2>
        <p className="text-[#f5f0e8]/50 text-xs">
          {isOpen ? 'Opening your invitation pass...' : 'Your entry voucher has arrived in a golden envelope. Click the wax seal to open.'}
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
          <TicketCard invite={invite} qrDataUrl={qrDataUrl} />
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
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-gradient-to-r from-[#a6822c] via-[#ffe066] to-[#a6822c] border border-[#ffe066] shadow-[0_0_20px_rgba(255,224,102,0.4)] z-40 flex items-center justify-center transition-all duration-500 cursor-pointer ${
            isOpen ? 'scale-0 opacity-0 rotate-180' : 'hover:scale-105 active:scale-95'
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

// ─── Ticket Card Component ──────────────────────────────────────────────────────
function TicketCard({ invite, qrDataUrl }: { invite: Invite; qrDataUrl: string }) {
  return (
    <div
      className="rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-[#c9a84c]/35 relative bg-[#0e0a03]"
    >
      {/* Cover Image at the top of the ticket */}
      <div className="h-44 relative overflow-hidden border-b border-[#c9a84c]/20">
        <img 
          src="/premium_cover.png" 
          alt="Moniye 50th jubilee" 
          className="w-full h-full object-cover select-none" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a03] via-transparent to-black/30" />
      </div>

      {/* Subtle inner border */}
      <div className="absolute inset-1.5 border border-[#c9a84c]/10 rounded-[2.3rem] pointer-events-none z-20" />

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
          Moniye's 50th Birthday
        </p>
        <div className="flex items-center justify-between mt-2.5 relative z-10 px-1">
          <span className="text-[9px] text-[#c9a84c]/60 tracking-widest uppercase">VIP Guest Pass</span>
          <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold text-[#0a0800] bg-gradient-to-r from-[#c9a84c] to-[#ffe066]">
            ✦ Confirmed
          </span>
        </div>
      </div>

      {/* Tear line */}
      <div className="flex items-center px-3 bg-[#0e0a03]">
        <div className="ticket-hole -ml-5" />
        <div className="flex-1 border-t border-dashed border-[#c9a84c]/20" />
        <div className="ticket-hole -mr-5" />
      </div>

      {/* Body */}
      <div className="p-8 flex-1 flex flex-col items-center text-center space-y-5">
        <div>
          <h4 className="text-xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: "var(--font-playfair)" }}>{invite.name}</h4>
          <p className="text-[9px] text-[#c9a84c]/35 font-mono mt-0.5">ID: {invite.token}</p>
        </div>

        {/* QR Code */}
        <div className="relative p-4 bg-white rounded-2xl shadow-xl relative border border-[#c9a84c]/30">
          {invite.used && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center text-red-600 p-4 text-center z-10">
              <CheckCircle2 className="w-12 h-12 mb-1" />
              <span className="font-black text-sm uppercase">Pass Scanned</span>
              <span className="text-[10px] opacity-60">Entry validated</span>
            </div>
          )}
          <img 
            src={qrDataUrl} 
            alt="Entry QR" 
            className={`w-44 h-44 transition-opacity ${invite.used ? 'opacity-10' : 'opacity-100'}`} 
          />
        </div>

        {/* Event details block inside ticket */}
        <div className="w-full grid grid-cols-1 gap-2.5 py-4 border-y border-[#c9a84c]/10 text-xs text-left">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#ffe066]" />
            <div>
              <p className="text-[#c9a84c]/50 text-[8px] uppercase tracking-wider">Date & Time</p>
              <p className="text-white text-xs font-semibold">Saturday, June 28, 2026 at 6:00 PM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#ffe066]" />
            <div>
              <p className="text-[#c9a84c]/50 text-[8px] uppercase tracking-wider">Location</p>
              <p className="text-white text-xs font-semibold">Grand Event Hall, Downtown</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => window.print()}
          className="w-full py-3.5 btn-gold rounded-xl text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Download Entry Pass
        </button>
      </div>
    </div>
  );
}

// ─── Main Public Invite Page Component ──────────────────────────────────────────
export default function PublicInvite() {
  const { token } = useParams();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      fetchInvite();
    }
  }, [token]);

  const fetchInvite = async () => {
    try {
      const res = await fetch(`/api/invite/${token}`);
      const data = await res.json();
      if (data.success) {
        setInvite(data.invite);
        const url = await QRCode.toDataURL(data.invite.token, {
          width: 600,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
        setQrDataUrl(url);
      } else {
        setError(data.message || 'Invite not found');
      }
    } catch (err) {
      setError('An error occurred while fetching invitation details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border border-[#c9a84c]/40 flex items-center justify-center mx-auto animate-pulse-gold">
            <Loader2 className="w-7 h-7 text-[#c9a84c] animate-spin" />
          </div>
          <p className="text-[#c9a84c]/50 text-[10px] tracking-widest uppercase">Retrieving secure invitation pass…</p>
        </div>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 text-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.05),transparent_70%)]" />
        <div className="space-y-6 max-w-sm relative z-10 p-8 border border-red-500/25 rounded-3xl bg-black/40 backdrop-blur-md">
          <div className="text-5xl text-red-500"><XCircle className="w-12 h-12 mx-auto" /></div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>Invalid Pass Link</h1>
          <p className="text-[#f5f0e8]/50 text-sm leading-relaxed">This invitation link appears to be invalid or has expired. Please verify your token details and try again.</p>
          <a href="/" className="inline-block px-8 py-3.5 btn-gold rounded-xl text-xs font-bold tracking-widest uppercase cursor-pointer">
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Gold drifting dust overlay */}
      <GoldDust />

      {/* Ambient background glowing orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-[#c9a84c]/6 rounded-full blur-[160px] animate-glow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#c9a84c]/4 rounded-full blur-[150px] animate-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Unboxing envelope or ticket pass display */}
      <EnvelopeUnwrap invite={invite} qrDataUrl={qrDataUrl} />

    </main>
  );
}
