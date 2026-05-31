import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatRupees } from '../../utils/format';
import Modal from '../ui/Modal';

export default function ContributionsTab() {
  const { state, dispatch } = useApp();
  const [editing, setEditing]   = useState<{ index: number; value: number } | null>(null);
  const [adding, setAdding]     = useState(false);
  const [deletingIdx, setDelIdx] = useState<number | null>(null);

  if (state.contributions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
        <p className="text-gray-400 text-4xl">💰</p>
        <p className="text-gray-500 font-medium">No contributions yet</p>
        <button className="btn-primary" onClick={() => setAdding(true)}><Plus size={16} /> Add Contribution</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <p className="text-xs text-gray-400 mb-3">{state.contributions.length} contribution{state.contributions.length !== 1 ? 's' : ''}</p>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-50">
                <th className="px-4 py-2 text-left text-xs font-bold text-primary-800">#</th>
                <th className="px-4 py-2 text-left text-xs font-bold text-primary-800">Amount</th>
                <th className="px-4 py-2 text-xs font-bold text-primary-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.contributions.map((amt, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-2.5 font-semibold">{formatRupees(amt)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => setEditing({ index: i, value: amt })} className="p-1 text-primary-500 hover:bg-primary-50 rounded"><Pencil size={13} /></button>
                      <button onClick={() => setDelIdx(i)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="absolute bottom-16 right-4">
        <button className="btn-primary rounded-full px-4 py-2.5 shadow-lg" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add Contribution
        </button>
      </div>

      <ContribForm
        open={adding || editing != null}
        initial={editing?.value}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={v => {
          if (editing != null) dispatch({ type: 'UPDATE_CONTRIBUTION', payload: { index: editing.index, value: v } });
          else                 dispatch({ type: 'ADD_CONTRIBUTION', payload: v });
          setAdding(false); setEditing(null);
        }}
      />

      {deletingIdx != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-gray-900 mb-2">Delete Contribution</h3>
            <p className="text-gray-500 text-sm mb-5">Remove {formatRupees(state.contributions[deletingIdx])} from the list?</p>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setDelIdx(null)}>Cancel</button>
              <button className="btn-danger flex-1" onClick={() => { dispatch({ type: 'DELETE_CONTRIBUTION', payload: deletingIdx }); setDelIdx(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContribForm({ open, initial, onClose, onSave }: {
  open: boolean; initial?: number; onClose: () => void; onSave: (v: number) => void;
}) {
  const [value, setValue] = useState(initial?.toFixed(2) ?? '');
  const [error, setError] = useState('');

  function save() {
    const v = parseFloat(value.replace(/,/g, ''));
    if (isNaN(v) || v <= 0) { setError('Enter a positive amount'); return; }
    onSave(v); setValue(''); setError('');
  }

  return (
    <Modal open={open} onClose={onClose} title={initial != null ? 'Edit Contribution' : 'Add Contribution'}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Amount (₹)</label>
          <input
            type="number"
            className={`input-field ${error ? 'border-red-400' : ''}`}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="50000"
            inputMode="decimal"
            autoFocus
          />
          {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </div>
        <button className="btn-primary w-full" onClick={save}>
          {initial != null ? 'Save Changes' : 'Add'}
        </button>
      </div>
    </Modal>
  );
}
