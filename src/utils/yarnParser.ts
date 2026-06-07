export interface ParsedQuery {
  countStr: string | null;
  isDoubled: boolean;
  yarnType: string | null;
  subType: string | null;
  endUse: string | null;
  original: string;
}

// ── Levenshtein distance ──────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let cur = i;
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(
        row[j] + 1,
        cur + 1,
        row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      row[j - 1] = cur;
      cur = next;
    }
    row[b.length] = cur;
  }
  return row[b.length];
}

// ── All known yarn-type patterns → canonical name ─────────────────────────────
// Ordered longest-first so substring scan finds the most specific match first.
const YARN_PATTERNS: { pat: string; name: string }[] = [
  // 3-word
  { pat: 'micro eco vero',  name: 'Micro EcoVero'  },
  { pat: 'micro eco vera',  name: 'Micro EcoVero'  },
  { pat: 'micro eco ver',   name: 'Micro EcoVero'  },
  { pat: 'micro liva eco',  name: 'Micro Liva Eco' },
  // 2-word
  { pat: 'micro ecovero',   name: 'Micro EcoVero'  },
  { pat: 'micro ecovera',   name: 'Micro EcoVero'  },
  { pat: 'micro ekovero',   name: 'Micro EcoVero'  },
  { pat: 'micro modal',     name: 'Micro Modal'    },
  { pat: 'micromodal',      name: 'Micro Modal'    },
  { pat: 'micro mod',       name: 'Micro Modal'    },
  { pat: 'micro tencel',    name: 'Micro Tencel'   },
  { pat: 'micro tensel',    name: 'Micro Tencel'   },
  { pat: 'micro tencil',    name: 'Micro Tencel'   },
  { pat: 'micro liva',      name: 'Micro Liva Eco' },
  { pat: 'liva reviva',     name: 'Liva Reviva'    },
  { pat: 'liva eco',        name: 'Liva Eco'       },
  { pat: 'eco vero',        name: 'Eco Vero'       },
  { pat: 'eco vera',        name: 'Eco Vero'       },  // common typo
  { pat: 'eco varo',        name: 'Eco Vero'       },  // common typo
  { pat: 'eco veru',        name: 'Eco Vero'       },  // common typo
  { pat: 'eco veri',        name: 'Eco Vero'       },  // common typo
  { pat: 'eco varo',        name: 'Eco Vero'       },
  { pat: 'anti bacterial',  name: 'Anti-Bacterial' },
  { pat: 'anti-bacterial',  name: 'Anti-Bacterial' },
  // 1-word
  { pat: 'ecovero',         name: 'Eco Vero'       },
  { pat: 'ecovera',         name: 'Eco Vero'       },
  { pat: 'antibacterial',   name: 'Anti-Bacterial' },
  { pat: 'refibra',         name: 'Refibra'        },
  { pat: 'reviva',          name: 'Liva Reviva'    },
  { pat: 'tencel',          name: 'Tencel STD'     },
  { pat: 'tensel',          name: 'Tencel STD'     },  // common typo
  { pat: 'tencil',          name: 'Tencel STD'     },  // common typo
  { pat: 'tensal',          name: 'Tencel STD'     },  // common typo
  { pat: 'viscose',         name: 'Viscose'        },
  { pat: 'viscos',          name: 'Viscose'        },  // prefix
  { pat: 'excel',           name: 'Excel'          },
  { pat: 'modal',           name: 'Modal'          },
  // Abbreviations (exact only, too short for fuzzy)
  { pat: 'vsf',             name: 'Viscose'        },
  { pat: 'mev',             name: 'Micro EcoVero'  },
  { pat: 'mm',              name: 'Micro Modal'    },
];

// Fuzzy-match yarn type from a cleaned input string.
// Returns the canonical yarn type name or null.
function fuzzyMatchYarnType(s: string): string | null {
  // Strip count patterns so numbers don't confuse the matcher
  const cleaned = s
    .replace(/\b\d+\s*\/\s*\d+\b/g, ' ')
    .replace(/\b\d+s?\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Exact substring scan (longest patterns tried first)
  for (const { pat, name } of YARN_PATTERNS) {
    if (cleaned.includes(pat)) return name;
  }

  // 2. Build word n-gram candidates (up to 3 words)
  const words = cleaned.split(/\s+/).filter(w => w.length >= 2);
  const candidates: string[] = [];
  for (let len = 3; len >= 1; len--) {
    for (let i = 0; i <= words.length - len; i++) {
      candidates.push(words.slice(i, i + len).join(' '));
    }
  }

  let bestName: string | null = null;
  let bestScore = -1;

  for (const candidate of candidates) {
    if (candidate.length < 3) continue;

    for (const { pat, name } of YARN_PATTERNS) {
      // Short abbreviations: exact match only (too risky to fuzzy)
      if (pat.length <= 3) continue;

      let score = 0;

      // Prefix: the user typed the start of a known pattern
      if (pat.startsWith(candidate) && candidate.length >= 4) {
        // Score scales with how much of the pattern is covered
        score = 85 - (pat.length - candidate.length);
      }

      // Edit distance: handles swapped letters / small typos
      if (candidate.length >= 4 && pat.length >= 4) {
        const dist = levenshtein(candidate, pat);
        if (dist === 1) score = Math.max(score, 78);
        else if (dist === 2 && Math.min(candidate.length, pat.length) >= 6) {
          score = Math.max(score, 62);
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestName = name;
      }
    }
  }

  return bestScore >= 60 ? bestName : null;
}

// ── Main parser ───────────────────────────────────────────────────────────────
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

  // Yarn type — regex fast-path (most specific first)
  let yarnType: string | null = null;
  if      (/micro\s*eco\s*ver[oa]?|mev\b/.test(s))     yarnType = 'Micro EcoVero';
  else if (/micro\s*modal|micromodal|\bmm\b/.test(s))   yarnType = 'Micro Modal';
  else if (/micro\s*ten[cs]el/.test(s))                 yarnType = 'Micro Tencel';
  else if (/micro\s*liva/.test(s))                      yarnType = 'Micro Liva Eco';
  else if (/liva\s*reviva|reviva/.test(s))              yarnType = 'Liva Reviva';
  else if (/liva\s*eco/.test(s))                        yarnType = 'Liva Eco';
  else if (/eco[\s-]?ver[oa]u?i?|ecovera?/.test(s))    yarnType = 'Eco Vero';
  else if (/anti[\s-]?bacterial|antibacterial/.test(s)) yarnType = 'Anti-Bacterial';
  else if (/refibra/.test(s))                           yarnType = 'Refibra';
  else if (/ten[cs]el|tensal/.test(s))                  yarnType = 'Tencel STD';
  else if (/excel/.test(s))                             yarnType = 'Excel';
  else if (/viscose?|vsf/.test(s))                      yarnType = 'Viscose';
  else if (/modal/.test(s))                             yarnType = 'Modal';

  // Fuzzy fallback — fires only when regex found nothing
  if (!yarnType) {
    yarnType = fuzzyMatchYarnType(s);
  }

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
  if (/knitting|hosiery/.test(s))   endUse = 'knitting';
  else if (/weaving|woven/.test(s)) endUse = 'weaving';

  return { countStr, isDoubled, yarnType, subType, endUse, original: input };
}
