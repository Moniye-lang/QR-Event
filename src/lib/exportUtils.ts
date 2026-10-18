import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
} from 'docx';

export interface ExportInvite {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  token: string;
  used: boolean;
  usedAt?: string | null;
  createdAt: string;
  attending?: 'yes' | 'no';
  isAdditionalGuest?: boolean;
  mainGuestName?: string;
  rsvpSubmitted?: boolean;
  maxUses: number;
  section?: string;
  tableNumber?: string;
}

export type ExportFilter = 'all' | 'with-table' | 'without-table';
export type ExportFormat = 'excel' | 'word';

// Helper to trigger browser download
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Natural sort for table numbers (1, 2, 10, VIP, etc.)
export function sortTableNames(a: string, b: string): number {
  const numA = parseInt(a, 10);
  const numB = parseInt(b, 10);
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }
  if (!isNaN(numA)) return -1;
  if (!isNaN(numB)) return 1;
  return a.localeCompare(b);
}

// Format RSVP Status
function formatRsvpStatus(invite: ExportInvite): string {
  if (!invite.rsvpSubmitted) return 'Pending RSVP';
  if (invite.attending === 'no') return 'Declined';
  return 'Confirmed (Attending)';
}

// Format Check-in Status
function formatCheckinStatus(invite: ExportInvite): string {
  if (invite.used) return 'Checked In';
  return 'Not Checked In';
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL EXPORT (.xlsx)
// ─────────────────────────────────────────────────────────────────────────────
export function exportToExcel(
  invites: ExportInvite[],
  filter: ExportFilter,
  sectionLabel: string
) {
  const wb = XLSX.utils.book_new();

  // Filter dataset
  const filtered = invites.filter((inv) => {
    const hasTable = Boolean(inv.tableNumber && inv.tableNumber.trim());
    if (filter === 'with-table') return hasTable;
    if (filter === 'without-table') return !hasTable;
    return true;
  });

  const withTableList = invites.filter((inv) => Boolean(inv.tableNumber && inv.tableNumber.trim()));
  const withoutTableList = invites.filter((inv) => !inv.tableNumber || !inv.tableNumber.trim());

  // 1. If filter is 'without-table', create a focused sheet
  if (filter === 'without-table') {
    const rows = [
      ['GUESTS WITHOUT TABLE ALLOCATION'],
      [`Event Section: ${sectionLabel}`, `Total: ${filtered.length} Guests`, `Generated: ${new Date().toLocaleString()}`],
      [],
      ['S/N', 'Guest Name', 'Phone Number', 'Whose Guest (Host)', 'Extra Guests', 'RSVP Status', 'Attendance / Check-in', 'Section'],
    ];

    filtered.forEach((inv, idx) => {
      rows.push([
        String(idx + 1),
        inv.name,
        inv.phone || 'N/A',
        inv.mainGuestName ? `Guest of ${inv.mainGuestName}` : 'Primary Host',
        inv.maxUses > 1 ? `+${inv.maxUses - 1}` : '0',
        formatRsvpStatus(inv),
        formatCheckinStatus(inv),
        inv.section === 'section2' ? 'Section 2' : 'Section 1',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 18 },
      { wch: 25 },
      { wch: 14 },
      { wch: 22 },
      { wch: 20 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Without Table');
  } else if (filter === 'with-table') {
    // 2. Focused on Table-Allocated Guests (Collated by Table)
    const tableGroups = new Map<string, ExportInvite[]>();
    filtered.forEach((inv) => {
      const tbl = (inv.tableNumber || '').trim();
      if (!tableGroups.has(tbl)) tableGroups.set(tbl, []);
      tableGroups.get(tbl)!.push(inv);
    });

    const sortedTables = Array.from(tableGroups.keys()).sort(sortTableNames);

    const rows: string[][] = [
      ['TABLE ALLOCATION COLLATION'],
      [`Event Section: ${sectionLabel}`, `Total Table Guests: ${filtered.length}`, `Generated: ${new Date().toLocaleString()}`],
      [],
      ['Table', 'S/N', 'Guest Name', 'Phone Number', 'Whose Guest (Host)', 'Extra Guests', 'RSVP Status', 'Attendance', 'Section'],
    ];

    sortedTables.forEach((tbl) => {
      const guests = tableGroups.get(tbl)!;
      guests.forEach((inv, idx) => {
        rows.push([
          `Table ${tbl}`,
          String(idx + 1),
          inv.name,
          inv.phone || 'N/A',
          inv.mainGuestName ? `Guest of ${inv.mainGuestName}` : 'Primary Host',
          inv.maxUses > 1 ? `+${inv.maxUses - 1}` : '0',
          formatRsvpStatus(inv),
          formatCheckinStatus(inv),
          inv.section === 'section2' ? 'Section 2' : 'Section 1',
        ]);
      });
      // Blank separator row
      rows.push([]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 6 },
      { wch: 28 },
      { wch: 18 },
      { wch: 25 },
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Table Collation');
  } else {
    // 3. 'all' -> Multi-sheet workbook:
    // Sheet 1: Collation by Table
    // Sheet 2: Unassigned / Without Table
    // Sheet 3: Master Alphabetical List

    // --- Sheet 1: Collation by Table ---
    const tableGroups = new Map<string, ExportInvite[]>();
    withTableList.forEach((inv) => {
      const tbl = (inv.tableNumber || '').trim();
      if (!tableGroups.has(tbl)) tableGroups.set(tbl, []);
      tableGroups.get(tbl)!.push(inv);
    });
    const sortedTables = Array.from(tableGroups.keys()).sort(sortTableNames);

    const sheet1Rows: string[][] = [
      ['TABLE ALLOCATION COLLATION'],
      [
        `Event Section: ${sectionLabel}`,
        `Total With Table: ${withTableList.length}`,
        `Without Table: ${withoutTableList.length}`,
        `Generated: ${new Date().toLocaleString()}`,
      ],
      [],
      ['Table', 'S/N', 'Guest Name', 'Phone Number', 'Whose Guest', 'Extra Guests', 'RSVP Status', 'Attendance', 'Section'],
    ];

    sortedTables.forEach((tbl) => {
      const guests = tableGroups.get(tbl)!;
      guests.forEach((inv, idx) => {
        sheet1Rows.push([
          `Table ${tbl}`,
          String(idx + 1),
          inv.name,
          inv.phone || 'N/A',
          inv.mainGuestName ? `Guest of ${inv.mainGuestName}` : 'Primary Host',
          inv.maxUses > 1 ? `+${inv.maxUses - 1}` : '0',
          formatRsvpStatus(inv),
          formatCheckinStatus(inv),
          inv.section === 'section2' ? 'Section 2' : 'Section 1',
        ]);
      });
      sheet1Rows.push([]);
    });

    const ws1 = XLSX.utils.aoa_to_sheet(sheet1Rows);
    ws1['!cols'] = [
      { wch: 14 },
      { wch: 6 },
      { wch: 28 },
      { wch: 18 },
      { wch: 25 },
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Table Collation');

    // --- Sheet 2: Without Table (Unassigned) ---
    const sheet2Rows: string[][] = [
      ['GUESTS WITHOUT TABLE ALLOCATION (UNASSIGNED)'],
      [`Event Section: ${sectionLabel}`, `Total Unassigned: ${withoutTableList.length}`, `Generated: ${new Date().toLocaleString()}`],
      [],
      ['S/N', 'Guest Name', 'Phone Number', 'Whose Guest', 'Extra Guests', 'RSVP Status', 'Attendance', 'Section'],
    ];

    withoutTableList.forEach((inv, idx) => {
      sheet2Rows.push([
        String(idx + 1),
        inv.name,
        inv.phone || 'N/A',
        inv.mainGuestName ? `Guest of ${inv.mainGuestName}` : 'Primary Host',
        inv.maxUses > 1 ? `+${inv.maxUses - 1}` : '0',
        formatRsvpStatus(inv),
        formatCheckinStatus(inv),
        inv.section === 'section2' ? 'Section 2' : 'Section 1',
      ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(sheet2Rows);
    ws2['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 18 },
      { wch: 25 },
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Without Table');

    // --- Sheet 3: Master List ---
    const sheet3Rows: string[][] = [
      ['MASTER GUEST LIST (ALL GUESTS)'],
      [`Event Section: ${sectionLabel}`, `Total Guests: ${invites.length}`, `Generated: ${new Date().toLocaleString()}`],
      [],
      ['S/N', 'Guest Name', 'Table Number', 'Phone Number', 'Whose Guest', 'Extra Guests', 'RSVP Status', 'Attendance', 'Section'],
    ];

    invites.forEach((inv, idx) => {
      sheet3Rows.push([
        String(idx + 1),
        inv.name,
        inv.tableNumber ? `Table ${inv.tableNumber}` : 'No Table Assigned',
        inv.phone || 'N/A',
        inv.mainGuestName ? `Guest of ${inv.mainGuestName}` : 'Primary Host',
        inv.maxUses > 1 ? `+${inv.maxUses - 1}` : '0',
        formatRsvpStatus(inv),
        formatCheckinStatus(inv),
        inv.section === 'section2' ? 'Section 2' : 'Section 1',
      ]);
    });

    const ws3 = XLSX.utils.aoa_to_sheet(sheet3Rows);
    ws3['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 18 },
      { wch: 18 },
      { wch: 25 },
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws3, 'Master List');
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const safeSection = sectionLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${filter === 'without-table' ? 'Guests_Without_Table' : 'Table_Allocation_Collation'}_${safeSection}.xlsx`;
  triggerDownload(blob, filename);
}

// ─────────────────────────────────────────────────────────────────────────────
// WORD DOCUMENT EXPORT (.docx)
// ─────────────────────────────────────────────────────────────────────────────
export async function exportToWord(
  invites: ExportInvite[],
  filter: ExportFilter,
  sectionLabel: string
) {
  const withTableList = invites.filter((inv) => Boolean(inv.tableNumber && inv.tableNumber.trim()));
  const withoutTableList = invites.filter((inv) => !inv.tableNumber || !inv.tableNumber.trim());

  const docChildren: (Paragraph | Table)[] = [];

  // Elegant Document Header
  docChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 100 },
      children: [
        new TextRun({
          text: '50TH BIRTHDAY CELEBRATION',
          bold: true,
          size: 32, // 16pt
          color: 'C9A84C', // Gold
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [
        new TextRun({
          text:
            filter === 'without-table'
              ? 'GUESTS WITHOUT TABLE ALLOCATION'
              : filter === 'with-table'
              ? 'TABLE ALLOCATION COLLATION'
              : 'GUEST & TABLE ALLOCATION REPORT',
          bold: true,
          size: 26,
          color: '1A1A1A',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 300 },
      children: [
        new TextRun({
          text: `Section: ${sectionLabel}   |   Total Guests: ${invites.length}   |   With Table: ${withTableList.length}   |   Without Table: ${withoutTableList.length}`,
          italics: true,
          size: 18,
          color: '666666',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 400 },
      children: [
        new TextRun({
          text: `Generated on: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at ${new Date().toLocaleTimeString()}`,
          size: 16,
          color: '888888',
        }),
      ],
    })
  );

  // Helper for creating stylized table cells
  const makeCell = (
    text: string,
    isHeader = false,
    widthPercent = 20,
    textColor = '000000',
    bgColor?: string
  ) => {
    return new TableCell({
      width: { size: widthPercent, type: WidthType.PERCENTAGE },
      shading: bgColor
        ? { type: ShadingType.CLEAR, fill: bgColor }
        : isHeader
        ? { type: ShadingType.CLEAR, fill: 'F4EBD0' } // Soft gold header fill
        : undefined,
      children: [
        new Paragraph({
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({
              text,
              bold: isHeader,
              size: isHeader ? 18 : 17,
              color: isHeader ? '7A5E10' : textColor,
              font: 'Calibri',
            }),
          ],
        }),
      ],
    });
  };

  // 1. Table Allocation section (if filter is 'all' or 'with-table')
  if (filter === 'all' || filter === 'with-table') {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        children: [
          new TextRun({
            text: `✦ Table Allocation Collation (${withTableList.length} Guests Allocated)`,
            bold: true,
            size: 24,
            color: 'A17C24',
          }),
        ],
      })
    );

    const tableGroups = new Map<string, ExportInvite[]>();
    withTableList.forEach((inv) => {
      const tbl = (inv.tableNumber || '').trim();
      if (!tableGroups.has(tbl)) tableGroups.set(tbl, []);
      tableGroups.get(tbl)!.push(inv);
    });

    const sortedTables = Array.from(tableGroups.keys()).sort(sortTableNames);

    if (sortedTables.length === 0) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [
            new TextRun({
              text: 'No guests have been assigned to tables yet.',
              italics: true,
              color: '888888',
            }),
          ],
        })
      );
    } else {
      sortedTables.forEach((tbl) => {
        const guests = tableGroups.get(tbl)!;

        // Table sub-header
        docChildren.push(
          new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({
                text: `🍽️ Table ${tbl} `,
                bold: true,
                size: 20,
                color: '222222',
              }),
              new TextRun({
                text: `(${guests.length} guest${guests.length === 1 ? '' : 's'})`,
                size: 18,
                color: '666666',
              }),
            ],
          })
        );

        // Word Table for this table
        const tableRows: TableRow[] = [
          new TableRow({
            children: [
              makeCell('S/N', true, 8),
              makeCell('Guest Name', true, 27),
              makeCell('Phone', true, 18),
              makeCell('Whose Guest (Host)', true, 22),
              makeCell('RSVP', true, 13),
              makeCell('Status', true, 12),
            ],
          }),
        ];

        guests.forEach((inv, idx) => {
          tableRows.push(
            new TableRow({
              children: [
                makeCell(String(idx + 1), false, 8),
                makeCell(inv.name, false, 27, '111111'),
                makeCell(inv.phone || '—', false, 18, '555555'),
                makeCell(inv.mainGuestName ? `Guest of ${inv.mainGuestName}` : 'Primary Host', false, 22, '444444'),
                makeCell(formatRsvpStatus(inv), false, 13, inv.attending === 'yes' ? '2E7D32' : '777777'),
                makeCell(formatCheckinStatus(inv), false, 12, inv.used ? '1565C0' : '888888'),
              ],
            })
          );
        });

        docChildren.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          })
        );
      });
    }
  }

  // 2. Without Table section (if filter is 'all' or 'without-table')
  if (filter === 'all' || filter === 'without-table') {
    docChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 150 },
        children: [
          new TextRun({
            text: `⚠️ Guests Without Table Allocation (${withoutTableList.length} Guests Unassigned)`,
            bold: true,
            size: 24,
            color: 'C67D0A',
          }),
        ],
      })
    );

    if (withoutTableList.length === 0) {
      docChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 200 },
          children: [
            new TextRun({
              text: 'All guests have been allocated a table. None are unassigned!',
              italics: true,
              color: '2E7D32',
            }),
          ],
        })
      );
    } else {
      const tableRows: TableRow[] = [
        new TableRow({
          children: [
            makeCell('S/N', true, 8, '7A5E10', 'FFF3CD'),
            makeCell('Guest Name', true, 27, '7A5E10', 'FFF3CD'),
            makeCell('Phone', true, 18, '7A5E10', 'FFF3CD'),
            makeCell('Whose Guest (Host)', true, 22, '7A5E10', 'FFF3CD'),
            makeCell('RSVP Status', true, 13, '7A5E10', 'FFF3CD'),
            makeCell('Attendance', true, 12, '7A5E10', 'FFF3CD'),
          ],
        }),
      ];

      withoutTableList.forEach((inv, idx) => {
        tableRows.push(
          new TableRow({
            children: [
              makeCell(String(idx + 1), false, 8),
              makeCell(inv.name, false, 27, '111111'),
              makeCell(inv.phone || '—', false, 18, '555555'),
              makeCell(inv.mainGuestName ? `Guest of ${inv.mainGuestName}` : 'Primary Host', false, 22, '444444'),
              makeCell(formatRsvpStatus(inv), false, 13, inv.attending === 'yes' ? '2E7D32' : '777777'),
              makeCell(formatCheckinStatus(inv), false, 12, inv.used ? '1565C0' : '888888'),
            ],
          })
        );
      });

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: tableRows,
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeSection = sectionLabel.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${filter === 'without-table' ? 'Guests_Without_Table' : 'Table_Allocation_Collation'}_${safeSection}.docx`;
  triggerDownload(blob, filename);
}
