import { createStore } from './store.js';
import { IS_DEV } from './config.js';
import { renderHeroStatic, renderHero } from './render/hero.js';
import { mountRoute, renderRoute } from './render/route.js';
import { mountItinerary, renderItinerary } from './render/itinerary.js';
import { mountBudget, renderBudget } from './render/budget.js';
import { mountChecklist, renderChecklist } from './render/checklist.js';
import { mountSources } from './render/sources.js';
import { mountTheme } from './chrome/theme.js';
import { mountClock, mountProgress, mountRail, mountReveal } from './chrome/status.js';
import { mountShortcuts } from './chrome/shortcuts.js';
import { mountDev } from './dev.js';

const store = createStore();

renderHeroStatic();
mountRoute(store);
mountItinerary();
mountBudget(store);
mountChecklist(store);
mountSources();

store.subscribe((state) => {
  renderRoute(state);
  renderHero(state);
  renderItinerary(state);
  renderBudget(state);
  renderChecklist(state);
});

mountTheme(store);
mountClock();
mountProgress();
mountRail();
mountReveal();

const dev = mountDev(store);
mountShortcuts(store, { onDev: dev.toggle });
if (IS_DEV) dev.toggle();
