// Exact 30-Table Permutation Mapping
export const TABLE_SWITCH_MAPPING: Record<string, string> = {
  '1': '13',
  '2': '19',
  '3': '14',
  '4': '20',
  '5': '15',
  '6': '21',
  '7': '24',
  '8': '7',
  '9': '29',
  '10': '8',
  '11': '17',
  '12': '4',
  '13': '18',
  '14': '6',
  '15': '16',
  '16': '12',
  '17': '1',
  '18': '11',
  '19': '2',
  '20': '3',
  '21': '25',
  '22': '30',
  '23': '27',
  '24': '28',
  '25': '9',
  '26': '10',
  '27': '26',
  '28': '23',
  '29': '22',
  '30': '5',
};

export interface TableCycle {
  id: 'cycle1' | 'cycle2' | 'cycle3' | 'cycle4';
  name: string;
  count: number;
  tables: string[];
  description: string;
  pairs: Array<{ from: string; to: string }>;
}

export const TABLE_CYCLES: TableCycle[] = [
  {
    id: 'cycle1',
    name: 'Cycle 1 (5 Tables)',
    count: 5,
    tables: ['1', '13', '18', '11', '17'],
    description: '1 → 13 → 18 → 11 → 17 → 1',
    pairs: [
      { from: '1', to: '13' },
      { from: '13', to: '18' },
      { from: '18', to: '11' },
      { from: '11', to: '17' },
      { from: '17', to: '1' },
    ],
  },
  {
    id: 'cycle2',
    name: 'Cycle 2 (2 Tables - Direct Swap)',
    count: 2,
    tables: ['2', '19'],
    description: 'Table 2 ⇄ Table 19',
    pairs: [
      { from: '2', to: '19' },
      { from: '19', to: '2' },
    ],
  },
  {
    id: 'cycle3',
    name: 'Cycle 3 (15 Tables)',
    count: 15,
    tables: ['3', '14', '6', '21', '25', '9', '29', '22', '30', '5', '15', '16', '12', '4', '20'],
    description: '3 → 14 → 6 → 21 → 25 → 9 → 29 → 22 → 30 → 5 → 15 → 16 → 12 → 4 → 20 → 3',
    pairs: [
      { from: '3', to: '14' },
      { from: '14', to: '6' },
      { from: '6', to: '21' },
      { from: '21', to: '25' },
      { from: '25', to: '9' },
      { from: '9', to: '29' },
      { from: '29', to: '22' },
      { from: '22', to: '30' },
      { from: '30', to: '5' },
      { from: '5', to: '15' },
      { from: '15', to: '16' },
      { from: '16', to: '12' },
      { from: '12', to: '4' },
      { from: '4', to: '20' },
      { from: '20', to: '3' },
    ],
  },
  {
    id: 'cycle4',
    name: 'Cycle 4 (8 Tables)',
    count: 8,
    tables: ['7', '24', '28', '23', '27', '26', '10', '8'],
    description: '7 → 24 → 28 → 23 → 27 → 26 → 10 → 8 → 7',
    pairs: [
      { from: '7', to: '24' },
      { from: '24', to: '28' },
      { from: '28', to: '23' },
      { from: '23', to: '27' },
      { from: '27', to: '26' },
      { from: '26', to: '10' },
      { from: '10', to: '8' },
      { from: '8', to: '7' },
    ],
  },
];

/**
 * Normalizes any stored table string or number to a bare key (e.g. "5", "Table 5", "5 " -> "5")
 */
export function extractTableKey(raw?: string | number | null): string | null {
  if (raw == null) return null;
  const str = String(raw).trim();
  if (!str) return null;

  // Clean prefixes like "Table ", "table ", "T-", "#"
  const clean = str.replace(/^table\s*[:#.-]?\s*/i, '').replace(/^#\s*/i, '').trim();
  if (clean && TABLE_SWITCH_MAPPING[clean]) {
    return clean;
  }
  return null;
}

