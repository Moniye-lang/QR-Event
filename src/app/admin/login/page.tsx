'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, User, Loader2 } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        router.push('/admin/dashboard');
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#080808] relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#c9a84c]/6 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-[#c9a84c]/4 rounded-full blur-[140px]" />
      </div>

      {/* Corner ornaments */}
      <div className="absolute top-8 left-8 text-[#c9a84c]/15 text-5xl select-none">✦</div>
      <div className="absolute top-8 right-8 text-[#c9a84c]/15 text-5xl select-none">✦</div>
      <div className="absolute bottom-8 left-8 text-[#c9a84c]/15 text-5xl select-none">✦</div>
      <div className="absolute bottom-8 right-8 text-[#c9a84c]/15 text-5xl select-none">✦</div>

      <div className="w-full max-w-md">
        <div className="card-dark gold-border p-8 md:p-10 rounded-3xl space-y-8 shadow-2xl relative overflow-hidden">
          {/* Top gold accent bar */}
          <div
            className="absolute top-0 left-0 w-full h-1"
            style={{ background: 'linear-gradient(90deg, #c9a84c, #f5d882, #c9a84c)' }}
          />

          {/* Header */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl btn-gold shadow-lg mb-2 animate-pulse-gold">
              <ShieldCheck className="w-8 h-8 text-[#080808]" />
            </div>
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
              Admin Portal
            </h1>
            <p className="text-[#c9a84c]/50 text-xs tracking-widest uppercase">50th Birthday · Event Control</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c9a84c]/40" />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/50 transition-all text-white placeholder-[#f5f0e8]/20 text-sm"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#c9a84c]/40" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/50 transition-all text-white placeholder-[#f5f0e8]/20 text-sm"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 btn-gold rounded-xl font-bold tracking-widest uppercase disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In ✦</span>
              )}
            </button>
          </form>

          {/* Footer ornament */}
          <div className="flex items-center justify-center gap-2 text-[#c9a84c]/20 text-xs select-none">
            <span>✦</span><span>✦</span><span>✦</span>
          </div>
        </div>
      </div>
    </div>
  );
}
