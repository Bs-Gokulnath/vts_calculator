import { useState } from 'react';
import { Trash2, Share2, Bookmark, ArrowRight } from 'lucide-react';
import { useApp, QuoteHistory } from '../context/AppContext';
import { formatDate, shareText } from '../utils/format';

export default function HistoryScreen() {
  const { state, dispatch } = useApp();
  const [confirming, setConfirming] = useState(false);

  if (state.history.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <header className="page-header shrink-0">
          <div className="flex items-center justify-center gap-2">
            <Bookmark size={20} className="text-white/80" />
            <h1 className="text-lg font-bold text-white">Saved Quotes</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand-100 via-brand-200 to-brand-300 flex items-center justify-center shadow-lg shadow-brand-200/60">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/70 to-brand-100/80 flex items-center justify-center backdrop-blur-sm">
                <Bookmark size={44} className="text-brand-400" strokeWidth={1.5} />
              </div>
            </div>
            <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-brand-100/30 to-transparent blur-md -z-10" />
          </div>

          <div className="space-y-2.5">
            <p className="text-gray-800 font-bold text-lg tracking-tight">No saved quotes yet</p>
            <p className="text-gray-400 text-sm leading-relaxed max-w-[220px] mx-auto">
              Share quotes from the Calculator or Chat to save them here
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 text-brand-500 text-sm font-semibold mt-1 group">
            <span>Go to Calculator</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="page-header shrink-0">
        <div className="flex-1 flex items-center justify-center gap-2">
          <Bookmark size={18} className="text-white/80" />
          <h1 className="text-lg font-bold text-white">Saved Quotes</h1>
          <span className="ml-1 bg-white/25 text-white text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ring-white/20">
            {state.history.length}
          </span>
        </div>
        <button
          onClick={() => setConfirming(true)}
          className="absolute right-4 p-2 text-white/70 hover:text-white hover:bg-white/15 rounded-xl transition-colors"
          title="Clear all"
        >
          <Trash2 size={18} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
        {state.history.map((h, i) => (
          <HistoryCard
            key={h.id}
            item={h}
            index={i}
            onDelete={() => dispatch({ type: 'DELETE_HISTORY', payload: h.id })}
          />
        ))}
      </div>

      {confirming && (
        <div className="dialog-overlay">
          <div className="dialog-panel">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-red-50 to-red-100 ring-1 ring-red-200 mx-auto mb-4 shadow-sm">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-center text-base mb-1.5">Clear All Quotes?</h3>
            <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
              This will permanently remove all{' '}
              <span className="font-semibold text-gray-700">{state.history.length}</span> saved quote{state.history.length !== 1 ? 's' : ''}.
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                className="btn-outline flex-1 py-2.5"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </button>
              <button
                className="btn-danger flex-1 py-2.5"
                onClick={() => { dispatch({ type: 'CLEAR_HISTORY' }); setConfirming(false); }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryCard({
  item,
  index,
  onDelete,
}: {
  item: QuoteHistory;
  index: number;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    await shareText(item.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = formatDate(new Date(item.savedAt));

  return (
    <div
      className="card border-l-4 border-brand-400 p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center gap-2">
          <p className="flex-1 font-bold text-gray-900 text-sm truncate">
            {item.material}
          </p>
          <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-500 text-xs font-semibold ring-1 ring-brand-100">
            {formattedDate}
          </span>
        </div>

        {/* macOS-style code window */}
        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/80 border-b border-gray-200">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-gray-400 font-medium ml-1 tracking-wide">Quote</span>
          </div>
          <pre className="font-mono text-xs bg-gray-50 p-3 rounded-b-xl text-gray-600 whitespace-pre-wrap leading-relaxed">
            {item.text}
          </pre>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-500 text-white hover:bg-brand-600 active:scale-95 text-xs font-semibold transition-all shadow-sm shadow-brand-200"
            title="Share"
          >
            <Share2 size={12} />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 text-xs font-semibold transition-all ring-1 ring-red-100"
            title="Delete"
          >
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
