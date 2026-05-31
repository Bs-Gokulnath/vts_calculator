import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  YARN_COUNT_GROUPS, STANDALONE_CATEGORIES, DOUBLING_RATES,
  YarnCountEntry, DoublingRate, YarnCountGroup, YarnCountCategory,
  production,
} from '../../data/yarnCount';
import Modal from '../ui/Modal';

type TopTab = string;

export default function CountsTab() {
  const allGroups     = YARN_COUNT_GROUPS;
  const allStandalone = STANDALONE_CATEGORIES;
  const topTabs: TopTab[] = [...allGroups.map(g => g.name), ...allStandalone.map(c => c.name)];
  const [topTab, setTopTab] = useState<TopTab>(topTabs[0] ?? '');

  const group      = allGroups.find(g => g.name === topTab);
  const standalone = allStandalone.find(c => c.name === topTab);

  return (
    <div className="h-full flex flex-col">
      {/* Production formula chip */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="bg-purple-50 rounded-lg px-3 py-2 text-xs text-purple-700 font-medium">
          ƒ  Production/day/frame = GPS × 3 ÷ 1000 × 1632
        </div>
      </div>

      {/* Top tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-200 shrink-0">
        {topTabs.map(t => (
          <button
            key={t}
            onClick={() => setTopTab(t)}
            className={`shrink-0 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              topTab === t ? 'border-primary-500 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {group      && <GroupContent group={group} />}
        {standalone && <SimpleCountView category={standalone} />}
      </div>
    </div>
  );
}

function GroupContent({ group }: { group: YarnCountGroup }) {
  const subTabs = group.subCategories.map(c => c.name);
  const [subTab, setSubTab] = useState(subTabs[0] ?? '');
  const cat = group.subCategories.find(c => c.name === subTab);

  return (
    <div className="h-full flex flex-col">
      {/* Sub tab bar */}
      <div className="flex overflow-x-auto border-b border-gray-100 shrink-0">
        {subTabs.map(t => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`shrink-0 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
              subTab === t ? 'border-purple-500 text-purple-700' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {cat?.name === 'Doubling' ? (
          <DoublingView />
        ) : cat ? (
          <SimpleCountView category={cat} />
        ) : null}
      </div>
    </div>
  );
}

function SimpleCountView({ category }: { category: YarnCountCategory }) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <CountTable entries={category.entries} />
    </div>
  );
}

function CountTable({ entries }: { entries: YarnCountEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-8">No entries</p>;
  }
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-primary-50/60">
            <th className="px-3 py-2 text-left font-bold text-gray-700">Count</th>
            <th className="px-3 py-2 text-right font-bold text-gray-700">GPS</th>
            <th className="px-3 py-2 text-right font-bold text-gray-700">Prod/day/frame</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => {
            const prod = e.gps != null ? Math.round(e.gps * 3 / 1000 * 1632) : null;
            return (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 font-medium">{e.count}</td>
                <td className="px-3 py-2 text-right text-gray-500">{e.gps != null ? (e.gps % 1 === 0 ? e.gps.toFixed(0) : e.gps.toFixed(1)) : '—'}</td>
                <td className="px-3 py-2 text-right font-semibold text-primary-600">{prod ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DoublingView() {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <div className="badge bg-amber-100 text-amber-800 px-3 py-1.5 flex flex-col items-start">
          <span className="text-[10px] opacity-70">Waste</span>
          <span className="font-bold">0.5%</span>
        </div>
        <div className="badge bg-amber-100 text-amber-800 px-3 py-1.5 flex flex-col items-start">
          <span className="text-[10px] opacity-70">Transport</span>
          <span className="font-bold">₹2</span>
        </div>
        <div className="badge bg-amber-100 text-amber-800 px-3 py-1.5 flex flex-col items-start">
          <span className="text-[10px] opacity-70">TFO Doubling</span>
          <span className="font-bold">₹0.70</span>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-amber-50">
              <th className="px-3 py-2 text-left font-bold text-gray-700">Count</th>
              <th className="px-3 py-2 text-right font-bold text-gray-700">Doubling Rate (₹)</th>
            </tr>
          </thead>
          <tbody>
            {DOUBLING_RATES.map((r, i) => (
              <tr key={r.count} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 font-medium">{r.count}</td>
                <td className="px-3 py-2 text-right font-semibold text-amber-700">₹{r.rate.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
