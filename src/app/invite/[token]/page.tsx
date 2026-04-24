'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QrCode, Calendar, MapPin, Loader2, Download, CheckCircle2 } from 'lucide-react';
import QRCode from 'qrcode';

interface Invite {
  name: string;
  email: string;
  token: string;
  used: boolean;
  createdAt: string;
}

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
        // Generate QR code
        const url = await QRCode.toDataURL(data.invite.token, {
          width: 600,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrDataUrl(url);
      } else {
        setError(data.message || 'Invite not found');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6 text-center">
        <div className="space-y-4">
          <div className="text-red-400 text-6xl font-bold">404</div>
          <h1 className="text-2xl font-bold">Invalid Invitation</h1>
          <p className="text-slate-400">This link is either expired or invalid.</p>
          <a href="/" className="inline-block px-6 py-2 bg-blue-600 rounded-lg font-semibold">Go Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-xl">
        <div className="glass rounded-[3rem] overflow-hidden shadow-2xl relative">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center text-white">
            <h1 className="text-3xl font-bold mb-2">Event 1</h1>
            <p className="opacity-90">Exclusive Access Event</p>
          </div>

          <div className="p-8 md:p-12 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{invite.name}</h2>
              <p className="text-slate-400">{invite.email}</p>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-6 bg-white rounded-[2rem] shadow-xl relative">
                {invite.used && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] rounded-[2rem] flex flex-col items-center justify-center text-red-600 p-4 text-center z-10">
                    <CheckCircle2 className="w-16 h-16 mb-2" />
                    <span className="font-bold text-xl uppercase">Already Used</span>
                    <span className="text-sm opacity-70">Entry Validated</span>
                  </div>
                )}
                <img 
                  src={qrDataUrl} 
                  alt="QR Code" 
                  className={`w-64 h-64 md:w-80 md:h-80 transition-opacity ${invite.used ? 'opacity-20' : 'opacity-100'}`}
                />
              </div>
              <p className="text-xs text-slate-500 font-mono">{invite.token}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-6 border-y border-white/5">
              <div className="flex items-center gap-3 text-slate-400">
                <Calendar className="w-5 h-5 text-blue-400" />
                <div className="text-sm">
                  <p className="font-semibold text-white">Date</p>
                  <p>April 30, 2026</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin className="w-5 h-5 text-purple-400" />
                <div className="text-sm">
                  <p className="font-semibold text-white">Location</p>
                  <p>Sky Lounge, Lagos</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => window.print()}
              className="w-full py-4 glass hover:bg-white/10 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Invitation</span>
            </button>
          </div>
          
          <div className="bg-white/5 p-4 text-center text-[10px] text-slate-500 uppercase tracking-[0.2em]">
            Present this QR code at the entrance for verification
          </div>
        </div>
      </div>
    </div>
  );
}
