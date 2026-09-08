import { createStore } from './store.js';
import { IS_DEV } from './config.js';
import { iconSprite } from './icons.js';
import { $ } from './dom.js';
import { mountHero, renderHero } from './render/hero.js';
import { mountRoute, renderRoute, nextStrategy } from './render/route.js';
import { mountItinerary, renderItinerary } from './render/itinerary.js';
import { mountPicks, renderPicks } from './render/picks.js';
import { mountBudget, renderBudget } from './render/budget.js';
import { mountChecklist, renderChecklist } from './render/checklist.js';
import { mountSources } from './render/sources.js';
import { mountGallery } from './render/gallery.js';
import { mountDaySheet } from './render/daySheet.js';
import { mountReel } from './render/reel.js';
import { mountPlanner } from './render/planner.js';
import { mountTheme } from './chrome/theme.js';
import { mountClock, mountProgress, mountRail, mountReveal } from './chrome/status.js';
import { mountShortcuts } from './chrome/shortcuts.js';
import { mountOverlays } from './chrome/overlay.js';
import { mountDev } from './dev.js';

const store = createStore();

$('#sprite').innerHTML = iconSprite();
mountOverlays();
mountHero(store);
mountRoute(store);
mountItinerary(store);
mountPicks(store);
mountBudget(store);
mountChecklist(store);
mountSources();
mountGallery();
mountDaySheet(store);
mountReel();
const planner = mountPlanner(store);

store.subscribe((state) => {
  renderRoute(state);
  renderHero(state);
  renderPicks(state);
  renderItinerary(state);
  renderBudget(state);
  renderChecklist(state);
});

mountTheme(store);
mountClock();
mountProgress();
mountRail();
mountReveal();

const dev = mountDev(store, planner);
mountShortcuts(store, { onDev: dev.toggle, onRoute: () => store.set((s) => ({ strategy: nextStrategy(s) })) });
if (IS_DEV) dev.toggle();
