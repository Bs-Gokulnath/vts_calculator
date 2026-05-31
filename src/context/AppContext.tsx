import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { RawMaterial, defaultMaterials } from '../data/rawMaterials';
import { Formula, defaultFormulas } from '../data/formulas';

export interface QuoteHistory {
  id: string;
  material: string;
  text: string;
  savedAt: string;
}

interface AppState {
  rawMaterials: RawMaterial[];
  contributions: number[];
  history: QuoteHistory[];
  apiKey: string;
  formulas: Formula[];
}

type Action =
  | { type: 'SET_MATERIALS';       payload: RawMaterial[] }
  | { type: 'ADD_MATERIAL';        payload: RawMaterial }
  | { type: 'UPDATE_MATERIAL';     payload: RawMaterial }
  | { type: 'DELETE_MATERIAL';     payload: string }
  | { type: 'SET_CONTRIBUTIONS';   payload: number[] }
  | { type: 'ADD_CONTRIBUTION';    payload: number }
  | { type: 'UPDATE_CONTRIBUTION'; payload: { index: number; value: number } }
  | { type: 'DELETE_CONTRIBUTION'; payload: number }
  | { type: 'ADD_HISTORY';         payload: QuoteHistory }
  | { type: 'DELETE_HISTORY';      payload: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SET_API_KEY';         payload: string }
  | { type: 'SET_FORMULAS';        payload: Formula[] }
  | { type: 'ADD_FORMULA';         payload: Formula }
  | { type: 'UPDATE_FORMULA';      payload: Formula }
  | { type: 'DELETE_FORMULA';      payload: string };

function loadState(): AppState {
  try {
    const raw = localStorage.getItem('yarnCalcState');
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        rawMaterials:  parsed.rawMaterials  ?? defaultMaterials(),
        contributions: parsed.contributions ?? [40000,45000,50000,55000,60000,65000,70000,75000,80000,85000,90000,95000,100000],
        history:       parsed.history       ?? [],
        apiKey:        parsed.apiKey        ?? '',
        formulas:      parsed.formulas      ?? defaultFormulas(),
      };
    }
  } catch { /* ignore */ }
  return {
    rawMaterials:  defaultMaterials(),
    contributions: [40000,45000,50000,55000,60000,65000,70000,75000,80000,85000,90000,95000,100000],
    history:       [],
    apiKey:        '',
    formulas:      defaultFormulas(),
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MATERIALS':     return { ...state, rawMaterials: action.payload };
    case 'ADD_MATERIAL':      return { ...state, rawMaterials: [...state.rawMaterials, action.payload] };
    case 'UPDATE_MATERIAL':   return { ...state, rawMaterials: state.rawMaterials.map(m => m.id === action.payload.id ? action.payload : m) };
    case 'DELETE_MATERIAL':   return { ...state, rawMaterials: state.rawMaterials.filter(m => m.id !== action.payload) };
    case 'SET_CONTRIBUTIONS': return { ...state, contributions: action.payload };
    case 'ADD_CONTRIBUTION': {
      const c = [...state.contributions, action.payload].sort((a,b) => a-b);
      return { ...state, contributions: c };
    }
    case 'UPDATE_CONTRIBUTION': {
      const c = [...state.contributions];
      c[action.payload.index] = action.payload.value;
      c.sort((a,b) => a-b);
      return { ...state, contributions: c };
    }
    case 'DELETE_CONTRIBUTION': {
      const c = [...state.contributions];
      c.splice(action.payload, 1);
      return { ...state, contributions: c };
    }
    case 'ADD_HISTORY':    return { ...state, history: [action.payload, ...state.history] };
    case 'DELETE_HISTORY': return { ...state, history: state.history.filter(h => h.id !== action.payload) };
    case 'CLEAR_HISTORY':  return { ...state, history: [] };
    case 'SET_API_KEY':    return { ...state, apiKey: action.payload };
    case 'SET_FORMULAS':   return { ...state, formulas: action.payload };
    case 'ADD_FORMULA':    return { ...state, formulas: [...state.formulas, action.payload] };
    case 'UPDATE_FORMULA': return { ...state, formulas: state.formulas.map(f => f.id === action.payload.id ? action.payload : f) };
    case 'DELETE_FORMULA': return { ...state, formulas: state.formulas.filter(f => f.id !== action.payload) };
    default: return state;
  }
}

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    localStorage.setItem('yarnCalcState', JSON.stringify(state));
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
