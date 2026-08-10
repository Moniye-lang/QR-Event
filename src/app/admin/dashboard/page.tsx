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
  Crown,
  MessageSquare,
  Send,
  AlertCircle,
  Check,
  Layers,
  Settings,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
  SendHorizontal,
  Info
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
  whatsappStatus?: 'not_sent' | 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  whatsappMessageId?: string;
  whatsappSentAt?: string;
  whatsappError?: string;
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

  // ── WhatsApp Mass Sender State ──
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [waSending, setWaSending] = useState(false);
  const [singleSendingId, setSingleSendingId] = useState<string | null>(null);
  const [waFilter, setWaFilter] = useState<'all_unsent' | 'failed_only' | 'all'>('all_unsent');
  const [waForceResend, setWaForceResend] = useState(false);
  const [waUseTemplate, setWaUseTemplate] = useState(false);
  const [waConcurrency, setWaConcurrency] = useState(5);
  const [waBatchLimit, setWaBatchLimit] = useState(500);
  const [waProgress, setWaProgress] = useState<{ total: number; sent: number; failed: number; processed: number } | null>(null);
  const [waLogs, setWaLogs] = useState<Array<{ name: string; phone: string; status: 'sent' | 'failed'; error?: string; time: string }>>([]);
  const [waSummary, setWaSummary] = useState<string | null>(null);

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
    } fontally {
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

  // ── Single WhatsApp Send ──
  const handleSendSingleWhatsApp = async (invite: Invite) => {
    if (!invite.phone || !invite.phone.trim()) {
      alert(`Cannot send WhatsApp: ${invite.name} has no phone number recorded.`);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setSingleSendingId(invite._id);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteId: invite._id, isTemplate: waUseTemplate }),
      });

      const data = await res.json();
      if (data.success && data.invite) {
        setInvites(invites.map(i => i._id === invite._id ? data.invite : i));
      } else {
        alert(`WhatsApp send error: ${data.message || 'Failed to send WhatsApp message'}`);
        if (data.invite) {
          setInvites(invites.map(i => i._id === invite._id ? data.invite : i));
        }
      }
    } catch (err) {
      console.error('WhatsApp single send error:', err);
      alert('An unexpected error occurred while sending the WhatsApp invitation.');
    } finally {
      setSingleSendingId(null);
    }
  };

  // ── Mass WhatsApp Send ──
  const handleMassSendWhatsApp = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setWaSending(true);
    setWaSummary(null);
    setWaLogs([]);
    setWaProgress({ total: 0, sent: 0, failed: 0, processed: 0 });

    try {
      const res = await fetch('/api/whatsapp/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filter: waFilter,
          forceResend: waForceResend,
          isTemplate: waUseTemplate,
          concurrency: waConcurrency,
          limit: waBatchLimit,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWaProgress({
          total: data.totalProcessed,
          sent: data.sentCount,
          failed: data.failedCount,
          processed: data.totalProcessed,
        });
        setWaSummary(data.message);
        if (data.details) {
          setWaLogs(
            data.details.map((d: any) => ({
              name: d.name,
              phone: d.phone,
              status: d.status,
              error: d.error,
              time: new Date().toLocaleTimeString(),
            }))
          );
        }
        await fetchInvites();
      } else {
        alert(`Mass send error: ${data.message}`);
      }
    } catch (err: any) {
      console.error('Mass send error:', err);
      alert('Server error executing WhatsApp mass send.');
    } finally {
      setWaSending(false);
    }
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

  // WhatsApp Stats
  const waSentCount = invites.filter(i => i.whatsappStatus === 'sent' || i.whatsappStatus === 'delivered' || i.whatsappStatus === 'read').length;
  const waUnsentCount = invites.filter(i => !i.whatsappStatus || i.whatsappStatus === 'not_sent').length;
  const waFailedCount = invites.filter(i => i.whatsappStatus === 'failed').length;

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
          <div className="flex flex-wrap items-center gap-3">
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
              onClick={() => setWaModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs tracking-widest uppercase shadow-lg transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Mass Send</span>
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

        {/* ── Event & WhatsApp Stats ── */}
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
            title="WhatsApp Sent"
            value={`${waSentCount} / ${invites.length}`}
            icon={<MessageSquare className="w-5 h-5" />}
            color="emerald"
            subtitle={`${waUnsentCount} unsent · ${waFailedCount} failed`}
          />
          <StatCard
            title="Pending RSVP"
            value={pendingRsvpCount}
            icon={<Calendar className="w-5 h-5" />}
            color="amber"
            subtitle="Awaiting response"
          />
        </div>

        {/* ── Guest List Table ── */}
        <div className="card-dark gold-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-[#c9a84c]/10 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Crown className="w-4 h-4 text-[#c9a84c] shrink-0" />
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">Guest List ({invites.length})</h2>
            </div>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a84c]/40" />
              <input
                type="text"
                placeholder="Search guests by name or phone..."
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
                  <th className="px-6 py-3.5 text-[#c9a84c]/50 text-[10px] font-bold uppercase tracking-[0.15em]">RSVP Status</th>
                  <th className="px-6 py-3.5 text-[#c9a84c]/50 text-[10px] font-bold uppercase tracking-[0.15em]">WhatsApp Delivery</th>
                  <th className="px-6 py-3.5 text-[#c9a84c]/50 text-[10px] font-bold uppercase tracking-[0.15em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9a84c]/5">
                {filteredInvites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#f5f0e8]/30 text-sm">
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
                        <WhatsAppBadge invite={invite} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Send via WhatsApp Action */}
                          <button
                            onClick={() => handleSendSingleWhatsApp(invite)}
                            disabled={singleSendingId === invite._id || !invite.phone}
                            className="p-2 rounded-lg transition-all hover:bg-emerald-500/10 disabled:opacity-30"
                            title={invite.phone ? "Send Invitation via WhatsApp" : "No Phone Number Recorded"}
                          >
                            {singleSendingId === invite._id ? (
                              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                            ) : (
                              <SendHorizontal className="w-4 h-4 text-emerald-400/70 hover:text-emerald-400" />
                            )}
                          </button>

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

      {/* ── WhatsApp Mass Send Modal ── */}
      {waModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="card-dark gold-border w-full max-w-2xl p-6 md:p-8 rounded-2xl shadow-2xl my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between border-b border-[#c9a84c]/15 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Meta WhatsApp Cloud Mass Sender</h2>
                  <p className="text-xs text-[#c9a84c]/60">Dispatch personalized invitations via official WhatsApp API</p>
                </div>
              </div>
              <button
                onClick={() => setWaModalOpen(false)}
                disabled={waSending}
                className="text-[#f5f0e8]/40 hover:text-white text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Filter Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#c9a84c]/70 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Target Recipients
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setWaFilter('all_unsent')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                      waFilter === 'all_unsent'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-[#111] border-[#c9a84c]/20 text-[#f5f0e8]/60 hover:border-[#c9a84c]/40'
                    }`}
                  >
                    Unsent Only ({invites.filter(i => !i.whatsappStatus || i.whatsappStatus === 'not_sent').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaFilter('failed_only')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                      waFilter === 'failed_only'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-[#111] border-[#c9a84c]/20 text-[#f5f0e8]/60 hover:border-[#c9a84c]/40'
                    }`}
                  >
                    Failed Retries ({invites.filter(i => i.whatsappStatus === 'failed').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaFilter('all')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                      waFilter === 'all'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-[#111] border-[#c9a84c]/20 text-[#f5f0e8]/60 hover:border-[#c9a84c]/40'
                    }`}
                  >
                    All Guests ({invites.length})
                  </button>
                </div>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-[#111] border border-[#c9a84c]/15 rounded-xl space-y-1">
                  <label className="text-[10px] font-bold text-[#c9a84c]/60 uppercase tracking-widest">
                    Worker Concurrency (Rate Limit)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={waConcurrency}
                      onChange={(e) => setWaConcurrency(parseInt(e.target.value))}
                      className="flex-1 accent-emerald-500"
                    />
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {waConcurrency} req/batch
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#111] border border-[#c9a84c]/15 rounded-xl space-y-1">
                  <label className="text-[10px] font-bold text-[#c9a84c]/60 uppercase tracking-widest">
                    Max Batch Limit (Up to 500)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={waBatchLimit}
                    onChange={(e) => setWaBatchLimit(Math.min(500, parseInt(e.target.value) || 500))}
                    className="w-full px-3 py-1.5 bg-black border border-[#c9a84c]/20 rounded-lg text-xs font-mono text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Options Toggles */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 bg-[#111] border border-[#c9a84c]/15 rounded-xl">
                <label className="flex items-center gap-2.5 text-xs text-[#f5f0e8]/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waForceResend}
                    onChange={(e) => setWaForceResend(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 bg-black border-[#c9a84c]/30"
                  />
                  <span>Force Resend (Override duplicate prevention)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-[#f5f0e8]/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={waUseTemplate}
                    onChange={(e) => setWaUseTemplate(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 bg-black border-[#c9a84c]/30"
                  />
                  <span>Use Meta HSM Template Format</span>
                </label>
              </div>

              {/* Security Banner */}
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-xs text-emerald-400/90">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>WhatsApp Access Token & Credentials stored securely server-side.</span>
              </div>

              {/* Progress & Summary Bar */}
              {waProgress && (
                <div className="space-y-2 p-4 bg-[#111] border border-[#c9a84c]/20 rounded-xl">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white">Batch Execution Progress</span>
                    <span className="text-emerald-400 font-mono">
                      {waProgress.processed} / {waProgress.total} Processed
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-black rounded-full overflow-hidden border border-[#c9a84c]/20">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                      style={{
                        width: `${waProgress.total > 0 ? (waProgress.processed / waProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#f5f0e8]/50 pt-1">
                    <span className="text-emerald-400 font-semibold">Sent: {waProgress.sent}</span>
                    <span className="text-red-400 font-semibold">Failed: {waProgress.failed}</span>
                  </div>
                </div>
              )}

              {/* Summary message */}
              {waSummary && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold">
                  {waSummary}
                </div>
              )}

              {/* Live Console Logs */}
              {waLogs.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#c9a84c]/60 uppercase tracking-widest">
                    Execution Log ({waLogs.length})
                  </label>
                  <div className="max-h-40 overflow-y-auto bg-black p-3 rounded-xl border border-[#c9a84c]/15 space-y-1 text-xs font-mono">
                    {waLogs.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between py-0.5 border-b border-zinc-900 last:border-0">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className={log.status === 'sent' ? 'text-emerald-400' : 'text-red-400'}>
                            {log.status === 'sent' ? '✓' : '✕'}
                          </span>
                          <span className="text-white truncate">{log.name}</span>
                          <span className="text-zinc-500">{log.phone}</span>
                        </div>
                        <div className="text-right shrink-0">
                          {log.status === 'sent' ? (
                            <span className="text-emerald-400 text-[10px]">SUCCESS</span>
                          ) : (
                            <span className="text-red-400 text-[10px]">{log.error || 'FAILED'}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWaModalOpen(false)}
                  disabled={waSending}
                  className="flex-1 py-3 card-dark gold-border rounded-xl font-bold text-xs tracking-widest uppercase text-[#f5f0e8]/50 hover:text-[#f5f0e8] transition-all disabled:opacity-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleMassSendWhatsApp}
                  disabled={waSending}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs tracking-widest uppercase shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {waSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Messages...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Execute Mass Send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

// ─── WhatsApp Delivery Badge ──────────────────────────────────────────────────
function WhatsAppBadge({ invite }: { invite: Invite }) {
  const status = invite.whatsappStatus || 'not_sent';

  if (status === 'sent' || status === 'delivered' || status === 'read') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wide"
        title={invite.whatsappSentAt ? `Sent at ${new Date(invite.whatsappSentAt).toLocaleString()}` : 'WhatsApp Sent'}
      >
        <MessageSquare className="w-3 h-3" />
        {status === 'delivered' ? 'Delivered' : status === 'read' ? 'Read' : 'Sent'}
      </span>
    );
  }
  if (status === 'sending' || status === 'queued') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wide animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin" />
        Sending...
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wide"
        title={invite.whatsappError || 'Failed to send'}
      >
        <AlertCircle className="w-3 h-3" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-zinc-400 text-[10px] font-bold uppercase tracking-wide">
      <MessageSquare className="w-3 h-3 opacity-40" />
      Not Sent
    </span>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  title, value, icon, color, subtitle
}: {
  title: string; value: number | string; icon: React.ReactNode; color: 'gold' | 'green' | 'emerald' | 'amber' | 'red'; subtitle?: string;
}) {
  const colors = {
    gold:    { bg: 'bg-[#c9a84c]/10', border: 'border-[#c9a84c]/25', icon: 'text-[#c9a84c]',  val: 'text-[#c9a84c]'  },
    green:   { bg: 'bg-green-500/10', border: 'border-green-500/20',  icon: 'text-green-400', val: 'text-green-400' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', val: 'text-emerald-400' },
    amber:   { bg: 'bg-amber-500/10', border: 'border-amber-500/20',  icon: 'text-amber-400', val: 'text-amber-400' },
    red:     { bg: 'bg-red-500/10',   border: 'border-red-500/20',    icon: 'text-red-400',   val: 'text-red-400'   },
  };
  const c = colors[color];

  return (
    <div className={`card-dark ${c.border} border rounded-2xl p-5 flex items-center justify-between hover:scale-[1.02] transition-all`}>
      <div className="space-y-1">
        <p className="text-[#c9a84c]/40 text-[10px] font-bold uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-black ${c.val}`} style={{ fontFamily: 'var(--font-playfair)' }}>{value}</p>
        {subtitle && <p className="text-[#f5f0e8]/25 text-[10px]">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center ${c.icon}`}>
        {icon}
      </div>
    </div>
  );
}
