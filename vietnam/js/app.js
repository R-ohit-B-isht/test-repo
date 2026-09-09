import { createStore } from './store.js';
import { currentPage } from './pages.js';
import { mountHero, renderHero } from './render/hero.js';
import { mountRoute, renderRoute } from './render/route.js';
import { mountItinerary, renderItinerary } from './render/itinerary.js';
import { mountDayBoard, renderDayBoard } from './render/dayboard.js';
import { mountPicker, renderPicker } from './render/picker.js';
import { mountImporter, renderImporter } from './render/importer.js';
import { mountBudget, renderBudget } from './render/budget.js';
import { mountChecklist, renderChecklist } from './render/checklist.js';
import { mountCalendar, renderCalendar } from './render/calendar.js';
import { mountSheet, renderSheet } from './render/sheet.js';
import { mountManager, renderManager } from './render/manager.js';
import { mountSplit, renderSplit } from './render/split.js';
import { mountToday, renderToday } from './render/today.js';
import { mountGmap, renderGmap } from './render/gmap.js';
import { mountExport, renderExport } from './render/export.js';
import { mountBrain } from './render/brain.js';
import { mountReel } from './render/reel.js';
import { mountReplay } from './render/replay.js';
import { mountVotes } from './render/votes.js';
import { mountRitual, renderRitual } from './render/ritual.js';
import { renderSources, renderFooter } from './render/sources.js';
import { mountShell } from './chrome/shell.js';
import { mountTheme } from './chrome/theme.js';
import { mountScroll } from './chrome/scroll.js';
import { mountKeys } from './chrome/keys.js';
import { mountNet } from './chrome/net.js';
import { restoreShared } from './share.js';
import { mountDev } from './dev.js';
import { mountMag, renderMag } from './render/mag.js';

// Bootstrap. Every page shares the store (localStorage), the chrome and the
// overlays; only the renderers listed for <body data-page> mount here, so a
// renderer never looks for markup that lives on another page.

const PAGE = {
  route: [[mountHero, renderHero], [mountRoute, renderRoute]],
  days: [[mountRitual, renderRitual], [mountItinerary, renderItinerary]],
  picks: [[mountPicker, renderPicker], [mountImporter, renderImporter]],
  budget: [[mountBudget, renderBudget]],
  calendar: [[mountCalendar, renderCalendar], [mountSheet, renderSheet]],
  book: [[mountRitual, renderRitual], [mountChecklist, renderChecklist], [mountExport, renderExport]],
  manager: [[mountManager, renderManager]],
  split: [[mountSplit, renderSplit]],
  today: [[mountToday, renderToday]],
  map: [[mountGmap, renderGmap]],
  trip: [[mountMag, renderMag]],
  sources: [[renderSources, null]],
};

// The magazine reads a shared link without applying it, so the store is
// only ever replaced from a link on the pages that edit the plan.
const store = createStore();
const shared = currentPage() === 'trip' ? null : restoreShared(store);
mountShell();

const renderers = (PAGE[currentPage()] || []).map(([mount, render]) => { mount(store); return render; }).filter(Boolean);
mountDayBoard(store);
mountVotes(store);
const brain = mountBrain(store);
const reel = mountReel(store);
const replay = mountReplay(store);
renderFooter();

store.subscribe((state) => {
  renderers.forEach((render) => render(state));
  renderDayBoard(state);
});

mountTheme(store);
mountScroll();
mountNet(shared);
mountKeys(store, { toggleDev: mountDev(store), brain, reel, replay });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

window.__planner = store;
