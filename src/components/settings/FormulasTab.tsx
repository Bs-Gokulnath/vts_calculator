import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Formula, FORMULA_CATEGORIES } from '../../data/formulas';
import Modal from '../ui/Modal';

export default function FormulasTab() {
  const { state, dispatch } = useApp();
  const [editing, setEditing]   = useState<Formula | null>(null);
  const [adding, setAdding]     = useState(false);
  const [deletingId, setDelId]  = useState<string | null>(null);
  const [category, setCategory] = useState('All');

  const usedCats = ['All', ...new Set(state.formulas.map(f => f.category))].sort((a,b) => a === 'All' ? -1 : a.localeCompare(b));
  const filtered = category === 'All' ? state.formulas : state.formulas.filter(f => f.category === category);

  return (
    <div className="h-full flex flex-col">
      {/* Category chips */}
      <div className="flex overflow-x-auto gap-2 px-4 pt-3 pb-2 shrink-0">
        {usedCats.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              category === c ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="px-4 py-1 text-xs text-gray-400 shrink-0">{filtered.length} formula{filtered.length !== 1 ? 's' : ''}</p>

      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
            <p className="text-gray-400">No formulas in this category</p>
          </div>
        ) : filtered.map(f => (
          <div key={f.id} className="card p-4">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">{f.name}</p>
                <span className="badge bg-purple-100 text-purple-700 mt-0.5">{f.category}</span>
              </div>
              <button onClick={() => setEditing(f)} className="p-1 text-primary-500 hover:bg-primary-50 rounded"><Pencil size={13} /></button>
              <button onClick={() => setDelId(f.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={13} /></button>
            </div>
            <div className="mt-3 bg-primary-50 rounded-xl px-3 py-2">
              <p className="font-mono text-sm font-semibold text-primary-900">{f.expression}</p>
            </div>
            {f.description && <p className="text-xs text-gray-400 mt-2">{f.description}</p>}
          </div>
        ))}
      </div>

      <div className="absolute bottom-16 right-4">
        <button className="btn-primary rounded-full px-4 py-2.5 shadow-lg" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add Formula
        </button>
      </div>

      <FormulaForm
        open={adding || editing != null}
        entry={editing}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={f => {
          if (editing) dispatch({ type: 'UPDATE_FORMULA', payload: f });
          else         dispatch({ type: 'ADD_FORMULA', payload: f });
          setAdding(false); setEditing(null);
        }}
      />

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Delete Formula</h3>
            <p className="text-gray-500 text-sm mb-5">Remove "{state.formulas.find(f => f.id === deletingId)?.name}"?</p>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setDelId(null)}>Cancel</button>
              <button className="btn-danger flex-1" onClick={() => { dispatch({ type: 'DELETE_FORMULA', payload: deletingId }); setDelId(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormulaForm({ open, entry, onClose, onSave }: {
  open: boolean; entry: Formula | null; onClose: () => void; onSave: (f: Formula) => void;
}) {
  const [name, setName]     = useState(entry?.name ?? '');
  const [expr, setExpr]     = useState(entry?.expression ?? '');
  const [desc, setDesc]     = useState(entry?.description ?? '');
  const [cat, setCat]       = useState(entry?.category ?? 'General');
  const [errors, setErrors] = useState<Record<string,string>>({});

  function save() {
    const errs: Record<string,string> = {};
    if (!name.trim()) errs.name = 'Required';
    if (!expr.trim()) errs.expr = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ id: entry?.id ?? Date.now().toString(), name: name.trim(), expression: expr.trim(), description: desc.trim(), category: cat });
  }

  return (
    <Modal open={open} onClose={onClose} title={entry ? 'Edit Formula' : 'Add Formula'}>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Formula Name *</label>
          <input className={`input-field ${errors.name ? 'border-red-400' : ''}`} value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Expression *</label>
          <input className={`input-field font-mono ${errors.expr ? 'border-red-400' : ''}`} value={expr} onChange={e => setExpr(e.target.value)} placeholder="GPS × 3 ÷ 1000 × 1632" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select className="select-field" value={cat} onChange={e => setCat(e.target.value)}>
            {FORMULA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
          <textarea className="input-field resize-none" rows={2} value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <button className="btn-primary w-full" onClick={save}>{entry ? 'Save Changes' : 'Add Formula'}</button>
      </div>
    </Modal>
  );
}
