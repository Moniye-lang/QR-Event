import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { generatePassCanvas, generateCleanQrBadgeCanvas, PassData } from '@/lib/passGenerator';

export interface BulkExportInvite {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  token: string;
  tableNumber?: string;
  mainGuestName?: string;
  isAdditionalGuest?: boolean;
  section?: string;
}

export interface BulkExportOptions {
  format: 'full-pass' | 'square-badge';
  organizeByTable: boolean;
  includeIndexTxt: boolean;
  includeSpreadsheet: boolean;
  sectionLabel?: string;
  baseUrl?: string;
}

export interface ExportProgress {
  current: number;
  total: number;
  currentName: string;
  phase: 'rendering' | 'compressing' | 'done';
  percent: number;
}

// Sanitize filename to avoid OS invalid characters
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 60);
}

// Natural table sorter (1, 2, 10, VIP, etc.)
function naturalTableSort(a: BulkExportInvite, b: BulkExportInvite): number {
  const tblA = (a.tableNumber || '').trim();
  const tblB = (b.tableNumber || '').trim();

  if (tblA && !tblB) return -1;
  if (!tblA && tblB) return 1;

  const numA = parseInt(tblA.replace(/\D/g, ''), 10);
  const numB = parseInt(tblB.replace(/\D/g, ''), 10);

  if (!isNaN(numA) && !isNaN(numB)) {
    if (numA !== numB) return numA - numB;
  }

  // Fallback to guest name alphabetical
  return a.name.localeCompare(b.name);
}

/**
 * Generates and downloads a ZIP archive containing all guests' QR codes / Passes.
 */
export async function exportBulkPassesZip(
  invites: BulkExportInvite[],
  options: BulkExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  if (invites.length === 0) {
    throw new Error('No guests to export.');
  }

  const zip = new JSZip();
  const sortedInvites = [...invites].sort(naturalTableSort);
  const total = sortedInvites.length;
  const baseUrl = options.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://felix50th.com');

  const indexRows: string[][] = [
    ['S/N', 'Guest Name', 'Table Number', 'Phone Number', 'Pass File Name', 'Pass Online Link', 'WhatsApp Ready Message'],
  ];

  const textIndexLines: string[] = [
    '================================================================================',
    "FELIX'S 50TH BIRTHDAY - OFFICIAL VIP GUEST PASS DIRECTORY",
    `Event Section: ${options.sectionLabel || 'Section 1'}`,
    `Generated: ${new Date().toLocaleString()}`,
    `Total Guests: ${total}`,
    '================================================================================',
    '',
    'S/N | Table | Guest Name | Token | Pass File | Direct Link',
    '--------------------------------------------------------------------------------',
  ];

  // Keep track of used filenames to avoid collisions
  const usedFileNames = new Set<string>();

  // 1. Render all pass images sequentially/in controlled batches
  for (let i = 0; i < total; i++) {
    const inv = sortedInvites[i];
    const passData: PassData = {
      name: inv.name,
      token: inv.token,
      isAdditionalGuest: inv.isAdditionalGuest,
      mainGuestName: inv.mainGuestName,
      tableNumber: inv.tableNumber,
    };

    onProgress?.({
      current: i + 1,
      total,
      currentName: inv.name,
      phase: 'rendering',
      percent: Math.round(((i + 1) / total) * 75), // 0 to 75% for rendering
    });

    // Generate canvas
    const canvas =
      options.format === 'full-pass'
        ? await generatePassCanvas(passData)
        : await generateCleanQrBadgeCanvas(passData);

    const imageBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png', 0.95)
    );

    if (!imageBlob) {
      console.warn(`Failed to render image for guest: ${inv.name}`);
      continue;
    }

    // Determine clean file name
    const rawTable = (inv.tableNumber || '').trim();
    const tablePrefix = rawTable
      ? `Table_${rawTable.replace(/\D/g, '').padStart(2, '0') || rawTable}_`
      : 'NoTable_';

    const safeGuestName = sanitizeFileName(inv.name);
    let fileName = `${tablePrefix}${safeGuestName}.png`;

    // Ensure unique file name if duplicates exist
    if (usedFileNames.has(fileName)) {
      fileName = `${tablePrefix}${safeGuestName}_${inv.token.slice(0, 4)}.png`;
    }
    usedFileNames.add(fileName);

    // Determine target folder inside ZIP
    let targetFolder = zip;
    let fullFilePath = fileName;
    if (options.organizeByTable) {
      const folderName = rawTable
        ? `Table ${rawTable.replace(/^table\s+/i, '')}`
        : 'Guests Without Table';
      targetFolder = zip.folder(folderName) || zip;
      fullFilePath = `${folderName}/${fileName}`;
    }

    // Add image blob to zip
    targetFolder.file(fileName, imageBlob);

    // Build directory records
    const inviteUrl = `${baseUrl}/invite/${inv.token}`;
    const tableDisplay = rawTable ? `Table ${rawTable.replace(/^table\s+/i, '')}` : 'Unassigned';
    const whatsAppMsg = `Dear ${inv.name}, here is your official VIP entry pass for Felix's 50th Birthday: ${inviteUrl}. Your assigned seating is ${tableDisplay}. Kindly present this QR pass at the entrance gate.`;

    indexRows.push([
      String(i + 1),
      inv.name,
      tableDisplay,
      inv.phone || 'N/A',
      fullFilePath,
      inviteUrl,
      whatsAppMsg,
    ]);

    textIndexLines.push(
      `${String(i + 1).padStart(3, '0')} | ${tableDisplay.padEnd(10, ' ')} | ${inv.name.padEnd(25, ' ')} | ${inv.token.slice(0, 8)} | ${fullFilePath} | ${inviteUrl}`
    );
  }

  // 2. Add text index file
  if (options.includeIndexTxt) {
    textIndexLines.push('');
    textIndexLines.push('================================================================================');
    textIndexLines.push('Sharing Tip: You can send each pass directly via WhatsApp or copy the online link.');
    textIndexLines.push('Strict Entry: Each QR code is cryptographically unique and burns upon entry scan.');
    textIndexLines.push('================================================================================');
    zip.file('GUEST_PASS_INDEX.txt', textIndexLines.join('\n'));
  }

  // 3. Add Excel distribution workbook
  if (options.includeSpreadsheet) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(indexRows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 16 },
      { wch: 18 },
      { wch: 35 },
      { wch: 45 },
      { wch: 60 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Pass Distribution Index');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    zip.file('Pass_Distribution_Index.xlsx', wbout);
  }

  // 4. Compress and build ZIP
  onProgress?.({
    current: total,
    total,
    currentName: 'Compressing archive...',
    phase: 'compressing',
    percent: 85,
  });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      const compPercent = 75 + Math.round((metadata.percent / 100) * 25);
      onProgress?.({
        current: total,
        total,
        currentName: `Compressing package... ${Math.round(metadata.percent)}%`,
        phase: 'compressing',
        percent: Math.min(99, compPercent),
      });
    }
  );

  onProgress?.({
    current: total,
    total,
    currentName: 'Download Ready!',
    phase: 'done',
    percent: 100,
  });

  // 5. Trigger download in browser
  const safeSection = (options.sectionLabel || 'Section1').replace(/[^a-zA-Z0-9]/g, '_');
  const zipFileName = `Felix_50th_QR_Passes_${safeSection}.zip`;

  if (typeof window !== 'undefined') {
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = zipFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  }

  return zipBlob;
}
