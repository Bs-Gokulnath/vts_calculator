import { MACHINE_PARAMS, SpindleType } from '../../data/yarnCount';

const TYPES: { key: SpindleType; label: string }[] = [
  { key: 'nCompact', label: 'N Compact' },
  { key: 'compact',  label: 'Compact'   },
  { key: 'siro',     label: 'Siro'      },
  { key: 'slub',     label: 'Slub'      },
];

interface Section {
  label: string;
  getValue: (p: (typeof MACHINE_PARAMS)[0], t: SpindleType) => string;
}

const SECTIONS: Section[] = [
  { label: 'TM',             getValue: (p, t) => p.tm[t].toFixed(2)           },
  { label: 'TPI',            getValue: (p, t) => p.tpi[t].toFixed(2)          },
  { label: 'Spindle Speed',  getValue: (p, t) => p.spindleSpeed[t].toLocaleString() },
  { label: 'Efficiency (%)', getValue: (p, t) => p.efficiency[t].toString()    },
];

export default function MachineParamsTab() {
  return (
    <div className="h-full overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}>
      <div className="px-4 pt-4 pb-2">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Reference table for TM, TPI, Spindle Speed and Efficiency by count and yarn type.
        </p>
      </div>

      {SECTIONS.map(section => (
        <div key={section.label} className="px-4 pb-4">
          <p className="section-label mb-2">{section.label}</p>
          <div className="card overflow-hidden" style={{ borderRadius: 12 }}>
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-raised)' }}>
                    <th style={thStyle}>Count</th>
                    {TYPES.map(t => (
                      <th key={t.key} style={thStyle}>{t.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MACHINE_PARAMS.map((row, i) => (
                    <tr
                      key={row.count}
                      style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-raised)' }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 700, color: 'var(--text)' }}>{row.count}s</td>
                      {TYPES.map(t => (
                        <td key={t.key} style={tdStyle}>{section.getValue(row, t.key)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '8px 10px',
  textAlign: 'center',
  fontWeight: 600,
  color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '7px 10px',
  textAlign: 'center',
  color: 'var(--text-2)',
  borderBottom: '1px solid var(--border)',
};
