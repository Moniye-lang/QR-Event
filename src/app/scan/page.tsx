'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ShieldCheck, Camera, Loader2, CheckCircle2, XCircle, LogOut } from 'lucide-react';

export default function Scanner() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'checking' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ message: string; name?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login?redirect=/scan');
    } else {
      setIsAdmin(true);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    setStatus('scanning');
    
    // Give DOM time to render reader div
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }, 100);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (status === 'checking') return;
    
    // Pause scanner
    if (scannerRef.current) {
      scannerRef.current.pause();
    }

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
      }
    } catch (err) {
      setStatus('error');
      setResult({ message: 'Network error occurred' });
    }
  };

  const onScanFailure = (error: any) => {
    // console.warn(`Code scan error = ${error}`);
  };

  const reset = () => {
    setStatus('idle');
    setResult(null);
    if (scannerRef.current) {
      scannerRef.current.resume();
      setStatus('scanning');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 mb-2">
            <Camera className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold">Entry Scanner</h1>
          <p className="text-slate-400">Scan guest QR codes for instant verification</p>
        </div>

        <div className="relative aspect-square w-full glass rounded-[2.5rem] overflow-hidden flex items-center justify-center border border-white/10 shadow-2xl">
          {status === 'idle' && (
            <button 
              onClick={startScanner}
              className="p-8 group flex flex-col items-center space-y-4 hover:scale-105 transition-transform"
            >
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40 group-hover:bg-blue-500 transition-colors">
                <Camera className="w-10 h-10" />
              </div>
              <span className="font-bold text-lg">Start Camera</span>
            </button>
          )}

          <div id="reader" className={`w-full h-full ${status === 'scanning' ? 'block' : 'hidden'}`} />

          {(status === 'checking' || status === 'success' || status === 'error') && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 bg-[#020617]/90 backdrop-blur-md animate-in fade-in duration-300">
              {status === 'checking' && (
                <>
                  <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-4" />
                  <p className="text-xl font-bold">Verifying Token...</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-400 mb-2">Access Granted!</h2>
                  <p className="text-3xl font-bold mb-4">{result?.name}</p>
                  <p className="text-slate-400 mb-8">{result?.message}</p>
                  <button 
                    onClick={reset}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition-all w-full"
                  >
                    Next Guest
                  </button>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                    <XCircle className="w-12 h-12 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h2>
                  {result?.name && <p className="text-xl font-bold mb-2">{result.name}</p>}
                  <p className="text-slate-400 mb-8">{result?.message}</p>
                  <button 
                    onClick={reset}
                    className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-all w-full"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 flex items-center justify-between px-4">
           <button 
            onClick={() => router.push('/admin/dashboard')}
            className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/admin/login');
            }}
            className="text-slate-500 hover:text-red-400 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        #reader {
          border: none !important;
        }
        #reader__dashboard {
          display: none !important;
        }
        #reader video {
          object-fit: cover !important;
          border-radius: 2rem !important;
        }
      `}</style>
    </div>
  );
}
