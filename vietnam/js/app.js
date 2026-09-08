import { createStore } from './store.js';
import { currentPage } from './pages.js';
import { mountHero, renderHero } from './render/hero.js';
import { mountRoute, renderRoute } from './render/route.js';
import { mountItinerary, renderItinerary } from './render/itinerary.js';
import { mountDayBoard, renderDayBoard } from './render/dayboard.js';
import { mountPicker, renderPicker } from './render/picker.js';
import { mountBudget, renderBudget } from './render/budget.js';
import { mountChecklist, renderChecklist } from './render/checklist.js';
import { mountCalendar, renderCalendar } from './render/calendar.js';
import { mountSheet, renderSheet } from './render/sheet.js';
import { mountManager, renderManager } from './render/manager.js';
import { mountSplit, renderSplit } from './render/split.js';
import { mountExport, renderExport } from './render/export.js';
import { mountBrain } from './render/brain.js';
import { mountReel } from './render/reel.js';
import { renderSources, renderFooter } from './render/sources.js';
import { mountShell } from './chrome/shell.js';
import { mountTheme } from './chrome/theme.js';
import { mountScroll } from './chrome/scroll.js';
import { mountKeys } from './chrome/keys.js';
import { mountNet } from './chrome/net.js';
import { restoreShared } from './share.js';
import { mountDev } from './dev.js';

// Bootstrap. Every page shares the store (localStorage), the chrome and the
// overlays; only the renderers listed for <body data-page> mount here, so a
// renderer never looks for markup that lives on another page.

const PAGE = {
  route: [[mountHero, renderHero], [mountRoute, renderRoute]],
  days: [[mountItinerary, renderItinerary]],
  picks: [[mountPicker, renderPicker]],
  budget: [[mountBudget, renderBudget]],
  calendar: [[mountCalendar, renderCalendar], [mountSheet, renderSheet]],
  book: [[mountChecklist, renderChecklist], [mountExport, renderExport]],
  manager: [[mountManager, renderManager]],
  split: [[mountSplit, renderSplit]],
  sources: [[renderSources, null]],
};

const store = createStore();
const shared = restoreShared(store);
mountShell();

const renderers = (PAGE[currentPage()] || []).map(([mount, render]) => { mount(store); return render; }).filter(Boolean);
mountDayBoard(store);
const brain = mountBrain(store);
const reel = mountReel(store);
renderFooter();

store.subscribe((state) => {
  renderers.forEach((render) => render(state));
  renderDayBoard(state);
});

mountTheme(store);
mountScroll();
mountNet(shared);
mountKeys(store, { toggleDev: mountDev(store), brain, reel });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

window.__planner = store;
