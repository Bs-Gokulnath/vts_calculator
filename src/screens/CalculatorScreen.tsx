import { useState } from 'react';
import { Share2, CheckCircle, Calculator, Bookmark, BookmarkCheck, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { RawMaterial, exMillIncTransport, cleanFibrePrice } from '../data/rawMaterials';
import {
  YARN_COUNT_GROUPS, STANDALONE_CATEGORIES, DOUBLING_RATES,
  getGroup, getGroupEntries, getStandaloneEntries, matchCount,
  productionRounded, standaloneCategory,
} from '../data/yarnCount';
import { formatRupees, shareText } from '../utils/format';

export default function CalculatorScreen() {
  const { state, dispatch } = useApp();
  const materials = state.rawMaterials;

  const [material, setMaterial]       = useState<RawMaterial | null>(null);
  const [subType, setSubType]         = useState('');
  const [countStr, setCountStr]       = useState('');
  const [exMill, setExMill]           = useState('');
  const [transport, setTransport]     = useState('');
  const [waste, setWaste]             = useState('');
  const [gps, setGps]                 = useState('');
  const [prod, setProd]               = useState('');
  const [contribution, setContrib]    = useState('');
  const [presetContrib, setPreset]    = useState('');
  const [copied, setCopied]           = useState(false);
  const [savedClean, setSavedClean]   = useState(false);
  const [savedFull, setSavedFull]     = useState(false);

  const group = material ? getGroup(material.name) : null;

  const countEntries = (() => {
    if (!material) return [];
    if (group) {
      if (!subType) return [];
      if (subType === 'Doubling') return DOUBLING_RATES.map(r => ({ count: r.count, gps: null }));
      return getGroupEntries(material.name, subType);
    }
    return getStandaloneEntries(material.name, material.supplier);
  })();

  const showCount = material != null && (group == null || subType !== '') && countEntries.length > 0;

  const cleanFibre = (() => {
    const inc  = parseFloat(exMill) + parseFloat(transport || '0');
    const w    = parseFloat(waste);
    if (isNaN(inc) || isNaN(w)) return null;
    return inc * (1 + w / 100);
  })();

  const ratePerKg = (() => {
    const c = parseFloat(contribution);
    const p = parseFloat(prod);
    if (isNaN(c) || isNaN(p) || p === 0) return null;
    return c / p;
  })();

  const yarnExMill = ratePerKg != null && cleanFibre != null ? ratePerKg + cleanFibre : null;

  function onMaterialChange(id: string) {
    const m = materials.find(x => x.id === id) ?? null;
    setMaterial(m);
    setSubType(''); setCountStr(''); setGps(''); setProd(''); setContrib(''); setPreset('');
    if (m) {
      setExMill(m.exMillRate.toFixed(2));
      setTransport(m.transport.toFixed(2));
      setWaste(m.wastePercent.toFixed(1));
    }
  }

  function onGpsChange(v: string) {
    setGps(v);
    const g = parseFloat(v);
    if (!isNaN(g)) setProd(Math.round(g * 3 / 1000 * 1632).toString());
    else setProd('');
  }

  function onProdChange(v: string) {
    setProd(v);
    const p = parseFloat(v);
    if (!isNaN(p) && p > 0) setGps((p * 1000 / 3 / 1632).toFixed(2));
    else setGps('');
  }

  function onCountChange(v: string) {
    setCountStr(v);
    if (!v) { setGps(''); setProd(''); return; }
    if (subType === 'Doubling') return;
    const entry = countEntries.find(e => e.count === v);
    if (entry?.gps != null) {
      setGps(entry.gps.toFixed(0));
      const pr = productionRounded(entry);
      setProd(pr != null ? pr.toString() : '');
    } else { setGps(''); setProd(''); }
  }

  function buildCleanFibreQuote(): string {
    if (!material || cleanFibre == null) return '';
    const parts = [material.name, subType && subType !== 'Normal' ? subType : null, `(${material.supplier})`].filter(Boolean);
    return [
      'Yarn Cost Quote',
      '──────────────────────────',
      parts.join(' • '),
      countStr ? `Count: ${countStr}` : null,
      '',
      `Ex-Mill Rate:      ₹${parseFloat(exMill).toFixed(2)}`,
      `Inc. Transport:    ₹${(parseFloat(exMill) + parseFloat(transport || '0')).toFixed(2)}`,
      `Waste:             ${waste}%`,
      '──────────────────────────',
      `Clean Fibre Price: ₹${cleanFibre.toFixed(2)}`,
    ].filter(l => l != null).join('\n');
  }

  function buildFullQuote(): string {
    const base = buildCleanFibreQuote();
    if (!ratePerKg || !yarnExMill) return base;
    return [
      base, '',
      contribution ? `Contribution:  ${formatRupees(parseFloat(contribution))}` : null,
      `Rate / kg:     ₹${ratePerKg.toFixed(2)}`,
      '──────────────────────────',
      `Ex-Mill Rate:  ₹${yarnExMill.toFixed(2)}`,
    ].filter(Boolean).join('\n');
  }

  async function handleShare(full = false) {
    const text = full ? buildFullQuote() : buildCleanFibreQuote();
    if (!text) return;
    await shareText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave(full = false) {
    if (!material) return;
    const text = full ? buildFullQuote() : buildCleanFibreQuote();
    if (!text) return;
    dispatch({
      type: 'ADD_HISTORY',
      payload: { id: Date.now().toString(), material: `${material.name} (${material.supplier})`, text, savedAt: new Date().toISOString() },
    });
    if (full) { setSavedFull(true); setTimeout(() => setSavedFull(false), 2000); }
    else      { setSavedClean(true); setTimeout(() => setSavedClean(false), 2000); }
  }

  const bySupplier = (s: string) => materials.filter(m => m.supplier === s);
  const grasim = bySupplier('Grasim'), lenzing = bySupplier('Lenzing');
  const others  = materials.filter(m => m.supplier !== 'Grasim' && m.supplier !== 'Lenzing');

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <header className="page-header">
        <div className="flex items-center justify-center gap-2">
          <Calculator size={17} style={{ color: 'rgba(255,255,255,0.7)' }} />
          <h1 className="page-title text-center">Yarn Cost Calculator</h1>
        </div>
        <p className="text-center text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Calculate ex-mill rates instantly
        </p>
      </header>

      <div
        className="flex-1 overflow-y-auto px-4 pt-5 space-y-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)' }}
      >

        {/* 1. Yarn Type */}
        <div>
          <p className="section-label">Yarn Type</p>
          <SelectWrapper value={material?.id ?? ''} onChange={e => onMaterialChange(e.target.value)}>
            <option value="">Choose a yarn type…</option>
            {grasim.length > 0  && <optgroup label="Grasim">{grasim.map( m => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>}
            {lenzing.length > 0 && <optgroup label="Lenzing">{lenzing.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</optgroup>}
            {others.length > 0  && <optgroup label="Other">{others.map(  m => <option key={m.id} value={m.id}>{m.name} — {m.supplier}</option>)}</optgroup>}
          </SelectWrapper>
        </div>

        {/* Empty state */}
        {!material && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div
              className="w-20 h-20 mb-4 flex items-center justify-center rounded-full"
              style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ color: 'var(--text-muted)' }}>
                <circle cx="20" cy="20" r="14" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 15 Q20 9 32 15" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M6 20 Q20 13 34 20" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <path d="M8 25 Q20 19 32 25" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                <line x1="26" y1="5" x2="22" y2="35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="30" y1="6" x2="26" y2="36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Select a yarn type above</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>to begin calculating costs</p>
          </div>
        )}

        {/* 2. Rate Details */}
        {material && (
          <div className="card p-4 space-y-3">
            <p className="section-label">Rate Details</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ex-Mill Rate (₹)" value={exMill} onChange={setExMill} />
              <Field label="Waste %" value={waste} onChange={setWaste} suffix="%" />
            </div>
            <Field
              label="Inc. Transport (₹)"
              value={(parseFloat(exMill||'0') + parseFloat(transport||'0')).toFixed(2)}
              readOnly
            />
          </div>
        )}

        {/* 3. Clean Fibre Result */}
        {material && cleanFibre != null && (
          <div className="card p-4 animate-in" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className="flex-1 min-w-0 truncate text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'var(--accent-soft)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
              >
                {material.name} · {material.supplier}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleSave(false)} className="btn-icon" title={savedClean ? 'Saved!' : 'Save'}>
                  {savedClean
                    ? <BookmarkCheck size={15} style={{ color: 'var(--text)' }} />
                    : <Bookmark size={15} style={{ color: 'var(--text-muted)' }} />}
                </button>
                <button onClick={() => handleShare(false)} className="btn-icon" title="Share">
                  <Share2 size={15} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>

            {subType && subType !== 'Normal' && (
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3"
                style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              >
                {subType}
              </span>
            )}

            <p className="section-label">Result</p>
            <div className="pt-3 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Clean Fibre Price</p>
              <p className="price-large">₹{cleanFibre.toFixed(2)}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>Inc. Transport × (1 + Waste %)</p>
            </div>

            {copied && (
              <p className="text-xs font-semibold mt-2 flex items-center gap-1 text-emerald-600">
                <CheckCircle size={12} /> Copied to clipboard!
              </p>
            )}
          </div>
        )}

        {/* 4. Sub-type */}
        {material && group && (
          <div>
            <p className="section-label">Sub Type</p>
            <SelectWrapper
              value={subType}
              onChange={e => { setSubType(e.target.value); setCountStr(''); setGps(''); setProd(''); }}
            >
              <option value="">Choose a sub type…</option>
              {group.subCategories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </SelectWrapper>
          </div>
        )}

        {/* 5. Count */}
        {showCount && (
          <div>
            <p className="section-label">Count</p>
            <SelectWrapper value={countStr} onChange={e => onCountChange(e.target.value)}>
              <option value="">Choose a count…</option>
              {countEntries.map(e => <option key={e.count} value={e.count}>{e.count}</option>)}
            </SelectWrapper>
          </div>
        )}

        {/* 6. GPS / Production */}
        {countStr && subType !== 'Doubling' && (
          <div className="card p-4 space-y-3">
            <p className="section-label">Production</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="GPS" value={gps} onChange={onGpsChange} />
              <Field label="Production / day / frame (kg)" value={prod} onChange={onProdChange} />
            </div>
          </div>
        )}

        {/* 7. Contribution */}
        {material && (
          <div className="card p-4 space-y-3">
            <p className="section-label">Contribution</p>
            {state.contributions.length > 0 && (
              <div>
                <label className="label">Select Preset</label>
                <SelectWrapper
                  value={presetContrib}
                  onChange={e => { setPreset(e.target.value); if (e.target.value) setContrib(parseFloat(e.target.value).toFixed(2)); }}
                >
                  <option value="">Choose from list…</option>
                  {state.contributions.map(v => <option key={v} value={v}>{formatRupees(v)}</option>)}
                </SelectWrapper>
              </div>
            )}
            <Field label="Amount (₹)" value={contribution} onChange={setContrib} />
          </div>
        )}

        {/* 8. Yarn Cost Summary */}
        {(ratePerKg != null || yarnExMill != null) && (
          <div className="card p-4 animate-in" style={{ borderLeft: '3px solid var(--accent)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1">
                <Calculator size={15} style={{ color: 'var(--text-muted)' }} />
                <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Yarn Cost Summary</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleSave(true)} className="btn-icon" title={savedFull ? 'Saved!' : 'Save'}>
                  {savedFull
                    ? <BookmarkCheck size={15} style={{ color: 'var(--text)' }} />
                    : <Bookmark size={15} style={{ color: 'var(--text-muted)' }} />}
                </button>
                <button onClick={() => handleShare(true)} className="btn-icon" title="Share">
                  <Share2 size={15} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>

            <p className="section-label">Cost Summary</p>

            <div className="pt-3 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>
              {ratePerKg != null && (
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Rate / kg</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Contribution ÷ Production</p>
                  </div>
                  <p className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                    ₹{ratePerKg.toFixed(2)}
                  </p>
                </div>
              )}
              {yarnExMill != null && (
                <div className="rounded-xl px-3 py-3" style={{ background: 'var(--bg-raised)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Yarn Rate</p>
                  <p className="price-large">₹{yarnExMill.toFixed(2)}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>Rate/kg + Clean Fibre</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function SelectWrapper({ value, onChange, children }: {
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select className="select-field" value={value} onChange={onChange}>
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
        <ChevronDown size={14} />
      </span>
    </div>
  );
}

function Field({ label, value, onChange, readOnly, suffix }: {
  label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; suffix?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type="number"
          className={`input-field ${suffix ? 'pr-7' : ''}`}
          style={readOnly ? { background: 'var(--bg-raised)', color: 'var(--text-muted)', cursor: 'default' } : {}}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          readOnly={readOnly}
          inputMode="decimal"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
