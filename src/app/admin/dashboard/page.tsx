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
  RefreshCw
} from 'lucide-react';

interface Invite {
  _id: string;
  name: string;
  email: string;
  token: string;
  used: boolean;
  usedAt: string | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

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
        body: JSON.stringify({ name: newName, email: newEmail }),
      });

      const data = await res.json();
      if (data.success) {
        setInvites([data.invite, ...invites]);
        setModalOpen(false);
        setNewName('');
        setNewEmail('');
      }
    } catch (err) {
      console.error('Create error:', err);
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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/admin/login');
  };

  const filteredInvites = invites.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && invites.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617]">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white">Event Dashboard</h1>
            <p className="text-slate-400">Manage invitations and monitor check-ins</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchInvites}
              className="p-2.5 glass hover:bg-white/10 rounded-xl transition-all"
              title="Refresh"
              disabled={loading}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold transition-all shadow-lg shadow-blue-900/20"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create Invite</span>
            </button>
            <button 
              onClick={logout}
              className="p-2.5 glass hover:bg-white/10 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard title="Total Invites" value={invites.length} icon={<Users className="text-blue-400" />} />
          <StatCard title="Checked In" value={invites.filter(i => i.used).length} icon={<CheckCircle2 className="text-green-400" />} />
          <StatCard title="Pending" value={invites.filter(i => !i.used).length} icon={<Calendar className="text-purple-400" />} />
        </div>

        {/* Search and Table */}
        <div className="glass rounded-[2rem] overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Guest</th>
                  <th className="px-6 py-4 font-semibold">Token</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredInvites.map((invite) => (
                  <tr key={invite._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-medium text-white">{invite.name}</div>
                      <div className="text-xs text-slate-500">{invite.email || 'No email provided'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <code className="text-xs bg-white/5 px-2 py-1 rounded text-blue-300">{invite.token.slice(0, 8)}...</code>
                    </td>
                    <td className="px-6 py-5">
                      {invite.used ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Used {new Date(invite.usedAt!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Valid</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <a 
                          href={`/invite/${invite.token}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                          title="View Invite"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        
                        {invite.used && (
                          <button
                            onClick={() => handleReset(invite._id)}
                            disabled={actionId === invite._id}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/5 rounded-lg transition-all"
                            title="Reset Usage"
                          >
                            <RotateCcw className={`w-4 h-4 ${actionId === invite._id ? 'animate-spin' : ''}`} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(invite._id)}
                          disabled={actionId === invite._id}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-8 rounded-[2rem] border border-white/10 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold mb-6">New Invitation</h2>
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-1">Guest Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 ml-1">Guest Email (Optional)</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 glass hover:bg-white/10 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-semibold transition-all"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number | string, icon: React.ReactNode }) {
  return (
    <div className="glass p-6 rounded-[1.5rem] border border-white/5 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}
