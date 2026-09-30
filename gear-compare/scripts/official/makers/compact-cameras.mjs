// Official spec pages for compact cameras. GoPro India (gopro.com/en/in, JS-rendered spec pages, probed 2026-09-30),
// Insta360 (insta360.com product pages carry the spec block in-page), DJI (dji.com/<product>/specs), SJCAM
// (sjcam.com/cameras/…), AKASO (akasotech.com/product/…) and Transcend body cameras — all read through the live
// Chrome session because none of them serves the spec table to a plain HTTP client. These pages publish no INR price,
// so they never become brand-store rows: they only lend official evidence to the marketplace listing of the same
// exact model. Accessories, mounts, batteries, mods and bundles are not cameras.
const NEVER = /accessor|mount|batter(?:y|ies)|charger|\bmod\b|\bmods\b|lens\s*(?:cap|guard|protector|filter)|case\b|housing|strap|tripod|selfie|remote|\bkit\b|bundle|combo|gift\s*card|\bsd\s*card|micro\s*sd|memory|headphone|earphone|microphone|\bmic\b|gimbal\s*for|subscription|cloud|premium\+|quik/i;
const isCamera = (p) => !NEVER.test(p.title) && !/\/accessories\//i.test(p.url);

const browser = (brand, name, base, extra) => ({ brand, name, base, kind: 'browser', region: 'GLOBAL', always: true, isProduct: isCamera, ...extra });

export default [
  browser(/^gopro$/i, 'GoPro', 'https://gopro.com', {
    region: 'IN',
    index: ['https://gopro.com/en/in/shop/cameras', 'https://gopro.com/en/in/shop/cameras/compare'],
    urlFilter: /^https:\/\/gopro\.com\/en\/in\/shop\/cameras\/(?:learn\/)?[a-z0-9-]+\/CHDH[A-Z]-\d{3}-master\.html$/i,
    names: {
      'https://gopro.com/en/in/shop/cameras/learn/hero13black/CHDHX-131-master.html': 'GoPro HERO13 Black',
      'https://gopro.com/en/in/shop/cameras/hero12-black/CHDHX-121-master.html': 'GoPro HERO12 Black',
      'https://gopro.com/en/in/shop/cameras/learn/hero/CHDHF-131-master.html': 'GoPro HERO (2024)',
      'https://gopro.com/en/in/shop/cameras/learn/lit-hero/CHDHF-132-master.html': 'GoPro LIT HERO',
      'https://gopro.com/en/in/shop/cameras/learn/max2/CHDHZ-202-master.html': 'GoPro MAX2', 'https://gopro.com/en/in/shop/cameras/learn/max2/CHDHZ-311-master.html': 'GoPro MAX2',
      'https://gopro.com/en/in/shop/cameras/learn/max/CHDHZ-203-master.html': 'GoPro MAX',
      'https://gopro.com/en/in/shop/cameras/hero11-black/CHDHX-111-master.html': 'GoPro HERO11 Black',
      'https://gopro.com/en/in/shop/cameras/hero11-black-mini/CHDHF-111-master.html': 'GoPro HERO11 Black Mini',
    },
    urls: [
      'https://gopro.com/en/in/shop/cameras/learn/hero13black/CHDHX-131-master.html',
      'https://gopro.com/en/in/shop/cameras/hero12-black/CHDHX-121-master.html',
      'https://gopro.com/en/in/shop/cameras/learn/hero/CHDHF-131-master.html',
      'https://gopro.com/en/in/shop/cameras/learn/lit-hero/CHDHF-132-master.html',
      'https://gopro.com/en/in/shop/cameras/learn/max2/CHDHZ-202-master.html',
      'https://gopro.com/en/in/shop/cameras/hero11-black/CHDHX-111-master.html',
      'https://gopro.com/en/in/shop/cameras/hero11-black-mini/CHDHF-111-master.html',
    ],
  }),
  browser(/^insta\s*-?360$/i, 'Insta360', 'https://www.insta360.com', {
    names: {
      'https://www.insta360.com/product/insta360-go3s': 'Insta360 GO 3S', 'https://www.insta360.com/product/insta360-go-ultra': 'Insta360 GO Ultra', 'https://www.insta360.com/product/insta360-go3': 'Insta360 GO 3',
      'https://www.insta360.com/product/insta360-ace-pro2': 'Insta360 Ace Pro 2', 'https://www.insta360.com/product/insta360-ace-pro': 'Insta360 Ace Pro', 'https://www.insta360.com/product/insta360-ace': 'Insta360 Ace',
      'https://www.insta360.com/product/insta360-x5': 'Insta360 X5', 'https://www.insta360.com/product/insta360-x4': 'Insta360 X4', 'https://www.insta360.com/product/insta360-x3': 'Insta360 X3', 'https://www.insta360.com/product/insta360-x6': 'Insta360 X6', 'https://www.insta360.com/product/insta360-go2': 'Insta360 GO 2',
    },
    urls: [
      'https://www.insta360.com/product/insta360-go3s',
      'https://www.insta360.com/product/insta360-go-ultra',
      'https://www.insta360.com/product/insta360-go3',
      'https://www.insta360.com/product/insta360-ace-pro2',
      'https://www.insta360.com/product/insta360-ace-pro',
      'https://www.insta360.com/product/insta360-ace',
      'https://www.insta360.com/product/insta360-x5',
      'https://www.insta360.com/product/insta360-x4',
      'https://www.insta360.com/product/insta360-x3',
      'https://www.insta360.com/product/insta360-x6',
      'https://www.insta360.com/product/insta360-go2',
    ],
  }),
  browser(/^dji$/i, 'DJI', 'https://www.dji.com', {
    index: ['https://www.dji.com/action-camera', 'https://www.dji.com/camera', 'https://www.dji.com/handheld'],
    urlFilter: /^https:\/\/www\.dji\.com\/(?:osmo-(?:action-\d(?:-pro)?|nano|pocket-3|360|action)|osmo-pocket-\d)$/i,
    names: { 'https://www.dji.com/osmo-nano': 'DJI Osmo Nano', 'https://www.dji.com/osmo-pocket-3': 'DJI Osmo Pocket 3', 'https://www.dji.com/osmo-360': 'DJI Osmo 360', 'https://www.dji.com/osmo-action-5-pro': 'DJI Osmo Action 5 Pro', 'https://www.dji.com/osmo-action-4': 'DJI Osmo Action 4', 'https://www.dji.com/osmo-action-6': 'DJI Osmo Action 6', 'https://www.dji.com/osmo-action-3': 'DJI Osmo Action 3', 'https://www.dji.com/action-2': 'DJI Action 2' },
    urls: ['https://www.dji.com/osmo-nano', 'https://www.dji.com/osmo-pocket-3', 'https://www.dji.com/osmo-360', 'https://www.dji.com/osmo-action-5-pro', 'https://www.dji.com/osmo-action-4', 'https://www.dji.com/osmo-action-6'],
    specsUrl: (u) => `${u.replace(/\/+$/, '')}/specs`,
  }),
  browser(/^sjcam$/i, 'SJCAM', 'https://www.sjcam.com', {
    index: ['https://www.sjcam.com/', 'https://www.sjcam.com/cameras/action-cameras/'],
    urlFilter: /^https:\/\/www\.sjcam\.com\/cameras\/action-cameras\/(?!biking|camp-hike|diving|funcam|kids-pets|motorcycle|vlogging|travel|water-sports|skiing|fishing|snowboard|surfing|hiking|running|cycling|skating|kayaking|climbing|hunting)[a-z0-9-]+\/$/i,
    // Campaign headings ("FROM LIGHT TO NIGHT") stand in for the model name on some pages: the model is the URL slug.
    title: (p) => { const slug = String(p.finalUrl || p.url || '').replace(/\/+$/, '').split('/').pop(); const m = /^(sj|c|s|a|m)(\d+)(.*)$/i.exec(slug || ''); return m ? `SJCAM ${m[1].toUpperCase()}${m[2]}${m[3] ? ' ' + m[3].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim() : ''}` : ''; },
  }),
  browser(/^akaso$/i, 'AKASO', 'https://www.akasotech.com', {
    index: ['https://www.akasotech.com/action-camera', 'https://www.akasotech.com/'],
    // keychain / 360 pages render only the site chrome to the headless session: nothing to lend.
    urlFilter: /^https:\/\/www\.akasotech\.com\/product\/(?!.*(?:accessor|battery|mount|case|kit|keychain|360))[a-z0-9-]+$/i,
    names: { 'https://www.akasotech.com/product/brave-7': 'AKASO Brave 7', 'https://www.akasotech.com/product/brave-8': 'AKASO Brave 8', 'https://www.akasotech.com/product/brave-8-lite': 'AKASO Brave 8 Lite', 'https://www.akasotech.com/product/brave-7-le': 'AKASO Brave 7 LE', 'https://www.akasotech.com/product/brave-4': 'AKASO Brave 4', 'https://www.akasotech.com/product/ek7000': 'AKASO EK7000', 'https://www.akasotech.com/product/ek7000-pro': 'AKASO EK7000 Pro', 'https://www.akasotech.com/product/v50x': 'AKASO V50 X' },
    urls: ['https://www.akasotech.com/product/brave-7', 'https://www.akasotech.com/product/brave-8', 'https://www.akasotech.com/product/brave-8-lite', 'https://www.akasotech.com/product/brave-7-le', 'https://www.akasotech.com/product/brave-4', 'https://www.akasotech.com/product/ek7000', 'https://www.akasotech.com/product/ek7000-pro', 'https://www.akasotech.com/product/v50x'],
  }),
  browser(/^transcend$/i, 'Transcend', 'https://us.transcend-info.com', {
    names: { 'https://us.transcend-info.com/product/body-camera/drivepro-body-10': 'Transcend DrivePro Body 10', 'https://us.transcend-info.com/product/body-camera/drivepro-body-30': 'Transcend DrivePro Body 30', 'https://us.transcend-info.com/product/body-camera/drivepro-body-40': 'Transcend DrivePro Body 40', 'https://us.transcend-info.com/product/body-camera/drivepro-body-60': 'Transcend DrivePro Body 60', 'https://us.transcend-info.com/product/body-camera/drivepro-body-70': 'Transcend DrivePro Body 70' },
    urls: ['https://us.transcend-info.com/product/body-camera/drivepro-body-10', 'https://us.transcend-info.com/product/body-camera/drivepro-body-30', 'https://us.transcend-info.com/product/body-camera/drivepro-body-40', 'https://us.transcend-info.com/product/body-camera/drivepro-body-60', 'https://us.transcend-info.com/product/body-camera/drivepro-body-70'],
  }),
];
