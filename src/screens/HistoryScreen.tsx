import { useState } from 'react';
import { Trash2, Share2, Bookmark, ArrowRight } from 'lucide-react';
import { useApp, QuoteHistory } from '../context/AppContext';
import { formatDate } from '../utils/format';
import ShareModal from '../components/ui/ShareModal';

export default function HistoryScreen() {
  const { state, dispatch } = useApp();
  const [confirming, setConfirming] = useState(false);

  if (state.history.length === 0) {
    return (
      <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
        <header className="page-header shrink-0">
          <div className="flex items-center justify-center gap-2">
            <Bookmark size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
            <h1 className="text-lg font-bold text-white">Saved Quotes</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)' }}
          >
            <Bookmark size={40} style={{ color: 'var(--text-faint)' }} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <p className="font-bold text-lg" style={{ color: 'var(--text)' }}>No saved quotes yet</p>
            <p className="text-sm leading-relaxed max-w-[220px] mx-auto" style={{ color: 'var(--text-muted)' }}>
              Save quotes from the Calculator or Chat to find them here
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
            <span>Go to Calculator</span>
            <ArrowRight size={15} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      <header className="page-header shrink-0 relative flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Bookmark size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
          <h1 className="text-lg font-bold text-white">Saved Quotes</h1>
          <span
            className="ml-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
          >
            {state.history.length}
          </span>
        </div>
        <button
          onClick={() => setConfirming(true)}
          className="absolute right-4 p-2 rounded-xl transition-all active:scale-90"
          style={{ color: 'rgba(255,255,255,0.7)' }}
          title="Clear all"
        >
          <Trash2 size={18} />
        </button>
      </header>

      <div
        className="flex-1 overflow-y-auto p-3 space-y-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
      >
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
            <div
              className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4"
              style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h3 className="font-bold text-center text-base mb-1.5" style={{ color: 'var(--text)' }}>
              Clear All Quotes?
            </h3>
            <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              This will permanently remove all{' '}
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{state.history.length}</span>{' '}
              saved quote{state.history.length !== 1 ? 's' : ''}. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setConfirming(false)}>Cancel</button>
              <button
                className="btn-danger flex-1"
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

function HistoryCard({ item, index, onDelete }: {
  item: QuoteHistory;
  index: number;
  onDelete: () => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <ShareModal text={item.text} open={shareOpen} onClose={() => setShareOpen(false)} />
      <div
        className="card overflow-hidden animate-in"
        style={{ borderLeft: '3px solid var(--accent)', animationDelay: `${index * 40}ms` }}
      >
        <div className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-center gap-2">
            <p className="flex-1 font-bold text-sm truncate" style={{ color: 'var(--text)' }}>
              {item.material}
            </p>
            <span
              className="shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {formatDate(new Date(item.savedAt))}
            </span>
          </div>

          {/* Code window */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ background: 'var(--bg-raised)', borderBottom: '1px solid var(--border)' }}
            >
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <span className="text-xs font-medium ml-1 tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Quote
              </span>
            </div>
            <pre
              className="font-mono text-xs p-3 whitespace-pre-wrap leading-relaxed"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-2)' }}
            >
              {item.text}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
              style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
            >
              <Share2 size={12} />
              Share
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
              style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
