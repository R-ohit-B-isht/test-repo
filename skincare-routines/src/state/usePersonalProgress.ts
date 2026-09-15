import { useEffect, useState } from 'react';

const STORAGE_KEY = 'skin-ledger:personal-progress:v1';
type Progress = Record<string, string[]>;

function readProgress(): { progress: Progress; error: string | null } {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid progress');
    const progress: Progress = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value) && value.every((id: unknown) => typeof id === 'string')) progress[key] = value;
    }
    return { progress, error: null };
  } catch {
    return { progress: {}, error: 'Saved checks could not be read. New checks will still work for this visit.' };
  }
}

export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function weekDates(today: Date) {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (today.getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
}

export function usePersonalProgress() {
  const [state, setState] = useState(readProgress);
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setToday((previous) => {
      const next = new Date();
      return localDate(previous) === localDate(next) ? previous : next;
    }), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  function update(key: string, ids: string[]) {
    const progress = Object.fromEntries(Object.entries({ ...state.progress, [key]: ids }).sort(([a], [b]) => b.localeCompare(a)).slice(0, 28));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setState({ progress, error: null });
    } catch {
      setState({ progress, error: 'Your browser could not save these checks. They will last for this visit only.' });
    }
  }
  return { ...state, today, update };
}
