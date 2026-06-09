import { useState } from 'react';
import { Calculator, MessageCircle, Bookmark, Settings, Sun, Moon } from 'lucide-react';
import CalculatorScreen from './screens/CalculatorScreen';
import ChatScreen from './screens/ChatScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import { useTheme } from './context/ThemeContext';

const TABS = [
  { id: 'calc',     label: 'Calculator', Icon: Calculator    },
  { id: 'chat',     label: 'Chat',       Icon: MessageCircle },
  { id: 'history',  label: 'Saved',      Icon: Bookmark      },
  { id: 'settings', label: 'Settings',   Icon: Settings      },
] as const;

type TabId = typeof TABS[number]['id'];

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [tab, setTab] = useState<TabId>('calc');

  return (
    <div className="flex flex-col h-[100dvh] max-w-lg mx-auto" style={{ background: 'var(--bg)' }}>

      <div className="flex-1 overflow-hidden" style={{ background: 'var(--bg)' }}>
        {tab === 'calc'     && <CalculatorScreen />}
        {tab === 'chat'     && <ChatScreen />}
        {tab === 'history'  && <HistoryScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </div>

      {/* Bottom nav — 4 tabs + theme toggle */}
      <nav className="nav-bar shrink-0">
        <div className="flex h-[60px]">
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all duration-200"
              >
                {active && (
                  <span
                    className="absolute top-2 inset-x-2 h-8 rounded-xl -z-0 transition-all"
                    style={{ background: 'var(--accent-soft)' }}
                  />
                )}
                <span className="relative z-10">
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.3 : 1.7}
                    style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}
                  />
                </span>
                <span
                  className="relative z-10 text-[10px] font-semibold"
                  style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}
                >
                  {label}
                </span>
              </button>
            );
          })}

          <div className="w-px my-3 shrink-0" style={{ background: 'var(--border)' }} />
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-12 flex flex-col items-center justify-center gap-0.5 shrink-0 transition-all active:scale-90"
          >
            {theme === 'dark'
              ? <Sun  size={20} strokeWidth={1.7} style={{ color: 'var(--text-muted)' }} />
              : <Moon size={20} strokeWidth={1.7} style={{ color: 'var(--text-muted)' }} />
            }
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}
