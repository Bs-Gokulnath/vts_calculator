export interface ParsedQuery {
  countStr: string | null;
  isDoubled: boolean;
  yarnType: string | null;
  subType: string | null;
  endUse: string | null;
  original: string;
}

export function parseYarnQuery(input: string): ParsedQuery {
  const s = input.toLowerCase().trim();

  // Count
  let countStr: string | null = null;
  let isDoubled = false;

  const doubMatch = s.match(/\b(\d+)\s*\/\s*(\d+)\b/);
  if (doubMatch) {
    countStr  = doubMatch[1];
    isDoubled = parseInt(doubMatch[2]) >= 2;
  } else {
    const m = s.match(/\b(\d+)s?\b/);
    if (m) countStr = m[1];
  }

  // Yarn type (most specific first)
  let yarnType: string | null = null;
  if (/micro\s*modal|micromodal/.test(s))               yarnType = 'Micro Modal';
  else if (/micro\s*eco\s*vero|mev\b/.test(s))          yarnType = 'Micro EcoVero';
  else if (/micro\s*tencel/.test(s))                    yarnType = 'Micro Tencel';
  else if (/eco[\s-]?vero|ecovero/.test(s))             yarnType = 'Eco Vero';
  else if (/liva\s*reviva|reviva/.test(s))              yarnType = 'Liva Reviva';
  else if (/liva\s*eco/.test(s))                        yarnType = 'Liva Eco';
  else if (/anti[\s-]?bacterial|antibacterial/.test(s)) yarnType = 'Anti-Bacterial';
  else if (/refibra/.test(s))                           yarnType = 'Refibra';
  else if (/tencel/.test(s))                            yarnType = 'Tencel STD';
  else if (/excel/.test(s))                             yarnType = 'Excel';
  else if (/viscose|vsf/.test(s))                       yarnType = 'Viscose';
  else if (/modal/.test(s))                             yarnType = 'Modal';
  else if (/\bmm\b/.test(s))                            yarnType = 'Micro Modal';

  // Sub-type (most specific first)
  let subType: string | null = null;
  if (isDoubled) {
    subType = 'Doubling';
  } else if (/ht\s*slub|high\s*twist\s*slub/.test(s)) {
    subType = 'High Twist Slub';
  } else if (/micro\s*viscose/.test(s)) {
    subType = 'Micro Viscose';
    yarnType ??= 'Viscose';
  } else if (/micro\s*excel/.test(s)) {
    subType = 'Micro Excel';
    yarnType ??= 'Excel';
  } else if (/\bht\b|high\s*twist/.test(s)) {
    subType = 'High Twist';
  } else if (/slub/.test(s)) {
    subType = 'Slub';
    yarnType ??= 'Viscose';
  } else if (/compact|cpt|ring/.test(s)) {
    subType = 'Normal';
  }

  // End use
  let endUse: string | null = null;
  if (/knitting|hosiery/.test(s))  endUse = 'knitting';
  else if (/weaving|woven/.test(s)) endUse = 'weaving';

  return { countStr, isDoubled, yarnType, subType, endUse, original: input };
}
