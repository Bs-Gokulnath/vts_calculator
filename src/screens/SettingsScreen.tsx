import { useState } from 'react';
import { Package, List, PiggyBank, FunctionSquare, Sparkles, UserCircle } from 'lucide-react';
import RawMaterialsTab from '../components/settings/RawMaterialsTab';
import CountsTab from '../components/settings/CountsTab';
import ContributionsTab from '../components/settings/ContributionsTab';
import FormulasTab from '../components/settings/FormulasTab';
import AiSettingsTab from '../components/settings/AiSettingsTab';
import AccountTab from '../components/settings/AccountTab';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'materials',     label: 'Raw Materials', Icon: Package         },
  { id: 'counts',        label: 'Counts',        Icon: List            },
  { id: 'contributions', label: 'Contributions', Icon: PiggyBank       },
  { id: 'formulas',      label: 'Formulas',      Icon: FunctionSquare  },
  { id: 'ai',            label: 'AI',            Icon: Sparkles        },
  { id: 'account',       label: 'Account',       Icon: UserCircle      },
] as const;
type TabId = typeof TABS[number]['id'];

export default function SettingsScreen() {
  const { user }      = useAuth();
  const [tab, setTab] = useState<TabId>('materials');

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="page-header shrink-0 flex items-center justify-between">
        <h1 className="page-title text-lg font-bold">Settings</h1>
        {/* User avatar chip */}
        <div
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium max-w-[160px]"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
        >
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0"
            style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}
          >
            {initials}
          </span>
          <span className="truncate">{user?.name ?? ''}</span>
        </div>
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
        {tab === 'account'       && <AccountTab />}
      </div>
    </div>
  );
}
