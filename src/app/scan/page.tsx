'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  ShieldCheck,
  Camera,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  RefreshCw,
  QrCode,
  Flashlight,
  Zap,
  Volume2,
  VolumeX,
  Keyboard,
  Clock,
  ArrowRight,
  ZoomIn
} from 'lucide-react';

interface ScanRecord {
  id: string;
  name: string;
  tableNumber: string;
  time: string;
  success: boolean;
  message?: string;
}

// ─── Sound Synthesizer via Web Audio API ──────────────────────────────────────
function playBeep(type: 'success' | 'warning' | 'error') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'success') {
      // Pleasant crystal-clear dual chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
      osc2.frequency.setValueAtTime(1760, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.06);
      osc1.stop(ctx.currentTime + 0.19);
      osc2.stop(ctx.currentTime + 0.19);
    } else if (type === 'warning') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.23);
    }
  } catch {
    // AudioContext blocked or unsupported
  }
}

export default function Scanner() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'checking' | 'success' | 'warning' | 'error'>('idle');
  const [result, setResult] = useState<{
    message: string;
    name?: string;
    mainGuestName?: string;
    tableNumber?: string;
    alreadyCheckedIn?: boolean;
    usedAt?: string;
  } | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Usability features - Manual cancellation / dismissal by user
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [zoomSupported, setZoomSupported] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [zoomMax, setZoomMax] = useState<number>(1);

  // Manual code entry
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // Recent scans feed
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isScanningPausedRef = useRef(false);
  const isVerifyingRef = useRef(false);
  const lastScannedTokenRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const router = useRouter();

  const stopScanner = async () => {
    isScanningPausedRef.current = false;
    isVerifyingRef.current = false;
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
  };

  // ─── Start Scanner with HD Resolution & Full-Frame Optical Processing ──────────
  const startScanner = async () => {
    setErrorMessage(null);
    setResult(null);
    isScanningPausedRef.current = false;
    setStatus('scanning');

    try {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch { }
      }

      // Restrict strictly to QR_CODE for 10x faster frame processing (skips 16 other 1D/2D barcode algorithms)
      const html5QrCode = new Html5Qrcode('reader', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrCodeRef.current = html5QrCode;

      // fps: 24 for instantaneous detection
      // Note: Omit fixed qrbox so Html5Qrcode scans the entire frame at full camera resolution without downscaling
      const scanConfig = {
        fps: 24,
        aspectRatio: 1.0,
      };

      // Multi-stage camera initialization:
      // 1. High-Definition rear camera (1080p ideal) with continuous autofocus for reading from afar
      // 2. Standard rear camera fallback
      // 3. User camera fallback (front/webcam)
      // 4. Any enumerated camera
      const hdConstraints: MediaTrackConstraints = {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      };

      try {
        await html5QrCode.start(
          hdConstraints,
          scanConfig,
          onScanSuccess,
          undefined
        );
      } catch (err1) {
        console.warn('HD camera failed, trying standard environment camera:', err1);
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            scanConfig,
            onScanSuccess,
            undefined
          );
        } catch (err2) {
          console.warn('Environment camera failed, attempting user camera fallback:', err2);
          try {
            await html5QrCode.start(
              { facingMode: 'user' },
              scanConfig,
              onScanSuccess,
              undefined
            );
          } catch (err3) {
            console.warn('User camera failed, attempting enumerated camera list:', err3);
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              await html5QrCode.start(
                devices[0].id,
                scanConfig,
                onScanSuccess,
                undefined
              );
            } else {
              throw err3;
            }
          }
        }
      }

      // Check for torch & hardware zoom capabilities
      try {
        const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
        setHasTorch(Boolean(capabilities?.torchFeature()?.isSupported()));

        const zoomFeature = capabilities?.zoomFeature?.();
        if (zoomFeature?.isSupported()) {
          setZoomSupported(true);
          setZoomMax(zoomFeature.max());
          setZoomLevel(zoomFeature.value() || 1);
        } else {
          setZoomSupported(false);
        }
      } catch {
        setHasTorch(false);
        setZoomSupported(false);
      }

      // Apply continuous autofocus if supported by device camera
      try {
        const trackCaps = html5QrCode.getRunningTrackCapabilities();
        if ('focusMode' in trackCaps && (trackCaps as any).focusMode?.includes('continuous')) {
          await html5QrCode.applyVideoConstraints({
            advanced: [{ focusMode: 'continuous' }] as any,
          });
        }
      } catch { }
    } catch (err: any) {
      console.error('Scanner start error:', err);
      setStatus('error');
      if (err.toString().includes('NotAllowedError')) {
        setErrorMessage('Camera access was denied. Please allow camera permissions in browser settings.');
      } else if (err.toString().includes('NotFoundError')) {
        setErrorMessage('No camera found on this device.');
      } else {
        setErrorMessage('Failed to start camera. Make sure no other app is using it.');
      }
    }
  };

  // ─── Resume Scanning (Zero Camera Lag & Grace Period) ────────────────────────
  const resumeScanner = () => {
    setResult(null);
    setErrorMessage(null);
    setStatus('scanning');

    // 600ms grace period so guest can move their ticket away before next scan can arm
    setTimeout(() => {
      isScanningPausedRef.current = false;
      isVerifyingRef.current = false;
      lastScannedTokenRef.current = null;
    }, 600);

    if (!html5QrCodeRef.current || !html5QrCodeRef.current.isScanning) {
      startScanner();
    }
  };

  // Auth & component unmount lifecycle (stops camera ONLY when leaving page)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login?redirect=/scan');
    } else {
      setIsAdmin(true);
    }

    return () => {
      stopScanner();
    };
  }, [router]);

  // Separate keyboard dismissal effect (Escape / Space / Enter to dismiss)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        if (status === 'success' || status === 'warning' || status === 'error') {
          e.preventDefault();
          resumeScanner();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [status]);

  // ─── Torch / Flashlight Toggle ────────────────────────────────────────────────
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const nextTorch = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }] as any,
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.error('Torch toggle failed:', err);
    }
  };

  // ─── Hardware Optical / Digital Zoom Toggle (Scan from afar) ───────────────────
  const toggleZoom = async () => {
    if (!html5QrCodeRef.current || !zoomSupported) return;
    try {
      const cameraCaps = html5QrCodeRef.current.getRunningTrackCameraCapabilities();
      const zoomFeature = cameraCaps?.zoomFeature?.();
      if (!zoomFeature?.isSupported()) return;

      const minZoom = zoomFeature.min() || 1;
      const max = zoomFeature.max() || 1;

      // Cycle zoom: 1x -> 2x (or max if < 2) -> 3x (if max >= 3) -> 1x
      let nextZoom = minZoom;
      if (zoomLevel <= 1.2 && max >= 2) {
        nextZoom = Math.min(2, max);
      } else if (zoomLevel < 2.5 && max >= 3) {
        nextZoom = Math.min(3, max);
      } else {
        nextZoom = minZoom;
      }

      await zoomFeature.apply(nextZoom);
      setZoomLevel(nextZoom);
    } catch (err) {
      console.warn('Zoom adjustment failed:', err);
    }
  };

  // ─── Verification Handler ─────────────────────────────────────────────────────
  const processVerification = async (rawDecodedToken: string) => {
    // 1. Pause accepting new scans in software (keeps camera streaming smoothly)
    isScanningPausedRef.current = true;
    isVerifyingRef.current = true;
    setStatus('checking');

    // 2. Extract clean token if a full URL was scanned
    let cleanToken = rawDecodedToken.trim();
    if (cleanToken.includes('/invite/')) {
      cleanToken = cleanToken.split('/invite/')[1].split(/[?#/]/)[0].trim();
    } else if (cleanToken.includes('token=')) {
      const match = cleanToken.match(/token=([a-zA-Z0-9_-]+)/);
      if (match) cleanToken = match[1].trim();
    }

    const adminToken = localStorage.getItem('token');

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ token: cleanToken }),
      });

      const data = await res.json();

      if (data.success) {
        if (soundEnabled) playBeep('success');
        if (navigator.vibrate) navigator.vibrate(70);

        setStatus('success');
        setResult({
          message: data.message,
          name: data.name,
          mainGuestName: data.mainGuestName,
          tableNumber: data.tableNumber,
          usedAt: data.usedAt,
        });

        // Add to history list
        setScanHistory((prev) => [
          {
            id: cleanToken + '_' + Date.now(),
            name: data.name || 'Guest',
            tableNumber: data.tableNumber || 'Unassigned',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            success: true,
          },
          ...prev.slice(0, 5),
        ]);
        // Stays on screen until the user taps Cancel / Dismiss
      } else if (data.alreadyCheckedIn) {
        if (soundEnabled) playBeep('warning');
        if (navigator.vibrate) navigator.vibrate([60, 60, 60]);

        setStatus('warning');
        setResult({
          message: data.message,
          name: data.name,
          mainGuestName: data.mainGuestName,
          tableNumber: data.tableNumber,
          alreadyCheckedIn: true,
          usedAt: data.usedAt,
        });

        setScanHistory((prev) => [
          {
            id: cleanToken + '_' + Date.now(),
            name: data.name || 'Guest',
            tableNumber: data.tableNumber || 'Unassigned',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            success: false,
            message: 'Already Checked In',
          },
          ...prev.slice(0, 5),
        ]);
        // Stays on screen until the user taps Cancel / Dismiss
      } else {
        if (soundEnabled) playBeep('error');
        if (navigator.vibrate) navigator.vibrate(150);

        setStatus('error');
        setResult({
          message: data.message || 'Verification failed',
          name: data.name,
          mainGuestName: data.mainGuestName,
          tableNumber: data.tableNumber,
        });
        setErrorMessage(data.message || 'Pass verification rejected.');
        // Stays on screen until the user taps Cancel / Dismiss
      }
    } catch (err) {
      console.error('Check-in network error:', err);
      if (soundEnabled) playBeep('error');
      setStatus('error');
      setErrorMessage('Network error occurred. Please check connection and try again.');
    } finally {
      isVerifyingRef.current = false;
      // Note: isScanningPausedRef remains TRUE until user clicks Dismiss / Cancel!
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // 1. If currently paused, showing result card, or already verifying, drop frame immediately
    if (isScanningPausedRef.current || isVerifyingRef.current) return;

    // 2. Synchronous atomic lock
    isScanningPausedRef.current = true;
    isVerifyingRef.current = true;

    // 3. Prevent duplicate scans of the exact same code within 5 seconds
    const now = Date.now();
    if (lastScannedTokenRef.current === decodedText && now - lastScanTimeRef.current < 5000) {
      isVerifyingRef.current = false;
      return;
    }
    lastScannedTokenRef.current = decodedText;
    lastScanTimeRef.current = now;

    await processVerification(decodedText);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setManualLoading(true);
    setManualModalOpen(false);
    await processVerification(manualToken.trim());
    setManualToken('');
    setManualLoading(false);
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 md:p-6 flex flex-col items-center justify-between relative overflow-hidden select-none">
      {/* Ambient glows */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c9a84c]/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#c9a84c]/4 rounded-full blur-[140px]" />
      </div>

      {/* Top Action Bar */}
      <header className="w-full max-w-md flex items-center justify-between pt-2 pb-4 border-b border-[#c9a84c]/15">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c9a84c]/70 hover:text-[#ffe066] transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-[#c9a84c]" />
          <span>Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all ${soundEnabled
              ? 'bg-[#c9a84c]/15 border-[#c9a84c]/40 text-[#ffe066]'
              : 'bg-[#181818] border-white/10 text-white/40'
              }`}
            title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Manual Entry Button */}
          <button
            onClick={() => setManualModalOpen(true)}
            className="p-2 rounded-xl bg-[#181818] border border-white/10 text-white/70 hover:text-white hover:border-[#c9a84c]/40 transition-all"
            title="Enter Pass Token Manually"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Scanner Container */}
      <main className="max-w-md w-full my-auto space-y-5 text-center">
        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
            VIP Gate Reception
          </h1>
          <p className="text-[#c9a84c]/60 text-[11px] tracking-widest uppercase font-semibold">
            Felix's 50th Birthday · Instant QR Validation
          </p>
        </div>

        {/* Viewport Box */}
        <div className="relative aspect-square w-full card-dark gold-border rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl bg-black border-[#c9a84c]/30">
          {/* IDLE: Initial Start Button */}
          {status === 'idle' && (
            <button
              onClick={startScanner}
              className="p-8 group flex flex-col items-center gap-4 hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="w-24 h-24 rounded-full btn-gold flex items-center justify-center shadow-2xl animate-pulse-gold group-hover:scale-110 transition-transform">
                <Camera className="w-12 h-12 text-[#080808]" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-white text-lg" style={{ fontFamily: 'var(--font-playfair)' }}>
                  Start Camera Scanner
                </p>
                <p className="text-[#c9a84c]/60 text-xs tracking-widest uppercase">
                  Tap to Activate Gate Scanner
                </p>
              </div>
            </button>
          )}

          {/* CAMERA FEED */}
          <div
            id="reader"
            className="w-full h-full"
            style={{ display: status === 'idle' ? 'none' : 'block' }}
          />

          {/* Viewfinder Reticle Overlay while scanning */}
          {status === 'scanning' && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
              {/* Camera Controls: Zoom & Torch */}
              <div className="w-full flex items-center justify-between pointer-events-auto">
                {zoomSupported ? (
                  <button
                    type="button"
                    onClick={toggleZoom}
                    className="px-3 py-1.5 rounded-full backdrop-blur-md border border-[#c9a84c]/50 bg-black/70 hover:bg-[#c9a84c]/20 text-[#ffe066] font-mono text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    title="Tap to Zoom (scan from afar)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>{zoomLevel.toFixed(1)}x Zoom</span>
                  </button>
                ) : (
                  <div />
                )}

                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`p-2.5 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-lg active:scale-95 ${torchOn
                      ? 'bg-[#ffe066] border-[#ffe066] text-[#080808] shadow-[0_0_15px_#ffe066]'
                      : 'bg-black/70 border-white/20 text-white/80 hover:text-white'
                      }`}
                    title="Toggle Flashlight"
                  >
                    <Flashlight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Viewfinder Reticle Corners */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 border border-[#c9a84c]/20 rounded-2xl flex items-center justify-center">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#ffe066] rounded-tl-xl shadow-sm" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#ffe066] rounded-tr-xl shadow-sm" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#ffe066] rounded-bl-xl shadow-sm" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#ffe066] rounded-br-xl shadow-sm" />

                {/* Laser scanline animation */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#ffe066] to-transparent shadow-[0_0_8px_#ffe066] animate-laser" />
              </div>

              {/* Bottom status badge */}
              <div className="px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-[#c9a84c]/30 text-[10px] uppercase font-bold tracking-widest text-[#ffe066]">
                Instant Scan Active · Near or Afar
              </div>
            </div>
          )}

          {/* CHECKING SPINNER OVERLAY */}
          {status === 'checking' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 bg-[#080808]/90 backdrop-blur-md animate-fade-in">
              <div className="w-16 h-16 rounded-full border-2 border-[#c9a84c]/30 flex items-center justify-center mb-4 animate-pulse-gold">
                <Loader2 className="w-8 h-8 text-[#ffe066] animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-playfair)' }}>
                Validating Pass...
              </h3>
              <p className="text-[#c9a84c]/50 text-xs uppercase tracking-widest mt-1">Verifying entry permissions</p>
            </div>
          )}

          {/* SUCCESS RESULT CARD (VIP ACCESS GRANTED) */}
          {status === 'success' && result && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#0a1a0f]/95 via-[#080f0a]/95 to-[#080808]/98 backdrop-blur-md animate-scale-up">
              {/* Header */}
              <div className="w-full flex items-center justify-between text-xs border-b border-green-500/20 pb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 font-bold uppercase tracking-wider text-[10px]">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Access Granted
                </span>
                <button
                  type="button"
                  onClick={resumeScanner}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  title="Cancel & Dismiss"
                >
                  ✕
                </button>
              </div>

              {/* Guest & Table Centerpiece */}
              <div className="space-y-3 my-auto text-center w-full">
                {/* Massive Gold Table Badge */}
                <div className="inline-block py-2 px-6 rounded-2xl bg-gradient-to-r from-[#c9a84c]/20 via-[#ffe066]/30 to-[#c9a84c]/20 border border-[#ffe066]/50 shadow-[0_0_20px_rgba(255,224,102,0.25)]">
                  <p className="text-[10px] text-[#ffe066]/70 uppercase tracking-widest font-bold">Assigned Seating</p>
                  <p className="text-2xl md:text-3xl font-black text-[#ffe066] tracking-wider uppercase font-mono">
                    {result.tableNumber || 'Table Unassigned'}
                  </p>
                </div>

                {/* Guest Name */}
                <div className="space-y-1 px-2">
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
                    {result.name}
                  </h2>
                  {result.mainGuestName && (
                    <p className="text-[#ffe066] text-xs font-bold uppercase tracking-wider">
                      Guest of {result.mainGuestName}
                    </p>
                  )}
                </div>

                <p className="text-green-300/80 text-xs font-semibold">{result.message}</p>
              </div>

              {/* User Manual Cancel / Next Button */}
              <div className="w-full pt-2">
                <button
                  type="button"
                  onClick={resumeScanner}
                  className="w-full py-3.5 bg-gradient-to-r from-green-500/30 to-green-600/30 hover:from-green-500/40 hover:to-green-600/40 border border-green-500/50 rounded-2xl font-black text-green-300 text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                >
                  <span>✕ Dismiss / Scan Next Guest</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* WARNING RESULT CARD (ALREADY CHECKED IN) */}
          {status === 'warning' && result && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#211505]/95 via-[#140c03]/95 to-[#080808]/98 backdrop-blur-md animate-scale-up">
              <div className="w-full flex items-center justify-between text-xs border-b border-amber-500/20 pb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold uppercase tracking-wider text-[10px]">
                  <AlertTriangle className="w-3.5 h-3.5" /> Already Checked In
                </span>
                <button
                  type="button"
                  onClick={resumeScanner}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  title="Cancel & Dismiss"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 my-auto text-center w-full">
                <div className="inline-block py-1.5 px-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-sm font-bold">
                  {result.tableNumber ? `Seating: ${result.tableNumber}` : 'Table Unassigned'}
                </div>

                <div className="space-y-1 px-2">
                  <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
                    {result.name}
                  </h2>
                  {result.mainGuestName && (
                    <p className="text-amber-300/80 text-xs font-bold uppercase">Guest of {result.mainGuestName}</p>
                  )}
                </div>

                <p className="text-amber-200/80 text-xs max-w-xs mx-auto leading-relaxed">
                  {result.message}
                </p>
              </div>

              <div className="w-full pt-2">
                <button
                  type="button"
                  onClick={resumeScanner}
                  className="w-full py-3.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-2xl font-bold text-amber-300 text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>✕ Cancel & Scan Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ERROR CARD */}
          {status === 'error' && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#210707]/95 via-[#140303]/95 to-[#080808]/98 backdrop-blur-md animate-scale-up">
              <div className="w-full flex items-center justify-between text-xs border-b border-red-500/20 pb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold uppercase tracking-wider text-[10px]">
                  <XCircle className="w-3.5 h-3.5" /> Access Denied
                </span>
                <button
                  type="button"
                  onClick={resumeScanner}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  title="Cancel & Dismiss"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 my-auto text-center w-full">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                  <XCircle className="w-9 h-9" />
                </div>
                {result?.name && (
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
                    {result.name}
                  </h2>
                )}
                <p className="text-red-300/80 text-xs max-w-xs mx-auto leading-relaxed px-4">
                  {errorMessage || result?.message || 'Invalid or unrecognized entry token.'}
                </p>
              </div>

              <div className="w-full pt-2">
                <button
                  type="button"
                  onClick={resumeScanner}
                  className="w-full py-3.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-2xl font-bold text-red-300 text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>✕ Dismiss & Try Next</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Usher Counter & Recent Scans Pill */}
        {scanHistory.length > 0 && (
          <div className="bg-[#121212] border border-[#c9a84c]/20 rounded-2xl p-3.5 text-left space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-[#c9a84c]">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Clock className="w-3.5 h-3.5" /> Recent Gate Activity
              </span>
              <span className="text-[10px] font-mono text-[#ffe066]/80 bg-[#c9a84c]/10 px-2 py-0.5 rounded-full border border-[#c9a84c]/20">
                {scanHistory.filter((s) => s.success).length} Verified
              </span>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {scanHistory.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs border ${item.success
                    ? 'bg-green-500/5 border-green-500/20 text-[#f5f0e8]'
                    : 'bg-amber-500/5 border-amber-500/20 text-[#f5f0e8]/70'
                    }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full ${item.success ? 'bg-green-400' : 'bg-amber-400'}`} />
                    <span className="font-semibold truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] shrink-0">
                    <span className="text-[#ffe066] font-bold">{item.tableNumber}</span>
                    <span className="text-white/40 text-[10px]">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Footer Nav */}
      <footer className="w-full max-w-md flex items-center justify-between pb-2 pt-4 border-t border-white/10 text-xs">
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="text-white/40 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <span className="text-[#c9a84c]/30 text-xs select-none">✦ ✦ ✦</span>

        <button
          onClick={() => {
            localStorage.removeItem('token');
            router.push('/admin/login');
          }}
          className="text-white/30 hover:text-red-400 flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </footer>

      {/* Manual Code Input Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="card-dark gold-border rounded-3xl w-full max-w-sm p-6 space-y-5 border-[#c9a84c]/30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#c9a84c]/20 pb-3">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-[#ffe066]" />
                <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'var(--font-playfair)' }}>
                  Manual Pass Code Entry
                </h3>
              </div>
              <button
                onClick={() => setManualModalOpen(false)}
                className="text-white/40 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <p className="text-xs text-[#f5f0e8]/60 leading-relaxed">
                If the guest's QR code cannot be scanned, enter the 8-character token code printed on their pass:
              </p>

              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="e.g. 8d2c94a1 or full token"
                className="w-full p-3.5 rounded-xl bg-[#141414] border border-[#c9a84c]/40 text-white font-mono text-center text-sm tracking-wider uppercase focus:outline-none focus:border-[#ffe066]"
                autoFocus
              />

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="flex-1 py-3 card-dark gold-border rounded-xl text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualLoading || !manualToken.trim()}
                  className="flex-1 py-3 btn-gold rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg disabled:opacity-40"
                >
                  {manualLoading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : 'Verify Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global CSS Overrides */}
      <style jsx global>{`
        #reader {
          border: none !important;
          width: 100% !important;
          height: 100% !important;
        }
        #reader video {
          object-fit: cover !important;
          border-radius: 1.5rem !important;
          width: 100% !important;
          height: 100% !important;
        }
        #reader__scan_region {
          border-radius: 1.5rem !important;
          width: 100% !important;
          height: 100% !important;
        }
        #reader__dashboard_section_csr {
          display: none !important;
        }
        #reader__status_span {
          display: none !important;
        }
        @keyframes laser {
          0% {
            transform: translateY(-80px);
            opacity: 0.2;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(80px);
            opacity: 0.2;
          }
        }
        .animate-laser {
          animation: laser 1.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
