import { useState } from 'react';
import { Eye, EyeOff, Save, Trash2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function AiSettingsTab() {
  const { state, dispatch } = useApp();
  const [key, setKey]         = useState(state.apiKey);
  const [obscure, setObscure] = useState(true);
  const [saved, setSaved]     = useState(false);

  const hasKey = key.trim().length > 0;

  function save() {
    dispatch({ type: 'SET_API_KEY', payload: key.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function clear() {
    setKey('');
    dispatch({ type: 'SET_API_KEY', payload: '' });
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-brand-600" />
          <p className="font-bold text-gray-900 flex-1">AI Parser</p>
          <span className={`badge ${hasKey ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-500'} font-semibold`}>
            {hasKey ? 'Active' : 'Off'}
          </span>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed">
          When active, the Chat screen uses Claude Haiku to understand any phrasing — typos, aliases, varied word order. Falls back to the local parser if the API is unavailable.
        </p>

        <div>
          <label className="label">API Key</label>
          <div className="relative">
            <input
              type={obscure ? 'password' : 'text'}
              className="input-field pr-10"
              placeholder="sk-ant-…"
              value={key}
              onChange={e => setKey(e.target.value)}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setObscure(o => !o)}
            >
              {obscure ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={save}>
            <Save size={15} /> {saved ? 'Saved!' : 'Save Key'}
          </button>
          {hasKey && (
            <button className="btn-outline text-red-500 border-red-200" onClick={clear}>
              <Trash2 size={15} /> Remove
            </button>
          )}
        </div>
      </div>

      <div className="card p-4 space-y-2 bg-gray-50 border-0">
        <p className="label">Cost Estimate</p>
        <ul className="text-sm text-gray-500 space-y-1 leading-relaxed">
          <li>• Model: Claude Haiku 4.5 (fastest &amp; cheapest)</li>
          <li>• ~500 tokens per query</li>
          <li>• 100 queries/day ≈ ₹3/day</li>
          <li>• Get your key: console.anthropic.com</li>
        </ul>
      </div>
    </div>
  );
}
