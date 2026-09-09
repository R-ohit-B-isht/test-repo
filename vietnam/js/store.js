import { DEFAULT_STATE, STORAGE_KEY } from './config.js';

// Observer pattern: one state object, subscribers re-render on every change.
// Persists to localStorage so a refresh keeps your route and sliders, and every
// page (or tab) of the site reads the same plan — a change in one tab repaints
// the others through the `storage` event.

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return structuredClone(DEFAULT_STATE);
    return { ...structuredClone(DEFAULT_STATE), ...saved, picks: { ...DEFAULT_STATE.picks, ...(saved.picks || {}) } };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
};

export function createStore() {
  let state = load();
  const subs = new Set();

  const emit = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    subs.forEach((fn) => fn(state));
  };
  addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || e.newValue === JSON.stringify(state)) return;
    state = load();
    subs.forEach((fn) => fn(state));
  });

  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
      emit();
    },
    togglePick(id) {
      this.set((s) => ({ picks: { ...s.picks, [id]: !s.picks[id] } }));
    },
    setPicks(picks) {
      const off = Object.fromEntries(Object.keys(DEFAULT_STATE.picks).map((id) => [id, false]));
      this.set({ picks: { ...off, ...picks } });
    },
    // Hearts: one flag per activity per person (votes.js).
    toggleHeart(id, pid) {
      this.set((s) => {
        const mine = { ...(s.hearts[id] || {}) };
        if (mine[pid]) delete mine[pid]; else mine[pid] = true;
        return { hearts: { ...s.hearts, [id]: mine } };
      });
    },
    toggleCheck(id) {
      this.set((s) => ({ checklist: { ...s.checklist, [id]: !s.checklist[id] } }));
    },
    // Countdown ritual (ritual.js): tick today's task. Booking steps tick the
    // checklist, micro tasks land in ritual.done; either way today joins the streak.
    tickRitual(id, isStep, iso) {
      this.set((s) => {
        const r = s.ritual || {};
        const dates = (r.dates || []).includes(iso) ? r.dates : [...(r.dates || []), iso];
        const done = isStep || (r.done || []).includes(id) ? (r.done || []) : [...(r.done || []), id];
        return {
          ritual: { ...r, dates, done },
          ...(isStep ? { checklist: { ...s.checklist, [id]: true } } : {}),
        };
      });
    },
    // Manager records: one per slot id. A slot marked booked / done also ticks
    // its checklist step, so the Book page and the Manager never disagree.
    setVault(id, patch) {
      this.set((s) => {
        const rec = { ...(s.vault[id] || {}), ...patch };
        const checklist = 'status' in patch ? { ...s.checklist, [id]: patch.status !== 'todo' } : s.checklist;
        return { vault: { ...s.vault, [id]: rec }, checklist };
      });
    },
    addSlot(slot) {
      this.set((s) => ({ vaultCustom: [...s.vaultCustom, slot] }));
    },
    // Custom calendar events. Removal is a soft delete (`deleted: true`), so an
    // undo is one flag away and Google sync can clean up the pushed copy.
    addEvent(ev) {
      this.set((s) => ({ events: [...s.events, ev] }));
    },
    setEvent(id, patch) {
      this.set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }));
    },
    // Split ledger: people and expenses. Same rule — nothing is ever spliced
    // out, removal sets `deleted` so the row can come back with one tap.
    addPerson(p) {
      this.set((s) => ({ people: [...s.people, p], me: s.me || (p.me ? p.id : null) }));
    },
    setPerson(id, patch) {
      this.set((s) => ({ people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    },
    setMe(id) {
      this.set((s) => ({ me: id, people: s.people.map((p) => ({ ...p, me: p.id === id })) }));
    },
    addExpense(x) {
      this.set((s) => ({ expenses: [...s.expenses, x] }));
    },
    setExpense(id, patch) {
      this.set((s) => ({ expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...patch, updated: Date.now() } : x)) }));
    },
    // Custom picks (Gemini-added or saved from a link) live beside the catalog.
    addCustom(x) {
      const { deleted, ...clean } = x;
      this.set((s) => ({ custom: [...(s.custom || []).filter((c) => c.id !== x.id), clean], picks: { ...s.picks, [x.id]: true } }));
    },
    dropCustom(id) {
      this.set((s) => {
        const picks = { ...s.picks };
        delete picks[id];
        return { custom: (s.custom || []).map((c) => (c.id === id ? { ...c, deleted: true } : c)), picks };
      });
    },
    // Links you saved (importer.js); removed ones are flagged, not erased.
    addImport(rec) {
      this.set((s) => ({ imports: [...(s.imports || []), rec] }));
    },
    setImport(id, patch) {
      this.set((s) => ({ imports: (s.imports || []).map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    },
    // GPS trail (trail.js). Pins are private and soft-deleted; `setPin` flips
    // `deleted` both ways so the toast's Undo is a one-liner.
    addPin(p) {
      this.set((s) => ({ trail: [...(s.trail || []), p] }));
    },
    setPin(id, patch) {
      this.set((s) => ({ trail: (s.trail || []).map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    },
    // Journal photos (journal.js): metadata only, bytes live in IndexedDB.
    addPhotos(metas) {
      this.set((s) => ({ photos: [...(s.photos || []), ...metas] }));
    },
    setPhoto(id, patch) {
      this.set((s) => ({ photos: (s.photos || []).map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    },
    reset() {
      state = structuredClone(DEFAULT_STATE);
      emit();
    },
    subscribe(fn) {
      subs.add(fn);
      fn(state);
      return () => subs.delete(fn);
    },
  };
}
