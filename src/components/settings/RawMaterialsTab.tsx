import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RawMaterial, exMillIncTransport, cleanFibrePrice } from '../../data/rawMaterials';
import Modal from '../ui/Modal';

export default function RawMaterialsTab() {
  const { state, dispatch } = useApp();
  const [editing, setEditing]       = useState<RawMaterial | null>(null);
  const [adding, setAdding]         = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const grasim = state.rawMaterials.filter(m => m.supplier === 'Grasim');
  const lenzing = state.rawMaterials.filter(m => m.supplier === 'Lenzing');
  const others  = state.rawMaterials.filter(m => m.supplier !== 'Grasim' && m.supplier !== 'Lenzing');

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-24">
        {[
          { label: 'Grasim',  items: grasim  },
          { label: 'Lenzing', items: lenzing },
          { label: 'Other',   items: others  },
        ].filter(g => g.items.length > 0).map(({ label, items }) => (
          <div key={label}>
            {/* Section header: pill badge-brand with supplier name + count */}
            <div className="flex items-center gap-2 mb-2.5">
              <span className="badge-brand text-sm px-3 py-1">{label}</span>
              <span className="text-xs text-gray-400 font-medium">{items.length} material{items.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <table className="data-table min-w-[520px]">
                <thead>
                  <tr>
                    {['Material', 'Ex-Mill', 'Transport', 'Inc. Trans', 'Waste %', 'Clean Fibre', ''].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(m => (
                    <tr key={m.id}>
                      <td className="font-medium whitespace-nowrap">{m.name}</td>
                      <td className="text-right">₹{m.exMillRate.toFixed(2)}</td>
                      <td className="text-right">{m.transport > 0 ? `₹${m.transport.toFixed(2)}` : '—'}</td>
                      <td className="text-right">₹{exMillIncTransport(m).toFixed(2)}</td>
                      <td className="text-right">{m.wastePercent.toFixed(0)}%</td>
                      {/* Clean Fibre column: text-brand-600 font-bold */}
                      <td className="text-right font-bold text-brand-600">₹{cleanFibrePrice(m).toFixed(2)}</td>
                      <td>
                        <div className="flex gap-1">
                          {/* Action buttons: btn-icon with icons */}
                          <button
                            onClick={() => setEditing(m)}
                            className="btn-icon text-brand-500 hover:bg-brand-50"
                            aria-label="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingId(m.id)}
                            className="btn-icon text-red-400 hover:bg-red-50"
                            aria-label="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB: btn-primary, rounded-2xl, fixed bottom-20 right-4 */}
      <button
        className="btn-primary rounded-2xl fixed bottom-20 right-4 shadow-lg px-4 py-2.5 z-40"
        onClick={() => setAdding(true)}
      >
        <Plus size={16} />
        Add Material
      </button>

      <MaterialForm
        open={adding || editing != null}
        entry={editing}
        onClose={() => { setAdding(false); setEditing(null); }}
        onSave={m => {
          if (editing) dispatch({ type: 'UPDATE_MATERIAL', payload: m });
          else         dispatch({ type: 'ADD_MATERIAL', payload: m });
          setAdding(false); setEditing(null);
        }}
      />

      {/* Delete confirm: dialog-overlay + dialog-panel with red trash icon centered */}
      {deletingId && (
        <div className="dialog-overlay" onClick={() => setDeletingId(null)}>
          <div className="dialog-panel sm:max-w-xs" onClick={e => e.stopPropagation()}>
            {/* Centered red trash icon */}
            <div className="flex flex-col items-center mb-4">
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-3">
                <Trash2 size={28} className="text-red-500" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">Delete Material</h3>
              <p className="text-gray-500 text-sm mt-1 text-center">
                Remove "{state.rawMaterials.find(m => m.id === deletingId)?.name}"? This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setDeletingId(null)}>Cancel</button>
              <button
                className="btn-danger flex-1"
                onClick={() => {
                  dispatch({ type: 'DELETE_MATERIAL', payload: deletingId });
                  setDeletingId(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialForm({ open, entry, onClose, onSave }: {
  open: boolean; entry: RawMaterial | null; onClose: () => void; onSave: (m: RawMaterial) => void;
}) {
  const [name, setName]         = useState(entry?.name ?? '');
  const [supplier, setSupplier] = useState(entry?.supplier ?? '');
  const [exMill, setExMill]     = useState(entry?.exMillRate.toString() ?? '');
  const [transport, setTrans]   = useState(entry?.transport.toString() ?? '0');
  const [waste, setWaste]       = useState(entry?.wastePercent.toString() ?? '5');
  const [errors, setErrors]     = useState<Record<string, string>>({});

  // sync when entry changes
  useState(() => {
    setName(entry?.name ?? ''); setSupplier(entry?.supplier ?? '');
    setExMill(entry?.exMillRate.toString() ?? ''); setTrans(entry?.transport.toString() ?? '0');
    setWaste(entry?.wastePercent.toString() ?? '5');
  });

  const inc   = (parseFloat(exMill) || 0) + (parseFloat(transport) || 0);
  const clean = inc * (1 + (parseFloat(waste) || 0) / 100);

  function save() {
    const errs: Record<string, string> = {};
    if (!name.trim())        errs.name     = 'Required';
    if (!supplier.trim())    errs.supplier = 'Required';
    if (!parseFloat(exMill)) errs.exMill   = 'Required';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({
      id: entry?.id ?? Date.now().toString(),
      name: name.trim(), supplier: supplier.trim(),
      exMillRate: parseFloat(exMill), transport: parseFloat(transport) || 0,
      wastePercent: parseFloat(waste) || 5,
    });
  }

  if (!open) return null;

  return (
    /* Form modal: dialog-overlay + dialog-panel */
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-panel sm:max-w-md" onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-bold text-ink mb-4">
          {entry ? 'Edit Material' : 'Add Material'}
        </h2>

        {/* Better field layout */}
        <div className="space-y-3">
          {/* Row 1: Name + Supplier */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Material Name *</label>
              <input
                className={`input-field ${errors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Viscose"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="label">Supplier *</label>
              <input
                className={`input-field ${errors.supplier ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                placeholder="Grasim"
              />
              {errors.supplier && <p className="text-xs text-red-500 mt-1">{errors.supplier}</p>}
            </div>
          </div>

          {/* Row 2: Ex-Mill + Transport + Waste */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Ex-Mill (₹) *</label>
              <input
                type="number"
                className={`input-field ${errors.exMill ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                value={exMill}
                onChange={e => setExMill(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
              {errors.exMill && <p className="text-xs text-red-500 mt-1">{errors.exMill}</p>}
            </div>
            <div>
              <label className="label">Transport (₹)</label>
              <input
                type="number"
                className="input-field"
                value={transport}
                onChange={e => setTrans(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Waste %</label>
              <input
                type="number"
                className="input-field"
                value={waste}
                onChange={e => setWaste(e.target.value)}
                inputMode="decimal"
                placeholder="5"
              />
            </div>
          </div>

          {/* Preview box: card-brand with two columns */}
          <div className="card-brand p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-600 mb-3">Price Preview</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-brand-500/70 mb-0.5">Inc. Transport</p>
                <p className="text-xl font-black text-brand-900">₹{inc.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-brand-500/70 mb-0.5">Clean Fibre Price</p>
                <p className="text-xl font-black text-brand-900">₹{clean.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-1" onClick={save}>
              {entry ? 'Save Changes' : 'Add Material'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
