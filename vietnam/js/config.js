const params = new URLSearchParams(location.search);

export const IS_DEV = params.get('dev') === '1' || localStorage.getItem('IS_DEV') === 'true';

export const STORAGE_KEY = 'vietnam-planner-v2';

export const DEFAULT_STATE = {
  strategy: 'train',
  travellers: 2,
  berth: '6',
  bed: 850,
  food: 1000,
  local: 300,
  buffer: 10,
  activities: { hoianTicket: true, marble: true, hueCitadel: true, hueTomb: false, ninhbinh: true, halong: true },
  checklist: {},
  theme: 'auto',
};
