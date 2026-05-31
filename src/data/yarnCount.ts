export interface YarnCountEntry { count: string; gps: number | null; }
export interface DoublingRate   { count: string; rate: number; }
export interface YarnCountCategory { name: string; entries: YarnCountEntry[]; }
export interface YarnCountGroup    { name: string; subCategories: YarnCountCategory[]; }

export function production(e: YarnCountEntry): number | null {
  return e.gps != null ? e.gps * 3 / 1000 * 1632 : null;
}
export function productionRounded(e: YarnCountEntry): number | null {
  const p = production(e); return p != null ? Math.round(p) : null;
}

export const DOUBLING_WASTE_PERCENT = 0.5;
export const DOUBLING_TRANSPORT     = 2.0;
export const TFO_DOUBLING           = 0.70;

export const DOUBLING_RATES: DoublingRate[] = [
  { count: '16', rate: 11 }, { count: '20', rate: 14 }, { count: '21', rate: 15 },
  { count: '24', rate: 17 }, { count: '30', rate: 21 }, { count: '32', rate: 22 },
  { count: '34', rate: 24 }, { count: '40', rate: 28 }, { count: '42', rate: 29 },
  { count: '45', rate: 32 },
];

export const YARN_COUNT_GROUPS: YarnCountGroup[] = [
  {
    name: 'Viscose',
    subCategories: [
      { name: 'Normal', entries: [
        { count: '16s', gps: 500 }, { count: '20s', gps: 373 }, { count: '21s', gps: 347 },
        { count: '24s', gps: 300 }, { count: '27s', gps: null }, { count: '30s', gps: 230 },
        { count: '32s', gps: 210 }, { count: '34s', gps: 196 }, { count: '40s', gps: 150 },
        { count: '42s', gps: 141 }, { count: '45s', gps: 127 }, { count: '50s', gps: 100 },
      ]},
      { name: 'High Twist', entries: [
        { count: 'HT 16 (TPI 20)', gps: 324 }, { count: 'HT 20s (TPI 24)', gps: 212 },
        { count: 'HT 24s (TPI 28)', gps: 170 }, { count: 'HT 24s (TPI 32)', gps: 148 },
        { count: 'HT 30s (TPI 32)', gps: 135 }, { count: 'HT 30s (TPI 36)', gps: 117 },
        { count: 'HT 30s (TPI 40)', gps: 95 },  { count: 'HT 31s', gps: 128 },
        { count: 'HT 32s', gps: 122 },           { count: 'HT 40s (TPI 40)', gps: 78 },
        { count: 'HT 40s (TPI 35)', gps: 87 },   { count: 'HT 40s (TPI 32)', gps: 100 },
        { count: 'HT 40s (TPI 30)', gps: 106 },
      ]},
      { name: 'Slub', entries: [
        { count: '15s (Special)', gps: 294 }, { count: '16s', gps: 425 },
        { count: '20s', gps: 335 }, { count: '21s', gps: 327 }, { count: '24s', gps: 265 },
        { count: '30s', gps: 195 }, { count: '32s', gps: 188 }, { count: '34s', gps: 172 },
        { count: '40s', gps: 134 },
      ]},
      { name: 'High Twist Slub', entries: [{ count: '24s', gps: 164 }] },
      { name: 'Micro Viscose',   entries: [{ count: '60s', gps: 67  }] },
      { name: 'Doubling',        entries: [] },
    ],
  },
  {
    name: 'Excel',
    subCategories: [
      { name: 'Normal', entries: [
        { count: '20s', gps: 334 }, { count: '21s', gps: 315 }, { count: '30s', gps: 195 },
        { count: '32s', gps: 180 }, { count: '34s', gps: 175 }, { count: '40s', gps: 130 },
        { count: '42s', gps: 121 }, { count: '45s', gps: 105 }, { count: '50s', gps: 88 },
        { count: '60s', gps: 64 },  { count: '80s', gps: 38 },
      ]},
      { name: 'Micro Excel', entries: [{ count: '100s', gps: 24.8 }] },
    ],
  },
  {
    name: 'Eco Vero',
    subCategories: [
      { name: 'Normal', entries: [
        { count: '16s', gps: 500 }, { count: '20s', gps: 373 }, { count: '21s', gps: 347 },
        { count: '24s', gps: 300 }, { count: '30s', gps: 230 }, { count: '32s', gps: 210 },
        { count: '34s', gps: 196 }, { count: '40s', gps: 150 }, { count: '42s', gps: 141 },
        { count: '45s', gps: 127 }, { count: '60s', gps: 60 },
      ]},
      { name: 'High Twist', entries: [
        { count: 'HT 16 (TPI 20)', gps: 324 }, { count: 'HT 20s (TPI 24)', gps: 212 },
        { count: 'HT 30s (TPI 32)', gps: 135 }, { count: 'HT 30s (TPI 36)', gps: 117 },
        { count: 'HT 31s (TPI 32)', gps: 128 }, { count: 'HT 32s (TPI 32)', gps: 122 },
        { count: 'HT 40s (TPI 40)', gps: 78 },  { count: 'HT 40s (TPI 35)', gps: 87 },
        { count: 'HT 40s (TPI 32)', gps: 100 }, { count: 'HT 40s (TPI 30)', gps: 106 },
      ]},
    ],
  },
];

export const STANDALONE_CATEGORIES: YarnCountCategory[] = [
  { name: 'Micro Modal', entries: [
    { count: '20s', gps: 324 }, { count: '21s', gps: 302 }, { count: '30s', gps: 198 },
    { count: '32s', gps: 180 }, { count: '34s', gps: 175 }, { count: '40s', gps: 128 },
    { count: '42s', gps: 120 }, { count: '45s', gps: 109 },
    { count: '40sHT (TPI 30)', gps: 106 }, { count: '40sHT (TPI 32)', gps: 100 },
    { count: '40sHT (TPI 35)', gps: 87 },  { count: '40sHT (TPI 40)', gps: 78 },
    { count: '50s', gps: 88 }, { count: '60s', gps: 67 },
    { count: '60s HT (48 TPI)', gps: 38 }, { count: '60sHT (41 TPI)', gps: 48 },
    { count: '80s', gps: 38 }, { count: '60s Slub', gps: 63 },
  ]},
  { name: 'Liva Eco', entries: [
    { count: '16s', gps: 500 }, { count: '20s', gps: 373 }, { count: '21s', gps: 347 },
    { count: '24s', gps: 300 }, { count: '30s', gps: 230 }, { count: '32s', gps: 210 },
    { count: '34s', gps: 196 }, { count: '40s', gps: 150 }, { count: '42s', gps: 141 },
    { count: '45s', gps: 127 }, { count: '60s Micro', gps: 67 },
  ]},
  { name: 'Anti Microbial', entries: [
    { count: '16s', gps: 500 }, { count: '20s', gps: 373 }, { count: '21s', gps: 347 },
    { count: '24s', gps: 300 }, { count: '30s', gps: 230 }, { count: '32s', gps: 210 },
    { count: '34s', gps: 196 }, { count: '40s', gps: 150 }, { count: '42s', gps: 141 },
    { count: '45s', gps: 127 },
  ]},
  { name: 'Liva Reviva', entries: [
    { count: '16s', gps: 500 }, { count: '20s', gps: 373 }, { count: '21s', gps: 347 },
    { count: '24s', gps: 300 }, { count: '30s', gps: 230 }, { count: '32s', gps: 210 },
    { count: '34s', gps: 196 }, { count: '40s', gps: 150 }, { count: '42s', gps: 141 },
    { count: '45s', gps: 127 },
  ]},
  { name: 'Refibra', entries: [
    { count: '16s', gps: 500 }, { count: '20s', gps: 373 }, { count: '21s', gps: 347 },
    { count: '24s', gps: 300 }, { count: '30s', gps: 230 }, { count: '32s', gps: 210 },
    { count: '34s', gps: 196 }, { count: '40s', gps: 150 }, { count: '42s', gps: 141 },
    { count: '45s', gps: 127 },
  ]},
  { name: 'Micro Modal (Lenzing)', entries: [
    { count: '20s', gps: 324 }, { count: '21s', gps: 302 }, { count: '30s', gps: 198 },
    { count: '32s', gps: 180 }, { count: '34s', gps: 175 }, { count: '40s', gps: 128 },
    { count: '42s', gps: 120 }, { count: '45s', gps: 109 }, { count: '50s', gps: 88 },
    { count: '60s', gps: 67 }, { count: '60s HT (48 TPI)', gps: 38 },
    { count: '60sHT (41 TPI)', gps: 48 }, { count: '80s', gps: 38 },
    { count: '60s Slub', gps: null },
  ]},
  { name: 'Micro EcoVero', entries: [{ count: '60s', gps: 65 }] },
  { name: 'Tencel STD', entries: [
    { count: '20s', gps: 324 }, { count: '21s', gps: 302 }, { count: '30s', gps: 198 },
    { count: '32s', gps: 180 }, { count: '34s', gps: 175 }, { count: '40s', gps: 128 },
    { count: '42s', gps: 120 }, { count: '45s', gps: 109 }, { count: '50s', gps: 88 },
    { count: '60s', gps: 67 },
  ]},
  { name: 'Micro Tencel', entries: [{ count: '80s', gps: 38 }] },
];

export function standaloneCategory(name: string, supplier: string): string | null {
  const key = `${name}|${supplier}`;
  const map: Record<string, string> = {
    'Micro Modal|Grasim':    'Micro Modal',
    'Micro Modal|Lenzing':   'Micro Modal (Lenzing)',
    'Liva Eco|Grasim':       'Liva Eco',
    'Anti-Bacterial|Grasim': 'Anti Microbial',
    'Liva Reviva|Grasim':    'Liva Reviva',
    'Refibra|Lenzing':       'Refibra',
    'Micro EcoVero|Lenzing': 'Micro EcoVero',
    'Tencel STD|Lenzing':    'Tencel STD',
    'Micro Tencel|Lenzing':  'Micro Tencel',
  };
  return map[key] ?? null;
}

export function getGroup(name: string): YarnCountGroup | null {
  return YARN_COUNT_GROUPS.find(g => g.name === name) ?? null;
}

export function getStandaloneEntries(name: string, supplier: string): YarnCountEntry[] {
  const catName = standaloneCategory(name, supplier);
  if (!catName) return [];
  return STANDALONE_CATEGORIES.find(c => c.name === catName)?.entries ?? [];
}

export function getGroupEntries(groupName: string, subType: string): YarnCountEntry[] {
  if (subType === 'Doubling') return [];
  const group = getGroup(groupName);
  if (!group) return [];
  return group.subCategories.find(c => c.name === subType)?.entries ?? [];
}

export function matchCount(entries: YarnCountEntry[], countStr: string): YarnCountEntry | null {
  return (
    entries.find(e => e.count === `${countStr}s` || e.count === countStr) ??
    entries.find(e => e.count.match(/\d+/)?.[0] === countStr) ??
    null
  );
}
