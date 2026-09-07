import { createStore } from './store.js';
import { mountHero, renderHero } from './render/hero.js';
import { mountRoute, renderRoute } from './render/route.js';
import { mountItinerary, renderItinerary } from './render/itinerary.js';
import { mountPicker, renderPicker } from './render/picker.js';
import { mountBudget, renderBudget } from './render/budget.js';
import { mountChecklist, renderChecklist } from './render/checklist.js';
import { renderSources } from './render/sources.js';
import { mountTheme } from './chrome/theme.js';
import { mountScroll } from './chrome/scroll.js';
import { mountKeys } from './chrome/keys.js';
import { mountDev } from './dev.js';

// Bootstrap: mount once (static markup + listeners), then every renderer
// subscribes to the store (Observer) and repaints from state.

const store = createStore();

mountHero(store);
mountRoute(store);
mountItinerary(store);
mountPicker(store);
mountBudget(store);
mountChecklist(store);
renderSources();

store.subscribe((state) => {
  renderHero(state);
  renderRoute(state);
  renderItinerary(state);
  renderPicker(state);
  renderBudget(state);
  renderChecklist(state);
});

mountTheme(store);
mountScroll();
mountKeys(store, { toggleDev: mountDev(store) });

window.__planner = store;
