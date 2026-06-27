'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { ShieldCheck, Camera, Loader2, CheckCircle2, XCircle, LogOut, RefreshCw, QrCode } from 'lucide-react';

export default function Scanner() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'checking' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ message: string; name?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login?redirect=/scan');
    } else {
      setIsAdmin(true);
    }
    return () => { stopScanner(); };
  }, [router]);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
  };

  const startScanner = async () => {
    setErrorMessage(null);
    setStatus('scanning');
    try {
      const html5QrCode = new Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;
      const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        undefined
      );
    } catch (err: any) {
      console.error('Scanner start error:', err);
      setStatus('error');
      if (err.toString().includes("NotAllowedError")) {
        setErrorMessage('Camera permission denied. Please enable camera access in your browser settings.');
      } else if (err.toString().includes("NotFoundError")) {
        setErrorMessage('No camera found on this device.');
      } else {
        setErrorMessage('Failed to start camera. Make sure no other app is using it.');
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    await stopScanner();
    setStatus('checking');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: decodedText }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setResult({ message: data.message, name: data.name });
      } else {
        setStatus('error');
        setResult({ message: data.message, name: data.name });
        setErrorMessage(data.message);
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Network error occurred while verifying token.');
    }
  };

  const reset = () => {
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#080808] text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#c9a84c]/4 rounded-full blur-[140px]" />
      </div>

      {/* Corner ornaments */}
      <div className="absolute top-6 left-6 text-[#c9a84c]/15 text-4xl select-none">✦</div>
      <div className="absolute top-6 right-6 text-[#c9a84c]/15 text-4xl select-none">✦</div>

      <div className="max-w-md w-full space-y-8 text-center">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl btn-gold shadow-lg animate-pulse-gold">
            <QrCode className="w-8 h-8 text-[#080808]" />
          </div>
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
            Entry Scanner
          </h1>
          <p className="text-[#c9a84c]/50 text-xs tracking-widest uppercase">50th Birthday · Guest Verification</p>
        </div>

        {/* Scanner viewport */}
        <div className="relative aspect-square w-full card-dark gold-border rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl">
          {status === 'idle' && (
            <button
              onClick={startScanner}
              className="p-8 group flex flex-col items-center gap-4 hover:scale-105 transition-transform"
            >
              <div className="w-24 h-24 rounded-full btn-gold flex items-center justify-center shadow-xl animate-pulse-gold group-hover:scale-110 transition-transform">
                <Camera className="w-12 h-12 text-[#080808]" />
              </div>
              <div>
                <p className="font-bold text-white text-lg" style={{ fontFamily: 'var(--font-playfair)' }}>Start Camera</p>
                <p className="text-[#c9a84c]/50 text-xs tracking-widest uppercase mt-1">Tap to activate scanner</p>
              </div>
            </button>
          )}

          <div id="reader" className="w-full h-full" style={{ display: status === 'scanning' ? 'block' : 'none' }} />

          {/* Scanning overlay corners */}
          {status === 'scanning' && (
            <div className="absolute inset-8 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#c9a84c] rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#c9a84c] rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#c9a84c] rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#c9a84c] rounded-br-lg" />
            </div>
          )}

          {/* Result overlays */}
          {(status === 'checking' || status === 'success' || (status === 'error' && result)) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 bg-[#080808]/95 backdrop-blur-md">
              {status === 'checking' && (
                <>
                  <div className="w-16 h-16 rounded-full border border-[#c9a84c]/40 flex items-center justify-center mb-4 animate-pulse-gold">
                    <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
                  </div>
                  <p className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>Verifying Pass...</p>
                  <p className="text-[#c9a84c]/40 text-xs tracking-widest uppercase mt-1">Please wait</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="w-24 h-24 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-5">
                    <CheckCircle2 className="w-14 h-14 text-green-400" />
                  </div>
                  <p className="text-green-400 text-sm font-bold tracking-widest uppercase mb-2">Access Granted</p>
                  <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>{result?.name}</h2>
                  <p className="text-[#f5f0e8]/40 text-sm mb-8">{result?.message}</p>
                  <button
                    onClick={reset}
                    className="w-full py-3.5 bg-green-500/20 border border-green-500/30 hover:bg-green-500/30 rounded-xl font-bold text-green-400 text-sm tracking-widest uppercase transition-all"
                  >
                    Next Guest
                  </button>
                </>
              )}

              {status === 'error' && result && (
                <>
                  <div className="w-24 h-24 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-5">
                    <XCircle className="w-14 h-14 text-red-400" />
                  </div>
                  <p className="text-red-400 text-sm font-bold tracking-widest uppercase mb-2">Access Denied</p>
                  {result?.name && <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>{result.name}</h2>}
                  <p className="text-[#f5f0e8]/40 text-sm mb-8">{result?.message}</p>
                  <button
                    onClick={reset}
                    className="w-full py-3.5 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 rounded-xl font-bold text-red-400 text-sm tracking-widest uppercase transition-all"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          )}

          {/* Camera error (no result) */}
          {status === 'error' && !result && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 bg-[#080808]/95 backdrop-blur-md">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <p className="text-red-400 text-sm mb-6 px-4">{errorMessage || 'An error occurred'}</p>
              <button
                onClick={startScanner}
                className="flex items-center justify-center gap-2 px-6 py-3 card-dark gold-border rounded-xl font-bold text-[#c9a84c] text-sm tracking-widest uppercase transition-all hover:bg-[#c9a84c]/10"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between px-4">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="text-[#c9a84c]/50 hover:text-[#c9a84c] flex items-center gap-2 transition-colors text-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <div className="text-[#c9a84c]/20 text-xs select-none">✦ ✦ ✦</div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/admin/login');
            }}
            className="text-[#f5f0e8]/30 hover:text-red-400 flex items-center gap-2 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        #reader {
          border: none !important;
        }
        #reader video {
          object-fit: cover !important;
          border-radius: 1.5rem !important;
          width: 100% !important;
          height: 100% !important;
        }
        #reader__scan_region {
          border-radius: 1.5rem !important;
          overflow: hidden;
        }
        #reader__dashboard_section_csr button {
          background: rgba(201,168,76,0.1) !important;
          border: 1px solid rgba(201,168,76,0.3) !important;
          color: #c9a84c !important;
          border-radius: 0.75rem !important;
          padding: 0.5rem 1rem !important;
          font-size: 0.75rem !important;
        }
      `}</style>
    </div>
  );
}
