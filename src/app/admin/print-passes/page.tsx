'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';

interface Invite {
  _id: string;
  name: string;
  phone?: string;
  token: string;
  tableNumber?: string;
  mainGuestName?: string;
  isAdditionalGuest?: boolean;
  section?: string;
}

// Natural table sorter (Table 1, 2, 10, VIP, etc.)
function naturalTableSort(a: Invite, b: Invite): number {
  const tblA = (a.tableNumber || '').trim();
  const tblB = (b.tableNumber || '').trim();

  if (tblA && !tblB) return -1;
  if (!tblA && tblB) return 1;

  const numA = parseInt(tblA.replace(/\D/g, ''), 10);
  const numB = parseInt(tblB.replace(/\D/g, ''), 10);

  if (!isNaN(numA) && !isNaN(numB)) {
    if (numA !== numB) return numA - numB;
  }
  return a.name.localeCompare(b.name);
}

function PrintPassesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSection = searchParams.get('section') || 'section1';

  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'section1' | 'section2' | 'all'>(
    initialSection as any
  );
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const [layoutMode, setLayoutMode] = useState<'compact' | 'standard'>('compact');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchInvites(token);
  }, []);

  const fetchInvites = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/invite', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInvites(data.invites);
      }
    } catch (err) {
      console.error('Failed to load invites:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & sort
  const filteredInvites = useMemo(() => {
    return invites
      .filter((i) => {
        if (activeSection === 'all') return true;
        const s = i.section || 'section1';
        return s === activeSection;
      })
      .sort(naturalTableSort);
  }, [invites, activeSection]);

  // Generate QR codes for all visible invites
  useEffect(() => {
    if (filteredInvites.length === 0) return;

    let isMounted = true;
    const generateAllQrs = async () => {
      const urls: Record<string, string> = {};
      for (const inv of filteredInvites) {
        try {
          urls[inv.token] = await QRCode.toDataURL(inv.token, {
            width: 300,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' },
          });
        } catch (e) {
          console.error(e);
        }
      }
      if (isMounted) setQrUrls(urls);
    };

    generateAllQrs();
    return () => {
      isMounted = false;
    };
  }, [filteredInvites]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin mx-auto" />
          <p className="text-sm text-[#c9a84c]/60 uppercase tracking-widest">
            Preparing Printable Pass Sheets...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-black print:bg-white print:text-black">
      {/* ── NON-PRINT FLOATING CONTROLS ── */}
      <div className="print:hidden sticky top-0 z-50 bg-[#121212]/95 border-b border-[#c9a84c]/20 backdrop-blur-md px-6 py-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-3.5 py-2 card-dark gold-border rounded-xl text-xs font-semibold text-[#f5f0e8]/70 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#ffe066]" />
                <span>Printable QR Pass Contact Sheet</span>
              </h1>
              <p className="text-[11px] text-[#c9a84c]/50">
                {filteredInvites.length} Guests Ready to Print or Save as PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            {/* Section tabs */}
            <div className="flex items-center gap-1 bg-black/40 border border-[#c9a84c]/20 p-1 rounded-xl">
              <button
                onClick={() => setActiveSection('section1')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeSection === 'section1' ? 'btn-gold text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                Section 1
              </button>
              <button
                onClick={() => setActiveSection('section2')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeSection === 'section2' ? 'btn-gold text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                Section 2
              </button>
              <button
                onClick={() => setActiveSection('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeSection === 'all' ? 'btn-gold text-black' : 'text-white/60 hover:text-white'
                }`}
              >
                All
              </button>
            </div>

            {/* Layout Mode */}
            <div className="flex items-center gap-1 bg-black/40 border border-[#c9a84c]/20 p-1 rounded-xl">
              <button
                onClick={() => setLayoutMode('compact')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                  layoutMode === 'compact' ? 'bg-[#c9a84c]/20 text-[#ffe066]' : 'text-white/50'
                }`}
                title="6 passes per page"
              >
                6 Per Page
              </button>
              <button
                onClick={() => setLayoutMode('standard')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                  layoutMode === 'standard' ? 'bg-[#c9a84c]/20 text-[#ffe066]' : 'text-white/50'
                }`}
                title="4 passes per page"
              >
                4 Per Page
              </button>
            </div>

            {/* Print trigger */}
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 btn-gold text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-2 cursor-pointer hover:scale-105 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF (Ctrl+P)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── PRINTABLE SHEET GRID ── */}
      <main className="max-w-6xl mx-auto p-4 md:p-8 print:p-0">
        <div
          className={`grid gap-4 print:gap-3 ${
            layoutMode === 'compact'
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3'
              : 'grid-cols-1 sm:grid-cols-2 print:grid-cols-2'
          }`}
        >
          {filteredInvites.map((inv, idx) => {
            const rawTable = (inv.tableNumber || '').trim();
            const tableLabel = rawTable
              ? /^table\s+/i.test(rawTable)
                ? rawTable.toUpperCase()
                : `TABLE ${rawTable.toUpperCase()}`
              : 'UNASSIGNED';

            const qrUrl = qrUrls[inv.token];

            return (
              <div
                key={inv._id || inv.token}
                className="bg-white border-2 border-black/80 rounded-2xl p-4 flex flex-col justify-between text-black break-inside-avoid shadow-sm print:shadow-none print:border-black print:rounded-xl"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
              >
                {/* Header */}
                <div className="border-b border-black/15 pb-2 mb-2 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-bold tracking-widest uppercase text-black/60 block">
                      Felix's 50th Birthday Pass
                    </span>
                    <h3 className="text-base font-black leading-tight truncate" title={inv.name}>
                      {inv.name}
                    </h3>
                    {inv.mainGuestName && (
                      <p className="text-[10px] text-black/60 font-semibold">
                        Guest of {inv.mainGuestName}
                      </p>
                    )}
                  </div>
                  <span className="px-2.5 py-1 bg-black text-white font-mono font-bold text-[11px] rounded-lg tracking-wider shrink-0">
                    {tableLabel}
                  </span>
                </div>

                {/* QR Code Center */}
                <div className="flex flex-col items-center justify-center my-1">
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt={`QR for ${inv.name}`}
                      className="w-40 h-40 object-contain border border-black/10 rounded-lg p-1"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center bg-gray-100 rounded-lg">
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    </div>
                  )}
                  <span className="text-[9px] font-mono text-black/50 mt-1 uppercase">
                    Token: {inv.token.slice(0, 8)}...
                  </span>
                </div>

                {/* Footer details */}
                <div className="border-t border-black/15 pt-2 mt-2 text-[9px] text-black/70 flex items-center justify-between">
                  <span>Sat, Nov 28, 2026 · 1:00 PM</span>
                  <span className="font-bold">Strict 1-Time Entry</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Print styling overrides */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          @page {
            margin: 0.5in;
            size: A4 portrait;
          }
        }
      `}</style>
    </div>
  );
}

export default function PrintPassesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#080808]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full border border-[#c9a84c]/40 flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-8 h-8 text-[#c9a84c] animate-spin" />
            </div>
            <p className="text-[#c9a84c]/60 text-xs tracking-widest uppercase">
              Loading passes...
            </p>
          </div>
        </div>
      }
    >
      <PrintPassesContent />
    </Suspense>
  );
}
