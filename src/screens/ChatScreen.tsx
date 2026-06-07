import { useState, useRef, useEffect } from 'react';
import { Send, Share2, Cpu, Bookmark, BookmarkCheck, Zap, MessageCircle, Sparkles, Trash2 } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { parseYarnQuery, ParsedQuery } from '../utils/yarnParser';
import { formatRupees } from '../utils/format';
import ShareModal from '../components/ui/ShareModal';
import { RawMaterial, exMillIncTransport, cleanFibrePrice } from '../data/rawMaterials';
import {
  YARN_COUNT_GROUPS, DOUBLING_RATES,
  getGroup, getGroupEntries, getStandaloneEntries, matchCount,
  productionRounded, standaloneCategory,
} from '../data/yarnCount';

type Awaiting = 'none' | 'materialChoice' | 'subType' | 'contribution';
type ConversationMsg = { role: 'user' | 'assistant'; content: string };
interface Msg { text: string; isUser: boolean; }

export default function ChatScreen() {
  const { state, dispatch } = useApp();
  const CHAT_STORAGE_KEY = 'vtsChatMessages';
  const WELCOME_MSG: Msg = {
    text: 'Hi! Ask me for yarn prices.\n\nExamples:\n• 30 viscose compact\n• 30/1 HT price\n• 30s slub price\n• 40 MM knitting\n• 30/2 weaving',
    isUser: false,
  };

  const [msgs, setMsgsRaw] = useState<Msg[]>(() => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) return JSON.parse(stored) as Msg[];
    } catch {}
    return [WELCOME_MSG];
  });

  const setMsgs = (updater: Msg[] | ((prev: Msg[]) => Msg[])) => {
    setMsgsRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const [input, setInput]           = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const [awaiting, setAwaiting]     = useState<Awaiting>('none');
  const [sessionContrib, setSessContrib] = useState<number | null>(60000);

  const pendingQuery    = useRef<ParsedQuery | null>(null);
  const pendingMat      = useRef<RawMaterial | null>(null);
  const pendingChoices  = useRef<RawMaterial[]>([]);
  const pendingSubTypes = useRef<string[]>([]);

  const resolvedMat      = useRef<RawMaterial | null>(null);
  const resolvedSubType  = useRef<string | null>(null);
  const resolvedCount    = useRef<{ count: string; gps: number | null } | null>(null);
  const resolvedDoubling = useRef<{ count: string; rate: number } | null>(null);
  const resolvedEndUse   = useRef<string | null>(null);

  const conversationHistory = useRef<ConversationMsg[]>([]);
  const lastContext = useRef<{ yarnType?: string; subType?: string }>({});

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

  function mergeWithContext(q: ParsedQuery): ParsedQuery {
    const ctx = lastContext.current;
    if (!q.yarnType && ctx.yarnType) {
      return { ...q, yarnType: ctx.yarnType, subType: q.subType ?? ctx.subType ?? null };
    }
    return q;
  }

  async function handleQuery(input: string) {
    pendingQuery.current = null;
    resolvedMat.current = resolvedSubType.current = resolvedCount.current = resolvedDoubling.current = resolvedEndUse.current = null;
    setIsTyping(true);
    let q: ParsedQuery;
    if (state.apiKey) {
      try {
        const { query, rawJson } = await claudeParse(input, state.apiKey, conversationHistory.current);
        conversationHistory.current = [
          ...conversationHistory.current,
          { role: 'user' as const,      content: input  },
          { role: 'assistant' as const, content: rawJson },
        ].slice(-8);
        q = query;
      } catch {
        q = mergeWithContext(parseYarnQuery(input));
      }
    } else {
      await new Promise(r => setTimeout(r, 300));
      q = mergeWithContext(parseYarnQuery(input));
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
      const hasNormal = grp.subCategories.some(c => c.name === 'Normal');
      if (hasNormal) {
        st = 'Normal';
      } else {
        pendingSubTypes.current = grp.subCategories.map(c => c.name);
        setAwaiting('subType');
        bot(`${m.name} has sub-types:\n${numbered(pendingSubTypes.current)}\nWhich one?`);
        return;
      }
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

    lastContext.current = {
      yarnType: m.name,
      subType:  st && st !== 'Normal' ? st : undefined,
    };

    setAwaiting('none');
    showResult();
  }

  function showResult() {
    const m          = resolvedMat.current!;
    const cleanFibre = exMillIncTransport(m) * (1 + m.wastePercent / 100);
    const sub        = resolvedSubType.current;
    const ce         = resolvedCount.current;
    const dr         = resolvedDoubling.current;
    const eu         = resolvedEndUse.current;
    const prod       = ce ? productionRounded(ce) : null;

    const header = [m.name, sub && sub !== 'Normal' ? sub : null, `(${m.supplier})`].filter(Boolean).join(' • ');
    const lines: (string | null)[] = [
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
      `Yarn Rate:       ₹${m.exMillRate.toFixed(2)}`,
      `Waste:           ${m.wastePercent.toFixed(1)}%`,
      '──────────────────────────',
      `Clean Fibre Price: ₹${cleanFibre.toFixed(2)}`,
    ];

    if (prod && prod > 0 && sessionContrib != null) {
      const rate   = sessionContrib / prod;
      const exMill = rate + cleanFibre;
      lines.push(
        '',
        `Rate / kg:    ₹${rate.toFixed(2)}`,
        '──────────────────────────',
        `Yarn Rate: ₹${exMill.toFixed(2)}`,
      );
      bot((lines.filter(l => l != null) as string[]).join('\n'));
    } else if (prod && prod > 0) {
      bot((lines.filter(l => l != null) as string[]).join('\n'));
      setAwaiting('contribution');
      const hint = state.contributions.length > 0
        ? ` (${state.contributions.slice(0,4).map(v => `₹${v.toFixed(0)}`).join(', ')}…)`
        : '';
      bot(`Enter contribution amount${hint} to get the Yarn Rate:`);
    } else {
      bot((lines.filter(l => l != null) as string[]).join('\n'));
    }
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
        `Rate / kg:    ₹${rate.toFixed(2)}`,
        '──────────────────────────',
        `Yarn Rate: ₹${exMill.toFixed(2)}`,
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

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  function handleClearChat() {
    setMsgs([WELCOME_MSG]);
    setAwaiting('none');
    setInput('');
    setShowClearConfirm(false);
    conversationHistory.current = [];
    lastContext.current = {};
    pendingQuery.current = pendingMat.current = null;
    pendingChoices.current = pendingSubTypes.current = [];
    resolvedMat.current = resolvedSubType.current = resolvedCount.current = resolvedDoubling.current = resolvedEndUse.current = null;
  }

  const hintText = () => {
    if (isTyping) return 'Thinking…';
    if (awaiting === 'contribution')   return 'Enter contribution amount…';
    if (awaiting === 'materialChoice' || awaiting === 'subType') return 'Enter number or name…';
    return 'Ask for yarn price…';
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <Modal open={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Clear Chat">
        <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>
          All messages will be removed. This can't be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setShowClearConfirm(false)} className="btn-outline flex-1">Cancel</button>
          <button onClick={handleClearChat} className="btn-danger flex-1">Clear</button>
        </div>
      </Modal>

      {/* Header */}
      <div className="page-header shrink-0">
        <div className="flex items-center justify-center gap-2">
          <Sparkles size={16} style={{ color: 'rgba(255,255,255,0.7)' }} />
          <h1 className="page-title">Chat</h1>
        </div>
      </div>

      {/* AI status + Clear button */}
      <div className="flex items-center justify-center mx-4 my-2 shrink-0 gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            background: 'var(--accent-soft)',
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
          }}
        >
          {state.apiKey
            ? <Zap size={10} className="shrink-0" />
            : <Cpu size={10} className="shrink-0" />}
          {state.apiKey ? 'On-device AI parsing active' : 'Keyword parser active'}
        </span>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all active:scale-95"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444' }}
          title="Clear Chat"
        >
          <Trash2 size={10} />
          Clear
        </button>
      </div>

      {/* Session contribution banner */}
      {sessionContrib != null && (
        <div
          className="rounded-2xl mx-4 mb-2 px-4 py-2.5 shrink-0 flex items-center gap-2"
          style={{ background: 'var(--accent-soft)', border: '1px solid var(--border)' }}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--text-muted)' }} />
          <span className="text-xs font-medium flex-1" style={{ color: 'var(--text-2)' }}>
            Session contribution: {formatRupees(sessionContrib)}
          </span>
          <button
            onClick={() => setSessContrib(null)}
            className="transition-colors leading-none"
            style={{ color: 'var(--text-faint)' }}
            aria-label="Clear contribution"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1" style={{ background: 'var(--bg)' }}>
        {msgs.map((m, i) => <Bubble key={i} msg={m} isFirst={i === 0} dispatch={dispatch} />)}
        {isTyping && <TypingBubble />}
        <div ref={scrollRef} />
      </div>

      {/* Input area */}
      <div
        className="shrink-0"
        style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          padding: '0.75rem 1rem',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
        }}
      >
        <div className="flex items-center gap-2">
          <input
            className="flex-1 rounded-2xl px-4 py-3 text-sm transition-all"
            style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              outline: 'none',
            }}
            placeholder={hintText()}
            value={input}
            disabled={isTyping}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
          />
          <button
            onClick={send}
            disabled={isTyping || !input.trim()}
            className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ msg, isFirst, dispatch }: { msg: Msg; isFirst?: boolean; dispatch: React.Dispatch<any> }) {
  const [saved,     setSaved]     = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const isResult = msg.text.includes('──');

  if (msg.isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[78%] rounded-2xl rounded-br-sm text-sm px-4 py-2.5"
          style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
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

  if (isFirst) {
    return (
      <div className="flex justify-start mb-3">
        <div className="max-w-[82%]">
          <div
            className="rounded-2xl rounded-tl-sm px-4 py-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'var(--accent-soft)', border: '1px solid var(--border)' }}
              >
                <MessageCircle size={12} style={{ color: 'var(--text-2)' }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Yarn Assistant
              </span>
            </div>
            <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
              {msg.text}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  if (isResult) {
    return (
      <>
        <ShareModal text={msg.text} open={shareOpen} onClose={() => setShareOpen(false)} />
        <div className="flex justify-start mb-2">
          <div className="max-w-[82%]">
            <div
              className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <div className="rounded-xl p-3 mt-1" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}>
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                  {msg.text}
                </pre>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 ml-1">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-all active:scale-95"
                style={saved
                  ? { background: 'var(--accent-soft)', border: '1px solid var(--border)', color: 'var(--text)' }
                  : { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }
                }
              >
                {saved ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
                {saved ? 'Saved!' : 'Save'}
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-all active:scale-95"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                <Share2 size={11} />
                Share
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[82%]">
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <pre className="whitespace-pre-wrap break-words font-sans leading-relaxed" style={{ color: 'var(--text)' }}>
            {msg.text}
          </pre>
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start mb-3">
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-2 h-2 rounded-full animate-pulse2"
              style={{ background: 'var(--text-muted)', animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

async function claudeParse(
  input: string,
  apiKey: string,
  history: ConversationMsg[],
): Promise<{ query: ParsedQuery; rawJson: string }> {
  const system = `You are a yarn query parser with conversation memory. Extract structured data from the user's latest message and return ONLY valid JSON.

IMPORTANT — handle typos and abbreviations: map the user's input to the closest canonical yarn_type even if they misspell or abbreviate it.

Canonical yarn_type values (use EXACTLY these strings):
Viscose | Modal | Micro Modal | Excel | Liva Eco | Micro Liva Eco | Anti-Bacterial | Liva Reviva | Eco Vero | Refibra | Tencel STD | Micro EcoVero | Micro Tencel

Typo / alias mapping examples (not exhaustive — use judgment for similar cases):
- vsf, visc, viscos, viscous → Viscose
- mm, micro mod → Micro Modal
- mev, micro eco vera, micro eco varo → Micro EcoVero
- eco vera, eco varo, eco veru, ecovera, ekovero → Eco Vero
- refib, refibre, refibra → Refibra
- tensel, tencil, tensal, tensal → Tencel STD
- reviva, liva revi → Liva Reviva
- ht → High Twist (sub_type)
- ring, compact, cpt → Normal (sub_type)
- knitting, hosiery → knitting (end_use)
- weaving, woven → weaving (end_use)

Conversation memory rules:
- If the user says "same", "it", "that" or omits a previously mentioned yarn type/sub-type, carry it forward from history.
- If only a count is mentioned (e.g. "40s"), keep the previous yarn_type and sub_type.
- If a new yarn type is explicitly mentioned, reset sub_type unless the user specifies one.

Available sub_type: Normal | High Twist | Slub | High Twist Slub | Micro Viscose | Micro Excel | Doubling

Return ONLY this JSON, no other text: {"count":null,"yarn_type":null,"sub_type":null,"end_use":null,"is_doubled":false}`;

  const messages: ConversationMsg[] = [
    ...history.slice(-8),
    { role: 'user', content: input },
  ];

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 150, system, messages }),
  });

  if (!resp.ok) throw new Error(`API error ${resp.status}`);
  const body    = await resp.json() as { content: Array<{ text: string }> };
  const rawJson = body.content[0].text.replace(/```json?\s*|```/g, '').trim();
  const json    = JSON.parse(rawJson) as { count: string | null; yarn_type: string | null; sub_type: string | null; end_use: string | null; is_doubled: boolean };

  const isDoubled = json.is_doubled ?? false;
  return {
    query: {
      countStr: json.count,
      isDoubled,
      yarnType: json.yarn_type,
      subType:  isDoubled ? 'Doubling' : json.sub_type,
      endUse:   json.end_use,
      original: input,
    },
    rawJson,
  };
}
