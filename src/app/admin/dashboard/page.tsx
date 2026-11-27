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
  Pencil,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  Shuffle,
  Lock,
  FileArchive,
  Printer,
  Sparkles
} from 'lucide-react';
import {
  exportToExcel,
  exportToWord,
  ExportFilter,
  ExportFormat
} from '@/lib/exportUtils';
import { TABLE_CYCLES } from '@/lib/tableSwitchConfig';
import { exportBulkPassesZip, ExportProgress } from '@/lib/bulkQrExporter';

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
  mainGuestName?: string;
  rsvpSubmitted?: boolean;
  maxUses: number;
  section?: string;
  tableNumber?: string;
}

export default function AdminDashboard() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'section1' | 'section2'>('section1');

  // Create Invite Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [guestOfName, setGuestOfName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTableNumber, setNewTableNumber] = useState('');
  const [maxGuests, setMaxGuests] = useState('0');
  const [newSection, setNewSection] = useState<'section1' | 'section2'>('section1');
  const [creating, setCreating] = useState(false);

  // Edit Invite Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInvite, setEditingInvite] = useState<Invite | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGuestOf, setEditGuestOf] = useState('');
  const [editTableNumber, setEditTableNumber] = useState('');
  const [editMaxGuests, setEditMaxGuests] = useState('0');
  const [editSection, setEditSection] = useState<'section1' | 'section2'>('section1');
  const [updating, setUpdating] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const router = useRouter();

  // Export & Collation states
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFilter, setExportFilter] = useState<ExportFilter>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [exportSectionScope, setExportSectionScope] = useState<'current' | 'all'>('current');
  const [exporting, setExporting] = useState(false);

  // Table filter state for dashboard list view
  const [tableFilter, setTableFilter] = useState<'all' | 'with-table' | 'without-table'>('all');

  // Table Switch & Re-allocation states
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [switchSectionScope, setSwitchSectionScope] = useState<'section1' | 'section2' | 'all'>('section1');
  const [switchLoading, setSwitchLoading] = useState(false);
  const [switchExecuting, setSwitchExecuting] = useState(false);
  const [switchStatusData, setSwitchStatusData] = useState<any>(null);
  const [switchFeedback, setSwitchFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmSwitch, setConfirmSwitch] = useState<{ cycleId: string; cycleName: string } | null>(null);
  const [showRevertSection, setShowRevertSection] = useState(false);

  // Bulk Pass & QR Exporter states
  const [bulkPassModalOpen, setBulkPassModalOpen] = useState(false);
  const [bulkPassFormat, setBulkPassFormat] = useState<'full-pass' | 'square-badge'>('full-pass');
  const [bulkPassOrganizeByTable, setBulkPassOrganizeByTable] = useState(true);
  const [bulkPassIncludeIndex, setBulkPassIncludeIndex] = useState(true);
  const [bulkPassIncludeExcel, setBulkPassIncludeExcel] = useState(true);
  const [bulkPassSectionScope, setBulkPassSectionScope] = useState<'current' | 'all'>('current');
  const [bulkPassGenerating, setBulkPassGenerating] = useState(false);
  const [bulkPassProgress, setBulkPassProgress] = useState<ExportProgress | null>(null);

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

  const openSwitchModal = async (sectionScope?: 'section1' | 'section2' | 'all') => {
    const targetScope = sectionScope || activeSection;
    setSwitchSectionScope(targetScope);
    setSwitchFeedback(null);
    setConfirmSwitch(null);
    setSwitchModalOpen(true);
    await fetchSwitchStatus(targetScope);
  };

  const fetchSwitchStatus = async (scope: string) => {
    setSwitchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/invite/switch-tables?section=${scope}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSwitchStatusData(data);
      }
    } catch (err) {
      console.error('Failed to fetch switch status:', err);
    } finally {
      setSwitchLoading(false);
    }
  };

  const handleExecuteSwitch = async (cycleId: string) => {
    setSwitchExecuting(true);
    setSwitchFeedback(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/invite/switch-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          section: switchSectionScope,
          cycleId,
          action: 'execute',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSwitchFeedback({ type: 'success', message: data.message });
        setConfirmSwitch(null);
        fetchInvites();
        await fetchSwitchStatus(switchSectionScope);
      } else {
        setSwitchFeedback({ type: 'error', message: data.message || 'Failed to execute table switch' });
      }
    } catch (err: any) {
      setSwitchFeedback({ type: 'error', message: err.message || 'Network error executing switch' });
    } finally {
      setSwitchExecuting(false);
    }
  };

  const handleRevertSwitch = async (cycleId: string = 'all') => {
    if (!confirm('Are you sure you want to revert table assignments back to their previous values?')) return;
    setSwitchExecuting(true);
    setSwitchFeedback(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/invite/switch-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          section: switchSectionScope,
          cycleId,
          action: 'revert',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSwitchFeedback({ type: 'success', message: data.message });
        fetchInvites();
        await fetchSwitchStatus(switchSectionScope);
      } else {
        setSwitchFeedback({ type: 'error', message: data.message || 'Failed to revert tables' });
      }
    } catch (err: any) {
      setSwitchFeedback({ type: 'error', message: err.message || 'Network error reverting switch' });
    } finally {
      setSwitchExecuting(false);
    }
  };

  const openCreateModal = () => {
    setNewSection(activeSection);
    setNewName('');
    setGuestOfName('');
    setNewPhone('');
    setNewTableNumber('');
    setMaxGuests('0');
    setModalOpen(true);
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
          mainGuestName: guestOfName.trim(),
          tableNumber: newTableNumber.trim(),
          maxUses: (parseInt(maxGuests) || 0) + 1,
          section: newSection,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInvites([data.invite, ...invites]);
        setModalOpen(false);
        setNewName('');
        setGuestOfName('');
        setNewPhone('');
        setNewTableNumber('');
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

  const openEditModal = (invite: Invite) => {
    setEditingInvite(invite);
    setEditName(invite.name);
    setEditPhone(invite.phone || '');
    setEditGuestOf(invite.mainGuestName || '');
    setEditTableNumber(invite.tableNumber || '');
    setEditMaxGuests(Math.max(0, invite.maxUses - 1).toString());
    setEditSection((invite.section as 'section1' | 'section2') || 'section1');
    setEditModalOpen(true);
  };

  const handleUpdateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvite) return;
    setUpdating(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/invite/actions/${editingInvite._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
          mainGuestName: editGuestOf.trim(),
          tableNumber: editTableNumber.trim(),
          maxUses: (parseInt(editMaxGuests) || 0) + 1,
          section: editSection,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInvites(invites.map(i => i._id === editingInvite._id ? data.invite : i));
        setEditModalOpen(false);
        setEditingInvite(null);
      } else {
        alert(data.message || 'Failed to update invitation');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setUpdating(false);
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

  // Helper for displaying table names properly formatted without duplicates like "Table Table 5"
  const formatTableLabel = (tbl?: string | number) => {
    if (tbl == null) return null;
    const s = String(tbl).trim();
    if (!s) return null;
    if (/^table\s+/i.test(s)) return s;
    return `Table ${s}`;
  };

  // Section-specific isolated collections
  const section1Invites = invites.filter(i => (i.section || 'section1') === 'section1');
  const section2Invites = invites.filter(i => (i.section || 'section1') === 'section2');

  const currentSectionInvites = activeSection === 'section2' ? section2Invites : section1Invites;

  // Table allocation breakdown
  const withTableCount = currentSectionInvites.filter(i => Boolean(i.tableNumber && String(i.tableNumber).trim())).length;
  const withoutTableCount = currentSectionInvites.filter(i => !i.tableNumber || !String(i.tableNumber).trim()).length;

  const filteredInvites = currentSectionInvites.filter(i => {
    const rawTable = i.tableNumber != null ? String(i.tableNumber).trim() : '';
    const hasTable = Boolean(rawTable);
    if (tableFilter === 'with-table' && !hasTable) return false;
    if (tableFilter === 'without-table' && hasTable) return false;

    if (!searchTerm.trim()) return true;

    const term = searchTerm.trim();
    const termLower = term.toLowerCase();

    // 1. Guest Name & Whose Guest (Host) Name
    const name = String(i.name || '').toLowerCase();
    const hostName = String(i.mainGuestName || '').toLowerCase();
    if (name.includes(termLower) || hostName.includes(termLower)) {
      return true;
    }

    // 2. Token match (if search query has 3+ chars)
    const token = String(i.token || '').toLowerCase();
    if (termLower.length >= 3 && token.includes(termLower)) {
      return true;
    }

    // 3. Table Number match
    if (hasTable) {
      const tableLower = rawTable.toLowerCase();

      // Query is 'table' or 'tables' -> matches any guest with a table
      if (termLower === 'table' || termLower === 'tables') {
        return true;
      }

      // Cleaned identifiers (strip prefixes like "table", "tbl", "t", "#", "no.", ":", "-")
      const cleanQ = termLower
        .replace(/^table\s*[:#.-]?\s*/i, '')
        .replace(/^tbl\s*[:#.-]?\s*/i, '')
        .replace(/^t\s*[:#.-]?\s*/i, '')
        .replace(/^#\s*/i, '')
        .replace(/^no\.?\s*/i, '')
        .trim();

      const cleanTable = tableLower
        .replace(/^table\s*[:#.-]?\s*/i, '')
        .replace(/^tbl\s*[:#.-]?\s*/i, '')
        .replace(/^t\s*[:#.-]?\s*/i, '')
        .replace(/^#\s*/i, '')
        .replace(/^no\.?\s*/i, '')
        .trim();

      if (cleanQ && cleanTable) {
        // Exact match of clean identifiers: e.g. "5" === "5", "vip" === "vip", "a" === "a"
        if (cleanTable === cleanQ) return true;

        // Exact numeric comparison (e.g. "5" vs "05")
        const numQ = parseInt(cleanQ, 10);
        const numTable = parseInt(cleanTable, 10);
        const isNumQ = !isNaN(numQ) && String(numQ) === cleanQ.replace(/^0+/, '') && /^\d+$/.test(cleanQ);
        const isNumTable = !isNaN(numTable) && String(numTable) === cleanTable.replace(/^0+/, '') && /^\d+$/.test(cleanTable);

        if (isNumQ && isNumTable) {
          if (numQ === numTable) return true;
          // Pure numbers that are not equal (e.g. 5 vs 15) do not match
        } else {
          // Alphanumeric table (e.g. "VIP 5", "Table A", "Zone B")
          try {
            const escapedQ = cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (new RegExp('(^|\\b|\\s|[-_])' + escapedQ + '($|\\b|\\s|[-_])', 'i').test(cleanTable)) {
              return true;
            }
          } catch {
            // fallback
          }

          if (!isNumQ && cleanTable.includes(cleanQ)) {
            return true;
          }
        }
      }

      // Direct full match with "Table {tableLower}"
      const formattedTable = 'table ' + tableLower;
      if (formattedTable === termLower || formattedTable.replace(/\s+/g, '') === termLower.replace(/\s+/g, '')) {
        return true;
      }
    } else {
      // Unassigned search keywords
      if (
        termLower === 'no table' ||
        termLower === 'without table' ||
        termLower === 'unassigned' ||
        termLower === 'no-table'
      ) {
        return true;
      }
    }

    // 4. Phone number match
    const rawPhone = String(i.phone || '').trim();
    if (rawPhone) {
      const phoneDigits = rawPhone.replace(/\D/g, '');
      const queryDigits = term.replace(/\D/g, '');

      // Only match phone if query clearly looks like a phone (starts with 0 or +, or has >= 4 digits)
      const isPhoneQuery =
        term.startsWith('+') ||
        term.startsWith('0') ||
        queryDigits.length >= 4;

      if (isPhoneQuery && queryDigits.length >= 3) {
        if (phoneDigits.includes(queryDigits)) return true;

        // Nigerian format normalization (e.g. +2348012345678 vs 08012345678)
        let localPhone = phoneDigits;
        if (phoneDigits.startsWith('234') && phoneDigits.length >= 12) {
          localPhone = '0' + phoneDigits.slice(3);
        }
        let localQuery = queryDigits;
        if (queryDigits.startsWith('234') && queryDigits.length >= 12) {
          localQuery = '0' + queryDigits.slice(3);
        }

        if (localPhone.includes(queryDigits) || phoneDigits.includes(localQuery) || localPhone.includes(localQuery)) {
          return true;
        }

        if (rawPhone.toLowerCase().includes(termLower)) return true;
      } else if (!isPhoneQuery && queryDigits.length >= 4) {
        if (phoneDigits.includes(queryDigits)) return true;
      }
    }

    return false;
  });

  // Stats strictly calculated for the active section (isolated, no total mixing)
  const confirmedAttending = currentSectionInvites.filter(i => i.rsvpSubmitted && i.attending === 'yes').length;
  const checkedInCount = currentSectionInvites.filter(i => i.rsvpSubmitted && i.attending === 'yes' && i.used).length;
  const pendingRsvpCount = currentSectionInvites.filter(i => !i.rsvpSubmitted).length;

  // Export handlers
  const openExportModal = (filter: ExportFilter = 'all') => {
    setExportFilter(filter);
    setExportSectionScope('current');
    setExportModalOpen(true);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const targetInvites = exportSectionScope === 'all' ? invites : currentSectionInvites;
      const sectionLabel = exportSectionScope === 'all'
        ? 'All Sections (Combined)'
        : activeSection === 'section1' ? 'Section 1 (Main Event)' : 'Section 2 (Separate RSVP)';

      if (exportFormat === 'excel') {
        exportToExcel(targetInvites, exportFilter, sectionLabel);
      } else {
        await exportToWord(targetInvites, exportFilter, sectionLabel);
      }
      setExportModalOpen(false);
    } catch (err) {
      console.error('Export error:', err);
      alert('An error occurred during file generation. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleStartBulkPassExport = async () => {
    setBulkPassGenerating(true);
    try {
      const targetInvites = bulkPassSectionScope === 'all' ? invites : currentSectionInvites;
      const sectionLabel = bulkPassSectionScope === 'all'
        ? 'All Sections'
        : activeSection === 'section1' ? 'Section 1 (Main Event)' : 'Section 2 (Separate RSVP)';
      await exportBulkPassesZip(
        targetInvites,
        {
          format: bulkPassFormat,
          organizeByTable: bulkPassOrganizeByTable,
          includeIndexTxt: bulkPassIncludeIndex,
          includeSpreadsheet: bulkPassIncludeExcel,
          sectionLabel,
        },
        (progress) => setBulkPassProgress(progress)
      );
    } catch (err: any) {
      console.error('Bulk pass export error:', err);
      alert(err.message || 'Error generating bulk passes.');
    } finally {
      setBulkPassGenerating(false);
    }
  };

  // Pre-calculated counts for export modal
  const targetExportInvites = exportSectionScope === 'all' ? invites : currentSectionInvites;
  const exportWithTableCount = targetExportInvites.filter(i => Boolean(i.tableNumber && String(i.tableNumber).trim())).length;
  const exportWithoutTableCount = targetExportInvites.filter(i => !i.tableNumber || !String(i.tableNumber).trim()).length;
  const exportCount = exportFilter === 'all'
    ? targetExportInvites.length
    : exportFilter === 'with-table'
      ? exportWithTableCount
      : exportWithoutTableCount;

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
              onClick={() => openExportModal('all')}
              className="flex items-center gap-2 px-4 py-2.5 card-dark gold-border rounded-xl font-semibold transition-all hover:bg-[#c9a84c]/10 text-sm text-[#ffe066]"
              title="Collate and export table allocations to Spreadsheet or Word"
            >
              <Download className="w-4 h-4 text-[#c9a84c]" />
              <span>Export Collation</span>
            </button>
            <button
              onClick={() => { setBulkPassModalOpen(true); setBulkPassProgress(null); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#c9a84c]/20 to-[#ffe066]/20 hover:from-[#c9a84c]/30 hover:to-[#ffe066]/30 border border-[#c9a84c]/40 text-[#ffe066] rounded-xl font-bold text-xs tracking-widest uppercase transition-all shadow-md cursor-pointer"
              title="Bulk download all QR codes & passes in an organized ZIP file"
            >
              <FileArchive className="w-4 h-4 text-[#ffe066]" />
              <span>Bulk QR Passes</span>
            </button>
            <button
              onClick={() => openSwitchModal(activeSection)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl font-bold text-xs tracking-widest uppercase transition-all shadow-md cursor-pointer"
              title="Table Re-allocation & Exchange Manager (1-Click Safe Migration)"
            >
              <ArrowLeftRight className="w-4 h-4 text-amber-400" />
              <span>Switch Tables</span>
            </button>
            <button
              onClick={() => router.push('/scan')}
              className="flex items-center gap-2 px-4 py-2.5 card-dark gold-border rounded-xl font-semibold transition-all hover:bg-[#c9a84c]/10 text-sm"
            >
              <QrCode className="w-4 h-4 text-[#c9a84c]" />
              <span className="text-[#c9a84c]">Scan QR</span>
            </button>
            <button
              onClick={openCreateModal}
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

        {/* ── RSVP Isolated Section Switcher ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-1.5 bg-[#121212]/80 border border-[#c9a84c]/20 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto p-1">
            <button
              onClick={() => setActiveSection('section1')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${activeSection === 'section1'
                ? 'btn-gold shadow-lg shadow-[#c9a84c]/20 text-[#080808]'
                : 'text-[#f5f0e8]/60 hover:text-white hover:bg-[#c9a84c]/10'
                }`}
            >
              <span>✦ Section 1 (Main Event)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeSection === 'section1' ? 'bg-[#080808]/30 text-[#080808]' : 'bg-[#c9a84c]/15 text-[#c9a84c]'
                }`}>
                {section1Invites.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('section2')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide uppercase transition-all whitespace-nowrap cursor-pointer ${activeSection === 'section2'
                ? 'btn-gold shadow-lg shadow-[#c9a84c]/20 text-[#080808]'
                : 'text-[#f5f0e8]/60 hover:text-white hover:bg-[#c9a84c]/10'
                }`}
            >
              <span>✦ Section 2 (Separate RSVP)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeSection === 'section2' ? 'bg-[#080808]/30 text-[#080808]' : 'bg-[#c9a84c]/15 text-[#c9a84c]'
                }`}>
                {section2Invites.length}
              </span>
            </button>
          </div>

          <div className="px-3 text-xs text-[#c9a84c]/60 font-medium">
            Active: <span className="text-white font-bold">{activeSection === 'section1' ? 'Section 1' : 'Section 2'}</span>
          </div>
        </div>

        {/* ── Event Stats (Strictly Isolated Per Section) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`${activeSection === 'section1' ? 'Section 1' : 'Section 2'} Confirmed`}
            value={confirmedAttending}
            icon={<Users className="w-5 h-5" />}
            color="gold"
            subtitle="Attending"
          />
          <StatCard
            title={`${activeSection === 'section1' ? 'Section 1' : 'Section 2'} Checked In`}
            value={checkedInCount}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="green"
            subtitle="At the venue"
          />
          <StatCard
            title="Table Allocated"
            value={withTableCount}
            icon={<Crown className="w-5 h-5" />}
            color="gold"
            subtitle="Assigned to tables"
            onClick={() => setTableFilter('with-table')}
          />
          <StatCard
            title="Without Table"
            value={withoutTableCount}
            icon={<AlertCircle className="w-5 h-5" />}
            color={withoutTableCount > 0 ? 'amber' : 'green'}
            subtitle={withoutTableCount > 0 ? 'Needs allocation · Click to view' : 'All seated!'}
            onClick={() => setTableFilter('without-table')}
          />
        </div>

        {/* ── Guest List Table ── */}
        <div className="card-dark gold-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-[#c9a84c]/10 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Crown className="w-4 h-4 text-[#c9a84c] shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-white tracking-widest uppercase">
                    {activeSection === 'section1' ? 'Section 1 Guests' : 'Section 2 Guests'} ({currentSectionInvites.length})
                  </h2>
                  <p className="text-[11px] text-[#c9a84c]/50">
                    {activeSection === 'section1' ? 'Guests registered exclusively under Section 1' : 'Guests registered exclusively under Section 2'}
                  </p>
                </div>
              </div>
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a84c]/40" />
                <input
                  type="text"
                  placeholder="Search by name, phone, table (e.g. 5, Table 5)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/50 transition-all text-sm text-white placeholder-[#f5f0e8]/20"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c9a84c]/40 hover:text-[#ffe066] text-xs transition-colors p-1"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs & Quick Table Collation Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#c9a84c]/10">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setTableFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${tableFilter === 'all'
                    ? 'btn-gold text-[#080808] border-[#c9a84c]'
                    : 'bg-[#111] text-[#f5f0e8]/60 border-[#c9a84c]/20 hover:text-white hover:border-[#c9a84c]/40'
                    }`}
                >
                  All Guests ({currentSectionInvites.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter('with-table')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${tableFilter === 'with-table'
                    ? 'btn-gold text-[#080808] border-[#c9a84c]'
                    : 'bg-[#111] text-[#f5f0e8]/60 border-[#c9a84c]/20 hover:text-white hover:border-[#c9a84c]/40'
                    }`}
                >
                  🍽️ With Table ({withTableCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilter('without-table')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${tableFilter === 'without-table'
                    ? 'bg-amber-400 text-black border-amber-300 font-black shadow-md'
                    : 'bg-[#111] text-amber-300 border-amber-500/30 hover:border-amber-400/60'
                    }`}
                >
                  ⚠️ Without Table ({withoutTableCount})
                </button>
              </div>

              {/* Direct Quick Collation Downloads */}
              <div className="flex items-center gap-2">
                {withoutTableCount > 0 && (
                  <button
                    type="button"
                    onClick={() => openExportModal('without-table')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-all"
                    title="Download spreadsheet or document of guests without tables"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Without Table ({withoutTableCount})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openExportModal('all')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c9a84c]/10 hover:bg-[#c9a84c]/20 border border-[#c9a84c]/25 text-[#ffe066] rounded-xl text-xs font-semibold transition-all"
                  title="Download complete collation"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#c9a84c]" />
                  <span>Collation Report</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#c9a84c]/10">
                  <th className="px-6 py-3.5 text-[#c9a84c]/50 text-[10px] font-bold uppercase tracking-[0.15em]">Guest</th>
                  <th className="px-6 py-3.5 text-[#c9a84c]/50 text-[10px] font-bold uppercase tracking-[0.15em]">Table</th>
                  <th className="px-6 py-3.5 text-[#c9a84c]/50 text-[10px] font-bold uppercase tracking-[0.15em]">Token</th>
                  <th className="px-6 py-3.5 text-[#c9a84c]/50 text-[10px] font-bold uppercase tracking-[0.15em]">RSVP Status</th>
                  <th className="px-6 py-3.5 text-[#c9a84c]/50 text-[10px] font-bold uppercase tracking-[0.15em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9a84c]/5">
                {filteredInvites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#f5f0e8]/30 text-sm">
                      {searchTerm
                        ? 'No guests match your search in this section.'
                        : tableFilter === 'without-table'
                          ? '🎉 All guests in this section have a table assigned! No unassigned guests.'
                          : tableFilter === 'with-table'
                            ? 'No guests in this section have a table assigned yet.'
                            : activeSection === 'section2'
                              ? 'No invitations created in Section 2 yet. Click "Create Invite" to add guests to Section 2.'
                              : 'No invitations created in Section 1 yet.'}
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
                            <div className="font-semibold text-white text-sm flex items-center gap-2 flex-wrap">
                              <span>{invite.name}</span>
                              {invite.maxUses > 1 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#c9a84c]/10 text-[#c9a84c] uppercase font-bold">
                                  +{invite.maxUses - 1} Guests
                                </span>
                              )}
                              {invite.isAdditionalGuest && (
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#ffe066]/15 border border-[#ffe066]/30 text-[#ffe066] uppercase font-bold tracking-wider">
                                  Guest of {invite.mainGuestName || 'Primary Host'}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#f5f0e8]/30">
                              {invite.isAdditionalGuest ? (
                                <span className="text-[#ffe066]/80 font-medium">Guest of: {invite.mainGuestName || 'Primary Host'}</span>
                              ) : (
                                <div className="space-y-0.5">
                                  <div>{invite.phone || 'No phone number'}</div>
                                  {invite.mainGuestName && (
                                    <div className="text-[#ffe066]/80 font-medium">Guest of: {invite.mainGuestName}</div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {formatTableLabel(invite.tableNumber) ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#ffe066]">
                            {formatTableLabel(invite.tableNumber)}
                          </span>
                        ) : (
                          <span className="text-xs text-[#f5f0e8]/20">—</span>
                        )}
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

                          <button
                            onClick={() => openEditModal(invite)}
                            className="p-2 rounded-lg transition-all hover:bg-[#c9a84c]/10"
                            title="Edit Invitation"
                          >
                            <Pencil className="w-4 h-4 text-[#c9a84c]/70 hover:text-[#c9a84c]" />
                          </button>

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
                Showing {filteredInvites.length} of {currentSectionInvites.length} guests in {activeSection === 'section1' ? 'Section 1' : 'Section 2'}
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
              {/* Section Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c9a84c]/60 ml-1 uppercase tracking-widest">
                  RSVP Section *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSection('section1')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${newSection === 'section1'
                      ? 'btn-gold text-[#080808] border-[#c9a84c]'
                      : 'bg-[#111] text-[#f5f0e8]/50 border-[#c9a84c]/20 hover:border-[#c9a84c]/50'
                      }`}
                  >
                    ✦ Section 1 (Main)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSection('section2')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${newSection === 'section2'
                      ? 'btn-gold text-[#080808] border-[#c9a84c]'
                      : 'bg-[#111] text-[#f5f0e8]/50 border-[#c9a84c]/20 hover:border-[#c9a84c]/50'
                      }`}
                  >
                    ✦ Section 2 (Separate)
                  </button>
                </div>
              </div>

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
                  Table Number (Optional)
                </label>
                <input
                  type="text"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/50 outline-none text-white text-sm placeholder-[#f5f0e8]/20 transition-all"
                  placeholder="e.g. 5, VIP Table, Table A"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c9a84c]/60 ml-1 uppercase tracking-widest">
                  Whose Guest Are They? (Optional)
                </label>
                <input
                  type="text"
                  value={guestOfName}
                  onChange={(e) => setGuestOfName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/50 outline-none text-white text-sm placeholder-[#f5f0e8]/20 transition-all"
                  placeholder="Name of the person they are a guest of"
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
                  onClick={() => { setModalOpen(false); setNewName(''); setGuestOfName(''); setNewPhone(''); setNewTableNumber(''); setMaxGuests('0'); }}
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

      {/* ── Edit Invite Modal ── */}
      {editModalOpen && editingInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="card-dark gold-border w-full max-w-md p-8 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full btn-gold flex items-center justify-center mx-auto mb-3 animate-pulse-gold">
                <Pencil className="w-6 h-6 text-[#080808]" />
              </div>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>Edit Invitation</h2>
              <p className="text-[#c9a84c]/40 text-xs mt-1 tracking-widest uppercase">50th Birthday Celebration</p>
            </div>

            <form onSubmit={handleUpdateInvite} className="space-y-4">
              {/* Section Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c9a84c]/60 ml-1 uppercase tracking-widest">
                  RSVP Section *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditSection('section1')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${editSection === 'section1'
                      ? 'btn-gold text-[#080808] border-[#c9a84c]'
                      : 'bg-[#111] text-[#f5f0e8]/50 border-[#c9a84c]/20 hover:border-[#c9a84c]/50'
                      }`}
                  >
                    ✦ Section 1 (Main)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSection('section2')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${editSection === 'section2'
                      ? 'btn-gold text-[#080808] border-[#c9a84c]'
                      : 'bg-[#111] text-[#f5f0e8]/50 border-[#c9a84c]/20 hover:border-[#c9a84c]/50'
                      }`}
                  >
                    ✦ Section 2 (Separate)
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c9a84c]/60 ml-1 uppercase tracking-widest">
                  Guest Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
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
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/50 outline-none text-white text-sm placeholder-[#f5f0e8]/20 transition-all"
                  placeholder="e.g. +2348012345678"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c9a84c]/60 ml-1 uppercase tracking-widest">
                  Table Number (Optional)
                </label>
                <input
                  type="text"
                  value={editTableNumber}
                  onChange={(e) => setEditTableNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/50 outline-none text-white text-sm placeholder-[#f5f0e8]/20 transition-all"
                  placeholder="e.g. 5, VIP Table, Table A"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c9a84c]/60 ml-1 uppercase tracking-widest">
                  Whose Guest Are They? (Optional)
                </label>
                <input
                  type="text"
                  value={editGuestOf}
                  onChange={(e) => setEditGuestOf(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/50 outline-none text-white text-sm placeholder-[#f5f0e8]/20 transition-all"
                  placeholder="Name of the person they are a guest of"
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
                  value={editMaxGuests}
                  onChange={(e) => setEditMaxGuests(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#c9a84c]/20 rounded-xl focus:ring-2 focus:ring-[#c9a84c]/30 focus:border-[#c9a84c]/55 outline-none text-white text-sm placeholder-[#f5f0e8]/20 transition-all"
                  placeholder="0"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditModalOpen(false); setEditingInvite(null); }}
                  className="flex-1 py-3 card-dark gold-border rounded-xl font-bold text-xs tracking-widest uppercase text-[#f5f0e8]/50 hover:text-[#f5f0e8] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-3 btn-gold rounded-xl font-bold text-xs tracking-widest uppercase disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Changes ✦'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Export / Collation Modal ── */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="card-dark gold-border w-full max-w-lg p-6 sm:p-8 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full btn-gold flex items-center justify-center mx-auto mb-3 animate-pulse-gold">
                <Download className="w-6 h-6 text-[#080808]" />
              </div>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
                Collate & Download Table Allocation
              </h2>
              <p className="text-[#c9a84c]/60 text-xs mt-1 tracking-wider">
                Export collation as a Spreadsheet (Excel) or Word Document
              </p>
            </div>

            <div className="space-y-5">
              {/* 1. Section Scope */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c9a84c]/70 uppercase tracking-widest ml-1">
                  1. Event Section Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportSectionScope('current')}
                    className={`p-3 rounded-xl text-left border transition-all ${exportSectionScope === 'current'
                      ? 'border-[#c9a84c] bg-[#c9a84c]/15 text-white'
                      : 'border-[#c9a84c]/20 bg-[#111] text-[#f5f0e8]/50 hover:border-[#c9a84c]/40'
                      }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>{activeSection === 'section1' ? 'Section 1 (Main)' : 'Section 2'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c9a84c]/20 text-[#ffe066]">
                        {currentSectionInvites.length}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#f5f0e8]/40 mt-0.5">Active section only</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportSectionScope('all')}
                    className={`p-3 rounded-xl text-left border transition-all ${exportSectionScope === 'all'
                      ? 'border-[#c9a84c] bg-[#c9a84c]/15 text-white'
                      : 'border-[#c9a84c]/20 bg-[#111] text-[#f5f0e8]/50 hover:border-[#c9a84c]/40'
                      }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center justify-between">
                      <span>All Sections</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c9a84c]/20 text-[#ffe066]">
                        {invites.length}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#f5f0e8]/40 mt-0.5">Section 1 + Section 2</div>
                  </button>
                </div>
              </div>

              {/* 2. Collation Option / Filter */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c9a84c]/70 uppercase tracking-widest ml-1">
                  2. Collation Content
                </label>
                <div className="space-y-2">
                  {/* Option: All */}
                  <button
                    type="button"
                    onClick={() => setExportFilter('all')}
                    className={`w-full p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 ${exportFilter === 'all'
                      ? 'border-[#c9a84c] bg-[#c9a84c]/15 shadow-md'
                      : 'border-[#c9a84c]/20 bg-[#111] hover:border-[#c9a84c]/40'
                      }`}
                  >
                    <div className="w-5 h-5 rounded-full border border-[#c9a84c] flex items-center justify-center mt-0.5 shrink-0">
                      {exportFilter === 'all' && <div className="w-2.5 h-2.5 rounded-full bg-[#c9a84c]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">All Guests (Complete Collation)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c9a84c]/20 text-[#ffe066] font-bold">
                          {targetExportInvites.length} Guests
                        </span>
                      </div>
                      <p className="text-[11px] text-[#f5f0e8]/50 mt-0.5">
                        Grouped table-by-table PLUS a dedicated section for unassigned guests.
                      </p>
                    </div>
                  </button>

                  {/* Option: Without Table Only */}
                  <button
                    type="button"
                    onClick={() => setExportFilter('without-table')}
                    className={`w-full p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 ${exportFilter === 'without-table'
                      ? 'border-amber-400 bg-amber-500/15 shadow-md'
                      : 'border-[#c9a84c]/20 bg-[#111] hover:border-amber-500/40'
                      }`}
                  >
                    <div className="w-5 h-5 rounded-full border border-amber-400 flex items-center justify-center mt-0.5 shrink-0">
                      {exportFilter === 'without-table' && <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-300">⚠️ Guests Without Table Allocation</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                          {exportWithoutTableCount} Guests
                        </span>
                      </div>
                      <p className="text-[11px] text-[#f5f0e8]/50 mt-0.5">
                        Download only the guests who do not have a table assigned yet.
                      </p>
                    </div>
                  </button>

                  {/* Option: With Table Only */}
                  <button
                    type="button"
                    onClick={() => setExportFilter('with-table')}
                    className={`w-full p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 ${exportFilter === 'with-table'
                      ? 'border-[#c9a84c] bg-[#c9a84c]/15 shadow-md'
                      : 'border-[#c9a84c]/20 bg-[#111] hover:border-[#c9a84c]/40'
                      }`}
                  >
                    <div className="w-5 h-5 rounded-full border border-[#c9a84c] flex items-center justify-center mt-0.5 shrink-0">
                      {exportFilter === 'with-table' && <div className="w-2.5 h-2.5 rounded-full bg-[#c9a84c]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Table-Allocated Guests Only</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c9a84c]/20 text-[#ffe066] font-bold">
                          {exportWithTableCount} Guests
                        </span>
                      </div>
                      <p className="text-[11px] text-[#f5f0e8]/50 mt-0.5">
                        Only guests who have an assigned table number, collated table by table.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Format: Spreadsheet vs Word */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#c9a84c]/70 uppercase tracking-widest ml-1">
                  3. Select File Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat('excel')}
                    className={`p-3 rounded-xl text-left border transition-all flex items-center gap-3 ${exportFormat === 'excel'
                      ? 'border-emerald-500 bg-emerald-500/15 text-white'
                      : 'border-[#c9a84c]/20 bg-[#111] text-[#f5f0e8]/50 hover:border-[#c9a84c]/40'
                      }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Spreadsheet</div>
                      <div className="text-[10px] text-emerald-400 font-medium">Excel (.xlsx)</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('word')}
                    className={`p-3 rounded-xl text-left border transition-all flex items-center gap-3 ${exportFormat === 'word'
                      ? 'border-blue-500 bg-blue-500/15 text-white'
                      : 'border-[#c9a84c]/20 bg-[#111] text-[#f5f0e8]/50 hover:border-[#c9a84c]/40'
                      }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Word Document</div>
                      <div className="text-[10px] text-blue-400 font-medium">Word (.docx)</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Summary Bar */}
              <div className="p-3 bg-[#161616] border border-[#c9a84c]/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-[#f5f0e8]/60">Collation payload:</span>
                <span className="font-bold text-[#ffe066] flex items-center gap-2">
                  <span>{exportCount} Guests</span>
                  <span>·</span>
                  <span>{exportFormat === 'excel' ? 'Spreadsheet (.xlsx)' : 'Word Document (.docx)'}</span>
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExportModalOpen(false)}
                  disabled={exporting}
                  className="flex-1 py-3 card-dark gold-border rounded-xl font-bold text-xs tracking-widest uppercase text-[#f5f0e8]/50 hover:text-[#f5f0e8] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting || exportCount === 0}
                  className="flex-1 py-3 btn-gold rounded-xl font-bold text-xs tracking-widest uppercase disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download File ✦</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TABLE SWITCH & RE-ALLOCATION MODAL ── */}
      {switchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="max-w-4xl w-full max-h-[92vh] overflow-y-auto bg-[#0d0d0d] border border-[#c9a84c]/30 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#c9a84c]/15 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-playfair)' }}>
                    Table Re-allocation Manager
                  </h3>
                </div>
                <p className="text-xs text-[#c9a84c]/60 leading-relaxed">
                  Safely rearrange tables 1 through 30 across 4 closed loops with 1-click execution. Atomic document updates prevent cascading collisions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSwitchModalOpen(false)}
                className="text-[#f5f0e8]/40 hover:text-white p-2 rounded-xl border border-transparent hover:border-[#c9a84c]/20 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scope Selector */}
            <div className="space-y-2 bg-[#141414] border border-[#c9a84c]/15 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-widest text-[#ffe066]">
                  Target Event Section
                </label>
                {switchLoading && (
                  <span className="text-[11px] text-[#c9a84c]/60 flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading preview...</span>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'section1', label: 'Section 1 (Main Event)' },
                  { id: 'section2', label: 'Section 2 (Separate RSVP)' },
                  { id: 'all', label: 'All Sections (Combined)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSwitchSectionScope(s.id as any);
                      fetchSwitchStatus(s.id);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${switchSectionScope === s.id
                      ? 'btn-gold text-[#080808] border-[#c9a84c] shadow-md'
                      : 'bg-[#1a1a1a] text-[#f5f0e8]/60 border-[#c9a84c]/20 hover:text-white hover:border-[#c9a84c]/40'
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Alert */}
            {switchFeedback && (
              <div
                className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 border ${switchFeedback.type === 'success'
                  ? 'bg-green-500/15 border-green-500/30 text-green-300'
                  : 'bg-red-500/15 border-red-500/30 text-red-300'
                  }`}
              >
                <div className="flex items-center gap-2">
                  {switchFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <span>{switchFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSwitchFeedback(null)}
                  className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Confirmation Box (when user clicks a button) */}
            {confirmSwitch && (
              <div className="p-5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 space-y-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <h4 className="font-bold text-sm text-white">
                    Confirm Execution: {confirmSwitch.cycleName}
                  </h4>
                </div>
                <p className="text-xs leading-relaxed text-amber-200/80">
                  This will permanently reassign table numbers for matching guests in{' '}
                  <strong className="text-white">
                    {switchSectionScope === 'section1'
                      ? 'Section 1'
                      : switchSectionScope === 'section2'
                        ? 'Section 2'
                        : 'All Sections'}
                  </strong>
                  . This action works once and is protected against accidental double-execution.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmSwitch(null)}
                    disabled={switchExecuting}
                    className="px-4 py-2 bg-black/40 border border-white/20 rounded-xl text-xs font-semibold text-white/80 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteSwitch(confirmSwitch.cycleId)}
                    disabled={switchExecuting}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-[#ffe066] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    {switchExecuting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm & Switch Now ✦</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* The 1-Click Swap Action Card */}
            {(() => {
              const isSwapped = switchStatusData?.executedCycles?.all;

              return (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1708] via-[#121106] to-[#1a1708] border border-[#c9a84c]/40 space-y-4 relative overflow-hidden shadow-2xl">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#ffe066] font-bold tracking-widest uppercase bg-[#ffe066]/10 px-2.5 py-0.5 rounded-full border border-[#ffe066]/20">
                          Single Atomic Swap
                        </span>
                        <h4 className="text-lg font-bold text-white tracking-wide">
                          Execute 1-Click Table Swap (All 30 Tables)
                        </h4>
                      </div>
                      <p className="text-xs text-[#f5f0e8]/70 leading-relaxed">
                        Swaps all 30 tables simultaneously for guests in{' '}
                        <strong className="text-[#ffe066]">
                          {switchSectionScope === 'section1' ? 'Section 1 (Main Event)' : switchSectionScope === 'section2' ? 'Section 2' : 'All Sections'}
                        </strong>
                        . Uses unique document IDs to prevent any cascading collisions.
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[#c9a84c]/70 pt-1">
                        <span>Total Section Guests: <strong>{switchStatusData?.totalEligibleGuests || 0}</strong></span>
                        <span>·</span>
                        <span>Tables: <strong>1 through 30</strong></span>
                        <span>·</span>
                        <span>Execution: <strong>Works strictly once</strong></span>
                      </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto">
                      {isSwapped ? (
                        <div className="flex items-center justify-center gap-2 px-6 py-3.5 bg-green-500/15 border border-green-500/30 text-green-300 rounded-xl text-xs font-bold">
                          <Lock className="w-4 h-4 text-green-400" />
                          <span>Swapped &amp; Locked ✓</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmSwitch({ cycleId: 'all', cycleName: 'All 30 Tables (Single 1-Click Swap)' })}
                          disabled={switchExecuting}
                          className="w-full md:w-auto px-6 py-3.5 btn-gold rounded-xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] transition-transform"
                        >
                          <Shuffle className="w-4 h-4 text-[#080808]" />
                          <span>Execute 1-Click Swap Now</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {isSwapped && (
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                      <span>
                        Successfully swapped on {new Date(isSwapped.executedAt).toLocaleString()} by {isSwapped.executedBy} ({isSwapped.count} guests updated).
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Complete 30-Table Mapping Preview */}
            <div className="space-y-3 bg-[#121212] border border-[#c9a84c]/20 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#ffe066] uppercase tracking-wider flex items-center gap-2">
                  <span>✦ 30-Table Swap Mapping Preview</span>
                  <span className="text-[10px] font-normal text-[#f5f0e8]/40 lowercase">(simultaneous shift)</span>
                </h4>
                <span className="text-[11px] text-[#c9a84c]/70 font-mono">
                  All 30 Tables
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-1">
                {switchStatusData?.preview?.map((item: any) => (
                  <div
                    key={item.from}
                    className="p-2.5 rounded-xl bg-[#181818] border border-[#c9a84c]/15 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-white">T{item.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#c9a84c]/60" />
                      <span className="font-bold text-[#ffe066]">T{item.to}</span>
                    </div>
                    {item.guestCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#c9a84c]/10 text-[#ffe066] font-mono">
                        {item.guestCount}g
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dedicated Reverse All Safety Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/25 via-[#180d0d] to-red-950/25 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-red-300 uppercase tracking-wider">
                    Emergency Rollback / Reverse All
                  </h4>
                  {Boolean(switchStatusData?.reversibleGuestCount) && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                      {switchStatusData.reversibleGuestCount} guest{switchStatusData.reversibleGuestCount === 1 ? '' : 's'} reversible
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#f5f0e8]/65 leading-relaxed">
                  Every guest's original table assignment is safely backed up. Clicking &quot;Reverse All&quot; immediately restores all guests in{' '}
                  <strong className="text-white">
                    {switchSectionScope === 'section1' ? 'Section 1' : switchSectionScope === 'section2' ? 'Section 2' : 'All Sections'}
                  </strong>{' '}
                  back to their pre-switch tables and resets the lock.
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleRevertSwitch('all')}
                  disabled={switchExecuting || switchStatusData?.reversibleGuestCount === 0}
                  className="w-full sm:w-auto px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${switchExecuting ? 'animate-spin' : ''}`} />
                  <span>Reverse All Swapped Tables</span>
                </button>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSwitchModalOpen(false)}
                className="px-6 py-2.5 card-dark gold-border rounded-xl font-bold text-xs uppercase tracking-widest text-[#f5f0e8]/70 hover:text-white transition-all cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Pass & QR Exporter Modal ── */}
      {bulkPassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="card-dark gold-border rounded-3xl w-full max-w-2xl p-6 md:p-8 space-y-6 relative border-[#c9a84c]/30 shadow-2xl my-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#c9a84c]/20 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/15 border border-[#c9a84c]/30 flex items-center justify-center text-[#ffe066] shadow-md">
                  <FileArchive className="w-6 h-6 text-[#ffe066]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-playfair)' }}>
                    Bulk Download Guest QR Passes
                  </h3>
                  <p className="text-xs text-[#c9a84c]/70">
                    High-resolution VIP cards & QR badges packaged into an organized ZIP archive
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { if (!bulkPassGenerating) setBulkPassModalOpen(false); }}
                disabled={bulkPassGenerating}
                className="text-[#f5f0e8]/40 hover:text-white p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
              >
                ✕
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a84c] uppercase tracking-wider block">
                1. Select Guest Scope
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBulkPassSectionScope('current')}
                  disabled={bulkPassGenerating}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${bulkPassSectionScope === 'current'
                    ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-white shadow-md'
                    : 'bg-[#141414] border-[#c9a84c]/20 text-[#f5f0e8]/60 hover:border-[#c9a84c]/40'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">
                      {activeSection === 'section1' ? 'Section 1 (Main Event)' : 'Section 2 (RSVP)'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c9a84c]/20 text-[#ffe066]">
                      {currentSectionInvites.length} guests
                    </span>
                  </div>
                  <p className="text-[11px] text-[#f5f0e8]/50 mt-1">Current active tab only</p>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkPassSectionScope('all')}
                  disabled={bulkPassGenerating}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${bulkPassSectionScope === 'all'
                    ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-white shadow-md'
                    : 'bg-[#141414] border-[#c9a84c]/20 text-[#f5f0e8]/60 hover:border-[#c9a84c]/40'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">All Sections Combined</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c9a84c]/20 text-[#ffe066]">
                      {invites.length} guests
                    </span>
                  </div>
                  <p className="text-[11px] text-[#f5f0e8]/50 mt-1">Entire event database</p>
                </button>
              </div>
            </div>

            {/* Pass Format Choice */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#c9a84c] uppercase tracking-wider block">
                2. Choose Card / Badge Graphic Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBulkPassFormat('full-pass')}
                  disabled={bulkPassGenerating}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${bulkPassFormat === 'full-pass'
                    ? 'bg-[#c9a84c]/15 border-[#c9a84c] text-white shadow-lg'
                    : 'bg-[#141414] border-[#c9a84c]/20 text-[#f5f0e8]/60 hover:border-[#c9a84c]/40'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-[#ffe066]" />
                    <span className="text-sm font-bold text-white">Luxury VIP Invitation Card</span>
                  </div>
                  <p className="text-xs text-[#f5f0e8]/60 leading-relaxed">
                    600×920px gold portrait card with event title, date, guest name, assigned Table badge, and scannable QR.
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#ffe066] bg-[#ffe066]/10 px-2.5 py-1 rounded-md border border-[#ffe066]/20">
                    ✦ Best for WhatsApp & Direct Sharing
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkPassFormat('square-badge')}
                  disabled={bulkPassGenerating}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${bulkPassFormat === 'square-badge'
                    ? 'bg-[#c9a84c]/15 border-[#c9a84c] text-white shadow-lg'
                    : 'bg-[#141414] border-[#c9a84c]/20 text-[#f5f0e8]/60 hover:border-[#c9a84c]/40'
                    }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <QrCode className="w-4 h-4 text-[#ffe066]" />
                    <span className="text-sm font-bold text-white">Square QR Badge</span>
                  </div>
                  <p className="text-xs text-[#f5f0e8]/60 leading-relaxed">
                    600×600px square badge with decorative gold corners, prominent scannable QR code, name, and table number.
                  </p>
                  <div className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#ffe066] bg-[#ffe066]/10 px-2.5 py-1 rounded-md border border-[#ffe066]/20">
                    ✦ Best for Fast Gate Scanning & Badges
                  </div>
                </button>
              </div>
            </div>

            {/* Organization & Companion Files */}
            <div className="space-y-3 bg-[#111111] p-4 rounded-2xl border border-[#c9a84c]/20">
              <label className="text-xs font-bold text-[#c9a84c] uppercase tracking-wider block">
                3. Archive Organization & Extra Helpers
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkPassOrganizeByTable}
                  onChange={(e) => setBulkPassOrganizeByTable(e.target.checked)}
                  disabled={bulkPassGenerating}
                  className="mt-0.5 rounded border-[#c9a84c]/40 text-[#c9a84c] focus:ring-[#c9a84c]/20 bg-[#181818] w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-white">Organize into Table sub-folders</span>
                  <p className="text-[#f5f0e8]/50 text-[11px] mt-0.5">
                    Creates folders such as <code className="text-[#ffe066]">Table 01/</code>, <code className="text-[#ffe066]">Table 02/</code>, with unassigned guests placed into <code className="text-[#ffe066]">Unassigned/</code>.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkPassIncludeExcel}
                  onChange={(e) => setBulkPassIncludeExcel(e.target.checked)}
                  disabled={bulkPassGenerating}
                  className="mt-0.5 rounded border-[#c9a84c]/40 text-[#c9a84c] focus:ring-[#c9a84c]/20 bg-[#181818] w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-white">Include WhatsApp Share & Distribution Spreadsheet (.xlsx)</span>
                  <p className="text-[#f5f0e8]/50 text-[11px] mt-0.5">
                    Includes <code className="text-[#ffe066]">Pass_Distribution_Index.xlsx</code> with pre-written personalized WhatsApp messages, phone numbers, and direct invite URLs for non-stressful copy-pasting.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkPassIncludeIndex}
                  onChange={(e) => setBulkPassIncludeIndex(e.target.checked)}
                  disabled={bulkPassGenerating}
                  className="mt-0.5 rounded border-[#c9a84c]/40 text-[#c9a84c] focus:ring-[#c9a84c]/20 bg-[#181818] w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-white">Include Plaintext Directory Index (.txt)</span>
                  <p className="text-[#f5f0e8]/50 text-[11px] mt-0.5">
                    Generates <code className="text-[#ffe066]">GUEST_PASS_INDEX.txt</code> for a quick human-readable overview of all passes and tables.
                  </p>
                </div>
              </label>
            </div>

            {/* Generation Progress Bar */}
            {bulkPassProgress && (
              <div className="p-4 rounded-2xl bg-[#141414] border border-[#c9a84c]/30 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#ffe066] font-semibold flex items-center gap-2">
                    {bulkPassGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c9a84c]" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    )}
                    <span>
                      {bulkPassProgress.phase === 'compressing'
                        ? 'Packaging ZIP archive...'
                        : bulkPassProgress.phase === 'done'
                          ? 'Download ready!'
                          : 'Rendering passes...'}
                    </span>
                  </span>
                  <span className="font-mono text-[#c9a84c] font-bold">
                    {bulkPassProgress.percent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#202020] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#c9a84c] to-[#ffe066] transition-all duration-200"
                    style={{ width: `${bulkPassProgress.percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#f5f0e8]/50">
                  <span className="truncate max-w-[280px]">
                    {bulkPassProgress.currentName ? `Card: ${bulkPassProgress.currentName}` : 'Preparing archive...'}
                  </span>
                  <span className="font-mono">
                    {bulkPassProgress.current} / {bulkPassProgress.total}
                  </span>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#c9a84c]/20">
              <a
                href={`/admin/print-passes?section=${bulkPassSectionScope === 'all' ? 'all' : activeSection}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#c9a84c]/30 text-xs font-semibold text-[#ffe066] hover:bg-[#c9a84c]/10 transition-all"
                title="Open a printable contact sheet with all QR passes ready for Ctrl+P / Save as PDF"
              >
                <Printer className="w-4 h-4 text-[#c9a84c]" />
                <span>Printable Contact Sheet (Ctrl+P)</span>
              </a>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setBulkPassModalOpen(false)}
                  disabled={bulkPassGenerating}
                  className="px-4 py-2.5 card-dark gold-border rounded-xl font-bold text-xs uppercase tracking-widest text-[#f5f0e8]/60 hover:text-white transition-all cursor-pointer disabled:opacity-30"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartBulkPassExport}
                  disabled={bulkPassGenerating || (bulkPassSectionScope === 'all' ? invites.length === 0 : currentSectionInvites.length === 0)}
                  className="px-6 py-2.5 btn-gold rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {bulkPassGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#080808]" />
                      <span>Generating ZIP...</span>
                    </>
                  ) : (
                    <>
                      <FileArchive className="w-4 h-4 text-[#080808]" />
                      <span>Download All Passes (.ZIP)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
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
  title, value, icon, color, subtitle, onClick
}: {
  title: string; value: number | string; icon: React.ReactNode; color: 'gold' | 'green' | 'amber' | 'red'; subtitle?: string; onClick?: () => void;
}) {
  const colors = {
    gold: { bg: 'bg-[#c9a84c]/10', border: 'border-[#c9a84c]/25', icon: 'text-[#c9a84c]', val: 'text-[#c9a84c]' },
    green: { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: 'text-green-400', val: 'text-green-400' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400', val: 'text-amber-400' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-400', val: 'text-red-400' },
  };
  const c = colors[color];

  return (
    <div
      onClick={onClick}
      className={`card-dark ${c.border} border rounded-2xl p-5 flex items-center justify-between transition-all ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:border-[#c9a84c]/60' : 'hover:scale-[1.01]'
        }`}
    >
      <div className="space-y-1">
        <p className="text-[#c9a84c]/40 text-[10px] font-bold uppercase tracking-widest">{title}</p>
        <p className={`text-2xl font-black ${c.val}`} style={{ fontFamily: 'var(--font-playfair)' }}>{value}</p>
        {subtitle && <p className="text-[#f5f0e8]/40 text-[10px]">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${c.bg} border ${c.border} flex items-center justify-center ${c.icon}`}>
        {icon}
      </div>
    </div>
  );
}
