'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  QrCode,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  ExternalLink,
  Trash2,
  RotateCcw,
  RefreshCw,
  Copy,
  Crown
} from 'lucide-react';

interface Invite {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  token: string;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
  attending?: 'yes' | 'no';
  isAdditionalGuest?: boolean;
  rsvpSubmitted?: boolean;
  maxUses: number;
}

export default function AdminDashboard() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [maxGuests, setMaxGuests] = useState('0');
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/admin/login'); return; }

    try {
      setLoading(true);
      const res = await fetch('/api/invite', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInvites(data.invites);
      } else if (res.status === 401) {
        router.push('/admin/login');
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: newName, 
          phone: newPhone, 
          maxUses: (parseInt(maxGuests) || 0) + 1 
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInvites([data.invite, ...invites]);
        setModalOpen(false);
        setNewName('');
        setNewPhone('');
        setMaxGuests('0');
      } else {
        alert(data.message || 'Failed to create invitation');
      }
    } catch (err) {
      console.error('Create error:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleReset = async (id: string) => {
    if (!confirm('Are you sure you want to reset this invitation?')) return;
    const token = localStorage.getItem('token');
    setActionId(id);
    try {
      const res = await fetch(`/api/invite/actions/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInvites(invites.map(i => i._id === id ? data.invite : i));
      }
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invitation? This cannot be undone.')) return;
    const token = localStorage.getItem('token');
    setActionId(id);
    try {
      const res = await fetch(`/api/invite/actions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInvites(invites.filter(i => i._id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setActionId(null);
    }
  };

  const handleCopyLink = (invite: Invite) => {
    const path = invite.rsvpSubmitted ? `/invite/${invite.token}` : `/rsvp?token=${invite.token}`;
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
    setCopyToast(invite._id);
    setTimeout(() => setCopyToast(null), 2000);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/admin/login');
  };

  const filteredInvites = invites.filter(i =>
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.phone && i.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Stats
  const confirmedAttending = invites.filter(i => i.rsvpSubmitted && i.attending === 'yes').length;
  const checkedInCount = invites.filter(i => i.rsvpSubmitted && i.attending === 'yes' && i.used).length;
  const pendingRsvpCount = invites.filter(i => !i.rsvpSubmitted).length;
  const declinedCount = invites.filter(i => i.rsvpSubmitted && i.attending === 'no').length;

  if (loading && invites.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border border-[#c9a84c]/40 flex items-center justify-center mx-auto animate-pulse-gold">
            <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
          </div>
          <p className="text-[#c9a84c]/50 text-xs tracking-widest uppercase">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#f5f0e8] p-4 md:p-8 relative">
      {/* Ambient glow */}
      <div className="fixed top-0 left-0 w-full h-64 bg-[#c9a84c]/4 blur-[120px] pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl btn-gold flex items-center justify-center shadow-lg animate-pulse-gold">
              <Crown className="w-6 h-6 text-[#080808]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
                Event Dashboard
              </h1>
              <p className="text-[#c9a84c]/50 text-xs tracking-widest uppercase">50th Birthday Celebration · Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchInvites}
              className="p-2.5 card-dark gold-border rounded-xl transition-all hover:bg-[#c9a84c]/10"
              title="Refresh"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 text-[#c9a84c] ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => router.push('/scan')}
              className="flex items-center gap-2 px-4 py-2.5 card-dark gold-border rounded-xl font-semibold transition-all hover:bg-[#c9a84c]/10 text-sm"
            >
              <QrCode className="w-4 h-4 text-[#c9a84c]" />
              <span className="text-[#c9a84c]">Scan QR</span>
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 btn-gold rounded-xl font-bold text-xs tracking-widest uppercase shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Invite</span>
            </button>
            <button
              onClick={logout}
              className="p-2.5 card-dark gold-border rounded-xl transition-all hover:bg-red-500/10"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-[#f5f0e8]/50" />
            </button>
          </div>
        </header>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Confirmed"
            value={confirmedAttending}
            icon={<Users className="w-5 h-5" />}
            color="gold"
            subtitle="Attending"
          />
          <StatCard
            title="Checked In"
            value={checkedInCount}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
            subtitle="At the venue"
          />
          <StatCard
            title="Pending RSVP"
            value={pendingRsvpCount}
            icon={<Calendar className="w-5 h-5" />}
            color="amber"
            subtitle="Awaiting response"
          />
          <StatCard
            title="Declined"
            value={declinedCount}
            icon={<XCircle className="w-5 h-5" />}
            color="red"
            subtitle="Won't attend"
          />
        </div>

        {/* ── Guest List Table ── */}
        <div className="card-dark gold-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-[#c9a84c]/10 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Crown className="w-4 h-4 text-[#c9a84c] shrink-0" />
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">Guest List</h2>
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a84c]/40" />
              <input
                type="text"
                placeholder="Search guests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/50 transition-all text-sm text-white placeholder-[#f5f0e8]/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#c9a84c]/10">
                  <th className="px-6 py-3.5 text-[#c9a84c]/50 text-[10px] font-bold uppercase tracking-[0.15em]">Guest</th>
                  <th className="px-6 py-3.5 text-[#c9a84c]/50 text-[10px] font-bold uppercase tracking-[0.15em]">Token</th>
                  <th className="px-6 py-3.5 text-[#c9a84c]/50 text-[10px] font-bold uppercase tracking-[0.15em]">Status</th>
                  <th className="px-6 py-3.5 text-[#c9a84c]/50 text-[10px] font-bold uppercase tracking-[0.15em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9a84c]/5">
                {filteredInvites.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[#f5f0e8]/30 text-sm">
                      {searchTerm ? 'No guests match your search.' : 'No invitations created yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredInvites.map((invite) => (
                    <tr key={invite._id} className="hover:bg-[#c9a84c]/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center text-xs font-bold text-[#c9a84c] shrink-0">
                            {invite.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">
                              {invite.name}
                              {invite.maxUses > 1 && (
                                <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-[#c9a84c]/10 text-[#c9a84c] uppercase font-bold">
                                  +{invite.maxUses - 1} Guests
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#f5f0e8]/30">{invite.phone || 'No phone number'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-[#c9a84c]/5 border border-[#c9a84c]/15 px-2 py-1 rounded-lg text-[#c9a84c]/60 font-mono">
                          {invite.token.slice(0, 8)}...
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge invite={invite} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {invite.attending !== 'no' && (
                            <>
                              {/* Copy link */}
                              <button
                                onClick={() => handleCopyLink(invite)}
                                className="p-2 rounded-lg transition-all hover:bg-[#c9a84c]/10 relative"
                                title={invite.rsvpSubmitted ? 'Copy Ticket Link' : 'Copy RSVP Link'}
                              >
                                {copyToast === invite._id ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-[#c9a84c]/50 hover:text-[#c9a84c]" />
                                )}
                              </button>
                              {/* Open link */}
                              <a
                                href={invite.rsvpSubmitted ? `/invite/${invite.token}` : `/rsvp?token=${invite.token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg transition-all hover:bg-[#c9a84c]/10"
                                title={invite.rsvpSubmitted ? 'View Ticket' : 'View RSVP Page'}
                              >
                                <ExternalLink className="w-4 h-4 text-[#f5f0e8]/30 hover:text-[#c9a84c]" />
                              </a>
                            </>
                          )}

                          {invite.attending !== 'no' && invite.used && (
                            <button
                              onClick={() => handleReset(invite._id)}
                              disabled={actionId === invite._id}
                              className="p-2 rounded-lg transition-all hover:bg-blue-400/10"
                              title="Reset Usage"
                            >
                              <RotateCcw className={`w-4 h-4 text-[#f5f0e8]/30 hover:text-blue-400 ${actionId === invite._id ? 'animate-spin' : ''}`} />
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(invite._id)}
                            disabled={actionId === invite._id}
                            className="p-2 rounded-lg transition-all hover:bg-red-400/10"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-[#f5f0e8]/30 hover:text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredInvites.length > 0 && (
            <div className="px-6 py-3 border-t border-[#c9a84c]/10 flex items-center justify-between">
              <p className="text-[#c9a84c]/30 text-xs">
                Showing {filteredInvites.length} of {invites.length} guests
              </p>
              <div className="flex items-center gap-1 text-[#c9a84c]/20 text-xs select-none">
                <span>✦</span><span>✦</span><span>✦</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Invite Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="card-dark gold-border w-full max-w-md p-8 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full btn-gold flex items-center justify-center mx-auto mb-3 animate-pulse-gold">
                <UserPlus className="w-6 h-6 text-[#080808]" />
              </div>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>New Invitation</h2>
              <p className="text-[#c9a84c]/40 text-xs mt-1 tracking-widest uppercase">50th Birthday Celebration</p>
            </div>

            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c9a84c]/60 ml-1 uppercase tracking-widest">
                  Guest Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/50 outline-none text-white text-sm placeholder-[#f5f0e8]/20 transition-all"
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c9a84c]/60 ml-1 uppercase tracking-widest">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/50 outline-none text-white text-sm placeholder-[#f5f0e8]/20 transition-all"
                  placeholder="e.g. +2348012345678"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c9a84c]/60 ml-1 uppercase tracking-widest">
                  Allowed Additional Guests
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/55 outline-none text-white text-sm placeholder-[#f5f0e8]/20 transition-all"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setNewName(''); setNewPhone(''); setMaxGuests('0'); }}
                  className="flex-1 py-3 card-dark gold-border rounded-xl font-bold text-xs tracking-widest uppercase text-[#f5f0e8]/50 hover:text-[#f5f0e8] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 btn-gold rounded-xl font-bold text-xs tracking-widest uppercase disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Invite ✦'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ invite }: { invite: Invite }) {
  if (!invite.rsvpSubmitted) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wide">
        <Calendar className="w-3 h-3" />
        Pending RSVP
      </span>
    );
  }
  if (invite.attending === 'no') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wide">
        <XCircle className="w-3 h-3" />
        Declined
      </span>
    );
  }
  if (invite.used) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wide">
        <CheckCircle2 className="w-3 h-3" />
        Checked In
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-[#c9a84c] text-[10px] font-bold uppercase tracking-wide">
      <CheckCircle2 className="w-3 h-3" />
      Confirmed
    </span>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  title, value, icon, color, subtitle
}: {
  title: string; value: number | string; icon: React.ReactNode; color: 'gold' | 'green' | 'amber' | 'red'; subtitle?: string;
}) {
  const colors = {
    gold:  { bg: 'bg-[#c9a84c]/10', border: 'border-[#c9a84c]/25', icon: 'text-[#c9a84c]',  val: 'text-[#c9a84c]'  },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/20',  icon: 'text-green-400', val: 'text-green-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20',  icon: 'text-amber-400', val: 'text-amber-400' },
    red:   { bg: 'bg-red-500/10',   border: 'border-red-500/20',    icon: 'text-red-400',   val: 'text-red-400'   },
  };
  const c = colors[color];

  return (
    <div className={`card-dark ${c.border} border rounded-2xl p-5 flex items-center justify-between hover:scale-[1.02] transition-all`}>
      <div className="space-y-1">
        <p className="text-[#c9a84c]/40 text-[10px] font-bold uppercase tracking-widest">{title}</p>
        <p className={`text-3xl font-black ${c.val}`} style={{ fontFamily: 'var(--font-playfair)' }}>{value}</p>
        {subtitle && <p className="text-[#f5f0e8]/25 text-[10px]">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center ${c.icon}`}>
        {icon}
      </div>
    </div>
  );
}
