import { createStore } from './store.js';
import { IS_DEV } from './config.js';
import { iconSprite } from './icons.js';
import { $ } from './dom.js';
import { renderHero } from './render/hero.js';
import { mountRoute, renderRoute, nextStrategy } from './render/route.js';
import { renderItinerary } from './render/itinerary.js';
import { mountBudget, renderBudget } from './render/budget.js';
import { mountChecklist, renderChecklist } from './render/checklist.js';
import { mountSources } from './render/sources.js';
import { mountTheme } from './chrome/theme.js';
import { mountClock, mountProgress, mountRail, mountReveal } from './chrome/status.js';
import { mountShortcuts } from './chrome/shortcuts.js';
import { mountDev } from './dev.js';

const store = createStore();

$('#sprite').innerHTML = iconSprite();
mountRoute(store);
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
mountShortcuts(store, { onDev: dev.toggle, onRoute: () => store.set((s) => ({ strategy: nextStrategy(s) })) });
if (IS_DEV) dev.toggle();
