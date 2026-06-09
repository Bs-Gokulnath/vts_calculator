import { useState } from 'react';
import { Package, List, PiggyBank, FunctionSquare, Sparkles } from 'lucide-react';
import RawMaterialsTab from '../components/settings/RawMaterialsTab';
import CountsTab from '../components/settings/CountsTab';
import ContributionsTab from '../components/settings/ContributionsTab';
import FormulasTab from '../components/settings/FormulasTab';
import AiSettingsTab from '../components/settings/AiSettingsTab';

const TABS = [
  { id: 'materials',     label: 'Raw Materials', Icon: Package        },
  { id: 'counts',        label: 'Counts',        Icon: List           },
  { id: 'contributions', label: 'Contributions', Icon: PiggyBank      },
  { id: 'formulas',      label: 'Formulas',      Icon: FunctionSquare },
  { id: 'ai',            label: 'AI',            Icon: Sparkles       },
] as const;
type TabId = typeof TABS[number]['id'];

export default function SettingsScreen() {
  const [tab, setTab] = useState<TabId>('materials');

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="page-header shrink-0">
        <h1 className="page-title text-center">Settings</h1>
      </header>

      {/* Tab bar */}
      <div
        className="flex overflow-x-auto shrink-0 px-2 py-1.5 gap-1"
        style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
      >
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap shrink-0 rounded-xl transition-all"
            style={tab === id
              ? { background: 'var(--accent)', color: 'var(--accent-fg)', fontWeight: 600 }
              : { background: 'transparent', color: 'var(--text-muted)' }
            }
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'materials'     && <RawMaterialsTab />}
        {tab === 'counts'        && <CountsTab />}
        {tab === 'contributions' && <ContributionsTab />}
        {tab === 'formulas'      && <FormulasTab />}
        {tab === 'ai'            && <AiSettingsTab />}
      </div>
    </div>
  );
}
