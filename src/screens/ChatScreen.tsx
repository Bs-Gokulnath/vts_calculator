import { useState, useRef, useEffect } from 'react';
import { Send, Share2, Cpu, Bookmark, BookmarkCheck, Zap, MessageCircle, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { parseYarnQuery, ParsedQuery } from '../utils/yarnParser';
import { formatRupees, shareText } from '../utils/format';
import { RawMaterial, exMillIncTransport, cleanFibrePrice } from '../data/rawMaterials';
import {
  YARN_COUNT_GROUPS, DOUBLING_RATES,
  getGroup, getGroupEntries, getStandaloneEntries, matchCount,
  productionRounded, standaloneCategory,
} from '../data/yarnCount';

type Awaiting = 'none' | 'materialChoice' | 'subType' | 'contribution';

interface Msg { text: string; isUser: boolean; }

export default function ChatScreen() {
  const { state, dispatch } = useApp();
  const [msgs, setMsgs]             = useState<Msg[]>([{
    text: 'Hi! Ask me for yarn prices.\n\nExamples:\n• 30 viscose compact\n• 30/1 HT price\n• 30s slub price\n• 40 MM knitting\n• 30/2 weaving',
    isUser: false,
  }]);
  const [input, setInput]           = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const [awaiting, setAwaiting]     = useState<Awaiting>('none');
  const [sessionContrib, setSessContrib] = useState<number | null>(null);

  // Resolution state
  const pendingQuery  = useRef<ParsedQuery | null>(null);
  const pendingMat    = useRef<RawMaterial | null>(null);
  const pendingChoices = useRef<RawMaterial[]>([]);
  const pendingSubTypes = useRef<string[]>([]);

  const resolvedMat    = useRef<RawMaterial | null>(null);
  const resolvedSubType = useRef<string | null>(null);
  const resolvedCount  = useRef<{ count: string; gps: number | null } | null>(null);
  const resolvedDoubling = useRef<{ count: string; rate: number } | null>(null);
  const resolvedEndUse = useRef<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, isTyping]);

  const bot  = (text: string) => setMsgs(m => [...m, { text, isUser: false }]);
  const user = (text: string) => setMsgs(m => [...m, { text, isUser: true }]);

  async function send() {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    user(text);

    switch (awaiting) {
      case 'none':           await handleQuery(text); break;
      case 'materialChoice': handleMaterialChoice(text); break;
      case 'subType':        handleSubTypeChoice(text); break;
      case 'contribution':   handleContribution(text); break;
    }
  }

  async function handleQuery(input: string) {
    pendingQuery.current = null;
    resolvedMat.current = resolvedSubType.current = resolvedCount.current = resolvedDoubling.current = resolvedEndUse.current = null;

    setIsTyping(true);

    let q: ParsedQuery;
    if (state.apiKey) {
      try { q = await claudeParse(input, state.apiKey); }
      catch { q = parseYarnQuery(input); }
    } else {
      await new Promise(r => setTimeout(r, 300)); // tiny delay for UX
      q = parseYarnQuery(input);
    }
    setIsTyping(false);
    routeQuery(q);
  }

  function routeQuery(q: ParsedQuery) {
    pendingQuery.current = q;

    if (!q.yarnType && q.subType) {
      const candidates = materialsBySubType(q.subType);
      if (candidates.length === 0) { bot(`No yarn type found with sub-type "${q.subType}".\nAvailable: ${allTypes()}`); return; }
      if (candidates.length === 1) { pendingMat.current = candidates[0]; resolve({ ...q, yarnType: candidates[0].name }); return; }
      pendingChoices.current = candidates;
      setAwaiting('materialChoice');
      bot(`"${q.subType}" is available for:\n${numbered(candidates.map(m => `${m.name} — ${m.supplier}`))}\nWhich one?`);
      return;
    }

    if (!q.yarnType) { bot('Please mention the yarn type (e.g. Viscose, Micro Modal, Excel, Eco Vero, Tencel STD).'); return; }

    const matches = state.rawMaterials.filter(m => m.name.toLowerCase() === q.yarnType!.toLowerCase());
    if (matches.length === 0) { bot(`"${q.yarnType}" not found in Settings.\nAvailable: ${allTypes()}`); return; }
    if (matches.length > 1) {
      pendingChoices.current = matches;
      setAwaiting('materialChoice');
      bot(`Multiple matches for "${q.yarnType}":\n${numbered(matches.map(m => `${m.name} — ${m.supplier}`))}\nWhich one?`);
      return;
    }
    pendingMat.current = matches[0];
    resolve(q);
  }

  function resolve(q: ParsedQuery) {
    pendingQuery.current = q;
    const m   = pendingMat.current!;
    const grp = getGroup(m.name);
    let st    = q.subType;

    if (grp && !st) {
      pendingSubTypes.current = grp.subCategories.map(c => c.name);
      setAwaiting('subType');
      bot(`${m.name} has sub-types:\n${numbered(pendingSubTypes.current)}\nWhich one?`);
      return;
    }

    if (grp && st) {
      const match = grp.subCategories.find(c => c.name.toLowerCase() === st!.toLowerCase());
      if (match) st = match.name;
    }

    let countEntry: { count: string; gps: number | null } | null = null;
    let doublingRate: { count: string; rate: number } | null     = null;

    if (q.countStr) {
      if (st === 'Doubling') {
        doublingRate = DOUBLING_RATES.find(r => r.count === q.countStr) ?? null;
      } else {
        const entries = grp ? getGroupEntries(m.name, st ?? '') : getStandaloneEntries(m.name, m.supplier);
        countEntry    = matchCount(entries, q.countStr);
      }
    }

    resolvedMat.current      = m;
    resolvedSubType.current  = st ?? null;
    resolvedCount.current    = countEntry;
    resolvedDoubling.current = doublingRate;
    resolvedEndUse.current   = q.endUse;
    setAwaiting('none');
    showResult();
  }

  function showResult() {
    const m            = resolvedMat.current!;
    const cleanFibre   = exMillIncTransport(m) * (1 + m.wastePercent / 100);
    const sub          = resolvedSubType.current;
    const ce           = resolvedCount.current;
    const dr           = resolvedDoubling.current;
    const eu           = resolvedEndUse.current;

    const header = [m.name, sub && sub !== 'Normal' ? sub : null, `(${m.supplier})`].filter(Boolean).join(' • ');
    const lines: string[] = [
      header,
      eu ? `End use: ${eu.charAt(0).toUpperCase() + eu.slice(1)}` : null,
      '──────────────────────────',
      ce ? `Count:      ${ce.count}` : null,
      ce?.gps != null ? `GPS:        ${ce.gps.toFixed(0)}` : null,
      ce ? `Production: ${productionRounded(ce) ?? '—'} kg/day` : null,
      ce ? '' : null,
      dr ? `Count:         ${dr.count}` : null,
      dr ? `Doubling Rate: ₹${dr.rate.toFixed(0)}` : null,
      dr ? '' : null,
      `Ex-Mill Rate:    ₹${m.exMillRate.toFixed(2)}`,
      `Inc. Transport:  ₹${exMillIncTransport(m).toFixed(2)}`,
      `Waste:           ${m.wastePercent.toFixed(1)}%`,
      '──────────────────────────',
      `Clean Fibre Price: ₹${cleanFibre.toFixed(2)}`,
    ].filter(l => l != null) as string[];

    bot(lines.join('\n'));

    const prod = ce ? productionRounded(ce) : null;
    if (prod && prod > 0) {
      if (sessionContrib != null) {
        showExMillRate(cleanFibre, prod);
      } else {
        setAwaiting('contribution');
        const hint = state.contributions.length > 0
          ? ` (${state.contributions.slice(0,4).map(v => `₹${v.toFixed(0)}`).join(', ')}…)`
          : '';
        bot(`Enter contribution amount${hint} to get the Ex-Mill Rate:`);
      }
    }
  }

  function showExMillRate(cleanFibre: number, production: number) {
    const contrib  = sessionContrib!;
    const rate     = contrib / production;
    const exMill   = rate + cleanFibre;
    bot([
      `Contribution: ${formatRupees(contrib)}`,
      `Rate / kg:    ₹${rate.toFixed(2)}`,
      '──────────────────────────',
      `Ex-Mill Rate: ₹${exMill.toFixed(2)}`,
    ].join('\n'));
  }

  function handleMaterialChoice(text: string) {
    const choices = pendingChoices.current;
    const idx = parseInt(text.trim()) - 1;
    let chosen: RawMaterial | null = null;
    if (!isNaN(idx) && idx >= 0 && idx < choices.length) chosen = choices[idx];
    else {
      const lower = text.toLowerCase();
      chosen = choices.find(m => m.supplier.toLowerCase().includes(lower) || m.name.toLowerCase().includes(lower)) ?? null;
    }
    if (!chosen) { bot(`Enter a number (1–${choices.length}) or the supplier name.`); return; }
    setAwaiting('none');
    pendingChoices.current = [];
    pendingMat.current = chosen;
    resolve(pendingQuery.current!);
  }

  function handleSubTypeChoice(text: string) {
    const subTypes = pendingSubTypes.current;
    const idx = parseInt(text.trim()) - 1;
    let chosen: string | null = null;
    if (!isNaN(idx) && idx >= 0 && idx < subTypes.length) chosen = subTypes[idx];
    else chosen = subTypes.find(s => s.toLowerCase().includes(text.toLowerCase())) ?? null;
    if (!chosen) { bot(`Enter a number (1–${subTypes.length}) or the sub-type name.`); return; }
    setAwaiting('none');
    pendingSubTypes.current = [];
    resolve({ ...pendingQuery.current!, subType: chosen });
  }

  function handleContribution(text: string) {
    const val = parseFloat(text.replace(/,/g, '').replace('₹', ''));
    if (isNaN(val) || val <= 0) { bot('Please enter a valid amount (e.g. 50000).'); return; }
    setSessContrib(val);
    setAwaiting('none');
    const prod = resolvedCount.current ? productionRounded(resolvedCount.current) : null;
    const m    = resolvedMat.current;
    if (m && prod && prod > 0) {
      const cleanFibre = exMillIncTransport(m) * (1 + m.wastePercent / 100);
      const rate = val / prod;
      const exMill = rate + cleanFibre;
      bot([
        `Contribution: ${formatRupees(val)}`,
        `Rate / kg:    ₹${rate.toFixed(2)}`,
        '──────────────────────────',
        `Ex-Mill Rate: ₹${exMill.toFixed(2)}`,
      ].join('\n'));
    }
  }

  function materialsBySubType(subType: string): RawMaterial[] {
    const lower = subType.toLowerCase();
    const result: RawMaterial[] = [];
    for (const g of YARN_COUNT_GROUPS) {
      if (g.subCategories.some(c => c.name.toLowerCase() === lower)) {
        result.push(...state.rawMaterials.filter(m => m.name === g.name));
      }
    }
    return result;
  }

  function allTypes() { return [...new Set(state.rawMaterials.map(m => m.name))].join(', '); }
  function numbered(items: string[]) { return items.map((s, i) => `${i+1}. ${s}`).join('\n'); }

  const hintText = () => {
    if (isTyping) return 'Thinking…';
    if (awaiting === 'contribution')   return 'Enter contribution amount…';
    if (awaiting === 'materialChoice' || awaiting === 'subType') return 'Enter number or name…';
    return 'Ask for yarn price…';
  };

  return (
    <div className="flex flex-col h-full bg-surface-page">
      {/* Header */}
      <div className="page-header shrink-0">
        <div className="flex items-center justify-center gap-2">
          <Sparkles size={16} className="text-brand-500 shrink-0" />
          <h1 className="page-title text-center">Chat</h1>
        </div>
      </div>

      {/* AI status bar */}
      <div className="flex justify-center mx-4 my-2 shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
            state.apiKey
              ? 'bg-brand-50 border-brand-100 text-brand-600'
              : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}
        >
          {state.apiKey
            ? <Zap size={10} className="shrink-0" />
            : <Cpu size={10} className="shrink-0" />}
          {state.apiKey ? 'On-device AI parsing active' : 'Keyword parser active'}
        </span>
      </div>

      {/* Session contribution banner */}
      {sessionContrib != null && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 mx-4 mb-2 px-4 py-2.5 shrink-0 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-emerald-700 text-xs font-medium flex-1">
            Session contribution: {formatRupees(sessionContrib)}
          </span>
          <button
            onClick={() => setSessContrib(null)}
            className="text-emerald-300 hover:text-emerald-500 transition-colors leading-none"
            aria-label="Clear contribution"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-surface-page px-4 py-3 space-y-1">
        {msgs.map((m, i) => <Bubble key={i} msg={m} isFirst={i === 0} dispatch={dispatch} />)}
        {isTyping && <TypingBubble />}
        <div ref={scrollRef} />
      </div>

      {/* Input area — padded for iPhone home bar */}
      <div
        className="shrink-0 bg-white border-t border-gray-100 px-4 pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
      >
        <div className="flex items-center gap-2">
          <input
            className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm flex-1 focus:bg-white focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100 text-ink placeholder-gray-400 transition-all"
            placeholder={hintText()}
            value={input}
            disabled={isTyping}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button
            onClick={send}
            disabled={isTyping || !input.trim()}
            className="shrink-0 w-11 h-11 rounded-xl text-white flex items-center justify-center shadow-sm hover:shadow-glow active:scale-95 transition-all disabled:opacity-40 disabled:shadow-none disabled:active:scale-100"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)' }}
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg, isFirst, dispatch }: { msg: Msg; isFirst?: boolean; dispatch: React.Dispatch<any> }) {
  const [copied, setCopied] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const isResult = msg.text.includes('──');

  if (msg.isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[78%] rounded-2xl rounded-br-sm text-white text-sm px-4 py-2.5 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)' }}
        >
          {msg.text}
        </div>
      </div>
    );
  }

  function handleSave() {
    const firstLine = msg.text.split('\n')[0] ?? 'Quote';
    dispatch({
      type: 'ADD_HISTORY',
      payload: { id: Date.now().toString(), material: firstLine, text: msg.text, savedAt: new Date().toISOString() },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  /* Welcome / first bot message gets a special card treatment */
  if (isFirst) {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[82%]">
          <div className="bg-white shadow-card border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                <MessageCircle size={12} className="text-brand-500" />
              </div>
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Yarn Assistant</span>
            </div>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm text-ink leading-relaxed">{msg.text}</pre>
          </div>
        </div>
      </div>
    );
  }

  /* Result bubble — monospace code-block style */
  if (isResult) {
    return (
      <div className="flex justify-start mb-2">
        <div className="max-w-[82%]">
          <div className="bg-white shadow-card border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-ink">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mt-1">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-gray-600">{msg.text}</pre>
            </div>
          </div>
          <div className="chip flex items-center gap-1 mt-1.5 ml-1">
            <button
              onClick={handleSave}
              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                saved
                  ? 'bg-brand-50 border-brand-100 text-brand-600'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500'
              }`}
            >
              {saved ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
              {saved ? 'Saved!' : 'Save'}
            </button>
            <button
              onClick={async () => { await shareText(msg.text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                copied
                  ? 'bg-brand-50 border-brand-100 text-brand-600'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500'
              }`}
            >
              <Share2 size={11} />
              {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Standard bot bubble */
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[82%]">
        <div className="bg-white shadow-card border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-ink">
          <pre className="whitespace-pre-wrap break-words font-sans leading-relaxed">{msg.text}</pre>
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-white border border-gray-100 shadow-card rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 bg-brand-400 rounded-full animate-pulse2"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

async function claudeParse(input: string, apiKey: string): Promise<ParsedQuery> {
  const system = `You are a yarn query parser. Extract structured data and return ONLY valid JSON.
Available yarn_type values: Viscose, Modal, Micro Modal, Excel, Liva Eco, Micro Liva Eco, Anti-Bacterial, Liva Reviva, Eco Vero, Refibra, Tencel STD, Micro EcoVero, Micro Tencel
Available sub_type values: Normal, High Twist, Slub, High Twist Slub, Micro Viscose, Micro Excel, Doubling
Aliases: vsf→Viscose, mm→Micro Modal, mev→Micro EcoVero, ht→High Twist, ring/compact/cpt→Normal, hosiery/knitting→knitting, weaving/woven→weaving
Return exactly: {"count":null,"yarn_type":null,"sub_type":null,"end_use":null,"is_doubled":false}`;

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 150, system, messages: [{ role: 'user', content: input }] }),
  });

  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  const body = await resp.json() as { content: Array<{ text: string }> };
  const text = body.content[0].text.replace(/```json?\s*|```/g, '').trim();
  const json = JSON.parse(text) as { count: string | null; yarn_type: string | null; sub_type: string | null; end_use: string | null; is_doubled: boolean };

  const isDoubled = json.is_doubled ?? false;
  return {
    countStr:  json.count,
    isDoubled,
    yarnType:  json.yarn_type,
    subType:   isDoubled ? 'Doubling' : json.sub_type,
    endUse:    json.end_use,
    original:  input,
  };
}
