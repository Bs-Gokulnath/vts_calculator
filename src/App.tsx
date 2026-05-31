import { useState } from 'react';
import { Calculator, MessageCircle, Bookmark, Settings } from 'lucide-react';
import CalculatorScreen from './screens/CalculatorScreen';
import ChatScreen from './screens/ChatScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';
import SignInScreen from './screens/SignInScreen';
import { useAuth } from './context/AuthContext';

const TABS = [
  { id: 'calc',     label: 'Calculator', Icon: Calculator    },
  { id: 'chat',     label: 'Chat',       Icon: MessageCircle },
  { id: 'history',  label: 'Saved',      Icon: Bookmark      },
  { id: 'settings', label: 'Settings',   Icon: Settings      },
] as const;

type TabId = typeof TABS[number]['id'];

export default function App() {
  const { isLoggedIn } = useAuth();
  const [tab, setTab]  = useState<TabId>('calc');

  if (!isLoggedIn) return <SignInScreen />;

  return (
    <div className="flex flex-col h-[100dvh] max-w-lg mx-auto">
      <div className="flex-1 overflow-hidden bg-surface-page">
        {tab === 'calc'     && <CalculatorScreen />}
        {tab === 'chat'     && <ChatScreen />}
        {tab === 'history'  && <HistoryScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </div>

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
                  <span className="absolute top-2 inset-x-3 h-8 rounded-xl bg-brand-50 -z-0 transition-all" />
                )}
                <span className="relative z-10 transition-all duration-200">
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.3 : 1.7}
                    className={active ? 'text-brand-600' : 'text-gray-400'}
                  />
                </span>
                <span className={
                  'relative z-10 text-[10px] font-semibold transition-all duration-200 ' +
                  (active ? 'text-brand-600' : 'text-gray-400')
                }>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
