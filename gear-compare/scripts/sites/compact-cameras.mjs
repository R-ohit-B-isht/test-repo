// Compact self-contained cameras (action / thumb / body-worn / mini cube / pocket) — ready-to-go: own battery,
// own storage, charge and clip on or set down. Scored on what a maker page or spec table states: true sensor
// megapixels and sensor size (never the "4K"/"48 MP" title badge), video resolution, battery, storage, weight,
// water rating, and the stated workflow features (Wi-Fi app, time-lapse / interval, loop recording, cloud or
// auto-backup). Disguised-object cameras (pen, bulb, charger, clock, spectacles…), CCTV / home-security cameras,
// dash cams, toy / instant-print cameras and camera accessories never enter.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const T = require('../lib/trip.cjs');
const { mah, oneOf, warrantyMonths } = require('../lib/parse.cjs');
import { modelCodes } from '../official/model-codes.mjs';

// "12 MP", "48MP", "12 megapixels", "2 mp" → MP. A bare "1080P" / "4K" is video, not a still resolution.
const megapixels = (s) => { const m = /(?<![\d.])(\d{1,3}(?:\.\d+)?)\s*-?\s*(?:mp|m\.p\.|mega\s*-?\s*pixels?)\b/i.exec(String(s)); return m ? Number(m[1]) : null; };
// Video resolution → vertical line count. "8K"→4320, "5.3K"→2880, "5K"→2700, "4K"/"2160p"/"UHD"→2160, "2.7K"→1520, "1440p"→1440, "1080p"/"Full HD"→1080, "720p"/"HD"→720.
function videoLines(s) {
  const t = String(s);
  const k = /(\d(?:\.\d)?)\s*k\b/i.exec(t);
  const p = /(\d{3,4})\s*[pi]\b/i.exec(t) || /\d{3,4}\s*[x×]\s*(\d{3,4})\b/.exec(t);
  const cands = [];
  if (k) cands.push(({ 8: 4320, 6: 3160, 5.3: 2880, 5: 2700, 4: 2160, 2.7: 1520, 2.5: 1440, 2: 1080, 1: 1080 })[Number(k[1])] || null);
  if (p) cands.push(Number(p[1]));
  if (/\buhd\b|ultra\s*hd/i.test(t)) cands.push(2160);
  if (/\bfull\s*hd\b|\bfhd\b/i.test(t)) cands.push(1080);
  else if (/\bhd\b/i.test(t)) cands.push(720);
  const v = cands.filter((x) => x && x >= 240 && x <= 4320);
  return v.length ? Math.max(...v) : null;
}
const VIDEO_LABEL = (v) => (v >= 4320 ? '8K' : v >= 2880 ? '5.3K' : v >= 2700 ? '5K' : v >= 2160 ? '4K' : v >= 1520 ? '2.7K' : v >= 1440 ? '1440p' : v >= 1080 ? '1080p' : v >= 720 ? '720p' : `${v}p`);
// Sensor size as the diagonal fraction the maker prints ("1/1.28\"", "1/2.3 inch", "1-inch"). Larger = more light.
function sensorSize(s) {
  const t = String(s);
  if (/\b1\s*(?:-|\s)?inch\b|\b1"\s|\btype\s*1\b|\b1\.0\s*(?:-|\s)?(?:inch|type)/i.test(t) && !/1\/\d/.test(t)) return 1;
  const m = /1\s*\/\s*(\d(?:\.\d+)?)\s*(?:["”]|inch|in\b|type)?/i.exec(t);
  return m ? Number((1 / Number(m[1])).toFixed(3)) : null;
}
const sensorLabel = (v) => (v >= 1 ? '1-inch' : `1/${(1 / v).toFixed(v > 0.6 ? 1 : 2).replace(/\.0+$/, '')}"`);
const hours = (s) => { const t = String(s); const h = /(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?)\b/i.exec(t); const m = /(\d+(?:\.\d+)?)\s*(?:min|mins|minutes?)\b/i.exec(t); if (h && m) return Number(h[1]) + Number(m[1]) / 60; if (h) return Number(h[1]); if (m) return Math.round((Number(m[1]) / 60) * 10) / 10; return null; };
// "64 GB", "128GB built-in", "supports up to 256 GB" → GB (largest figure stated).
function gigabytes(s) {
  const t = String(s);
  let best = null;
  for (const m of t.matchAll(/(\d{1,4})\s*-?\s*(gb|tb)\b/gi)) { const v = Number(m[1]) * (m[2].toLowerCase() === 'tb' ? 1024 : 1); if (best === null || v > best) best = v; }
  return best;
}
const metresDepth = (s) => { const m = /(\d{1,3})\s*(?:m|mtrs?|meters?|metres?)\b/i.exec(String(s)); return m ? Number(m[1]) : null; };
const IP = /\bip\s?([x0-9])([0-9])\b/i;
const ipRating = (s) => { const m = IP.exec(String(s)); if (!m) return null; return `IP${m[1].toUpperCase()}${m[2]}`; };
const BATT = [['removable', /removable|detachable|replaceable|swappable|spare\s*battery|2\s*batteries|two\s*batteries|dual\s*batter/i], ['builtin', /built[-\s]?in|non[-\s]?removable|integrated|internal|li[-\s]?(?:ion|po|polymer)|lithium|polymer|rechargeable/i]];
const PORT = [['usb-c', /type[-\s]?c|usb[-\s]?c\b/i], ['micro', /micro[-\s]?usb/i], ['magnetic', /magnetic\s*charg|charging\s*case|action\s*pod|charging\s*dock/i], ['usb', /\busb\b/i]];
const WIFI = /wi[-\s]?fi|wlan|\bapp\b|bluetooth|\bble\b|smartphone\s*(?:app|control)|mobile\s*app|remote\s*view/i;
const TIMELAPSE = /time[-\s]?lapse|hyper[-\s]?lapse|interval\s*(?:shoot|record|captur|photo|timer)|photo\s*interval|intervalometer|scheduled?\s*record|timer\s*record/i;
const LOOP = /loop\s*record|cycl(?:e|ic)\s*record|auto[-\s]?overwrite|overwrite\s*(?:old|record)|seamless\s*record/i;
const CLOUD = /cloud\s*(?:storage|backup|upload|sync|service|recording)|auto[-\s]?(?:upload|backup|sync|transfer)|google\s*drive|one\s*drive|dropbox|icloud|quick\s*transfer|wireless\s*transfer|auto\s*download/i;
const STAB = /stabili[sz](?:ation|er|ed)|\beis\b|\bois\b|gyro|flowstate|hypersmooth|rocksteady|horizon\s*(?:lock|level|steady)|anti[-\s]?shake/i;
const SCREEN = /touch\s*screen|\blcd\b|\bips\b|display|screen|\boled\b|amoled|viewfinder|\bflip\s*screen/i;
const NIGHT = /night\s*vision|\bir\s*(?:led|light|cut|night)|infrared|low[-\s]?light\s*(?:mode|record)/i;
const MOUNT = /clip|magnet|lanyard|neck\s*mount|chest\s*(?:mount|strap)|helmet\s*mount|wearable|pendant|body\s*mount|back\s*clip|pocket\s*clip|mount(?:ing)?\s*(?:type|kit|bracket|adhesive)|tripod\s*(?:socket|thread|mount)|1\/4/i;
const MIC = /\bmic\b|microphone|audio\s*record|voice\s*record|wind\s*noise/i;

// Product form, read from the title (identity, unscored) or the spec table's camera type row. Named pocket gimbals
// come first; a generic "vlogging camera" / "camcorder" word only decides the form when no action / body / mini form
// word is present ("4K Action Camera … Vlogging Camera" is an action camera).
const FORM = [
  ['thumb', /insta\s*360\s*go\b|\bgo\s*3s?\b|\bgo\s*ultra\b|osmo\s*nano|thumb\s*(?:action\s*|digital\s*|mini\s*|body\s*|pov\s*)*(?:cam|camera|digicam)|akaso\s*keychain|keychain\s*(?:action\s*|thumb\s*|digital\s*|mini\s*)*(?:cam|camera)/i],
  ['pocket', /osmo\s*pocket|dji\s*pocket|pocket\s*(?:gimbal\s*)?(?:cam|camera|camcorder|cinema)|gimbal\s*camera|handheld\s*gimbal\s*camera/i],
  ['action', /action\s*-?\s*cam|\bgopro\b|hero\s*\d{1,2}\b|insta\s*360\s*(?:ace|x\d|one)|osmo\s*action|dji\s*action|\bsjcam\b|\bakaso\b|sports?\s*(?:&\s*action\s*|and\s*action\s*|action\s*)?cam|helmet\s*cam|360\s*(?:degree\s*)?(?:action\s*)?cam|underwater\s*cam|waterproof\s*cam|diving\s*cam|bike\s*cam/i],
  ['body', /body\s*-?\s*(?:worn\s*)?cam|body\s*(?:camera|worn)|wearable\s*(?:cam|camera|video|recorder|camcorder)|clip[-\s]?on\s*cam|police\s*cam|chest\s*cam|lapel\s*cam|badge\s*cam|life\s*-?\s*log|necklace\s*cam|neck\s*cam|shoulder\s*cam/i],
  ['mini', /mini\s*(?:wifi\s*|hd\s*|1080p\s*|4k\s*|smart\s*|size\s*|wireless\s*|magnet(?:ic)?\s*|security\s*)*(?:cam|camera|dv|video|recorder|camcorder)|micro\s*(?:cam|camera)|small(?:est)?\s*(?:cam|camera)|tiny\s*(?:cam|camera)|magnet(?:ic)?\s*(?:mini\s*|wifi\s*|hd\s*|security\s*|wireless\s*)*(?:cam|camera)|cube\s*cam|\ba9\b|\bsq\s*1[01]\b|\bsq\s*8\b|portable\s*(?:mini\s*)?(?:cam|camera|recorder)|pocket\s*cam|mini\s*-?\s*magnetic/i],
  ['compact', /digital\s*camera|digi\s*-?\s*cam|point\s*(?:&|and)\s*shoot|compact\s*camera|\bzv-?\s?(?:1|e10|e1)\b|powershot|cyber-?shot|coolpix|lumix\s*(?:tz|zs|lx)|\bkodak\s*(?:pixpro|fz|az)|ricoh\s*gr|\bx100/i],
  ['pocket', /vlog(?:ging)?\s*camera|handheld\s*camera|camcorder/i],
];
const FORM_LABEL = { action: 'Action camera', thumb: 'Thumb / magnetic mini action cam', pocket: 'Pocket gimbal / vlog camera', body: 'Body-worn / clip camera', mini: 'Mini cube / mini Wi-Fi camera', compact: 'Compact digital camera' };

// Not this product: anything marketed for covert recording (spy / hidden / nanny / concealed…) or a camera hidden
// inside another object, fixed CCTV / home-security / baby / doorbell cameras, dash and reverse cameras, toys,
// dummies, big cameras, webcams and every accessory sold alone (mount, case, battery, filter, card, stick, lens…).
export const COVERT = /\bspy\b|\bspying\b|hidden|\bhide\b|covert|nanny\s*cam|secret\s*(?:cam|camera|record)|conceal|disguis|undetectable|invisible\s*(?:cam|camera|lens|record\w*)|stealth\s*(?:cam|camera|record\w*|mode)|\bsneak|discreet\s*(?:cam|camera|record)|surveillance/i;
const DISGUISED = /\bcharge\s*(?:cam|camera)\b|car\s*key\s*(?:chain|fob|ring)?\s*(?:mini\s*|spy\s*|hidden\s*|hd\s*)*(?:cam|camera)|\b(?:pen|spectacles?|glasses|eyeglass|sunglass(?:es)?|watch|wrist|bulb|lamp|charger|adapter|adaptor|plug|socket|switch\s*board|clock|alarm\s*clock|smoke\s*detector|photo\s*frame|power\s*bank|usb\s*(?:drive|stick|flash|pen\s*drive)|pen\s*-?\s*drive|button|bottle|hook|tissue|teddy|toy\s*car|car\s*key|lighter|air\s*freshener|speaker|photo\s*frame|calculator|mouse|earphone|neck\s*band|shirt|belt\s*buckle|cap\s*camera|hat\s*camera|hanger|bird\s*feeder|plant\s*pot|book\s*camera)\s*(?:shaped\s*|type\s*|style\s*|design\s*)?(?:spy\s*|hidden\s*|mini\s*|hd\s*|wifi\s*|smart\s*)*(?:cam|camera|dvr|recorder)|(?:spy|hidden|mini|hd|camera|cam)\s*(?:pen|spectacles?|glasses|watch|bulb|charger|adapter|clock|smoke\s*detector|photo\s*frame|power\s*bank|pen\s*-?\s*drive|button|bottle|hook|lighter|usb\s*(?:drive|stick))\b|\bpen\s*cam(?:era)?\b|camera\s*pen\b|glasses\s*cam|smart\s*(?:glasses|eyewear)|eyewear|invisible\s*lens|camera\s*in\s*(?:a\s*)?(?:car\s*key|key\s*chain|keyfob|pen|watch|bulb|clock)|\bcar\s*key\b|remote\s*style\s*recorder/i;
// Fixed installed cameras (mains-powered, pan-tilt, NVR / SIM / solar, brand lines) are never the product; "security
// camera for home" alone is only a rejection when nothing says the camera is a mini / magnet / body / battery unit.
const CCTV_HARD = /\bcctv\b|\bip\s*(?:home\s*)?security|\bwifi\s*ip\b|\bptz\b|pan\s*(?:\/|-|&|and)?\s*tilt|\bnvr\b|\bdvr\b(?!.*(?:mini|body|wearable))|\bip\s*cam(?:era)?\b|bullet\s*cam|dome\s*cam|baby\s*monitor|doorbell|video\s*door|door\s*phone|solar\s*camera|4g\s*sim\s*camera|sim\s*card\s*camera|360\s*(?:degree\s*)?(?:wifi\s*|smart\s*)?(?:home\s*)?(?:security|cctv|monitoring)|pet\s*camera|trail\s*cam|hunting\s*cam|wildlife\s*cam|game\s*cam|eve\s*pro|tapo\b|ezviz|imou|cp\s*plus|hikvision|dahua|qubo|godrej\s*eve|mi\s*360|xiaomi\s*(?:smart\s*)?camera\s*(?:c\d|2k|360)|wipro\s*smart|realme\s*smart\s*cam|tp[-\s]?link|d-?link|smart\s*wifi\s*(?:mini\s*)?pt\b|\bpt\s*camera/i;
const CCTV_SOFT = /home\s*security|indoor\s*(?:security\s*)?camera|outdoor\s*(?:security\s*)?camera|security\s*camera\s*(?:kit|system|360|for\s*home)|surveillance\s*(?:camera|system)|wifi\s*camera\s*(?:360|for\s*home|indoor)/i;
const MINI_UNIT = /\bmini\b|magnet|portable|body\s*cam|wearable|battery|pocket|\ba9\b|\bsq\s*\d+\b|clip/i;
const CCTV = { test: (t) => CCTV_HARD.test(t) || (CCTV_SOFT.test(t) && !MINI_UNIT.test(t)) };
const VEHICLE = /dash\s*-?\s*cam|car\s*(?:camera|dvr|dash|recorder)|reverse\s*(?:camera|assist)|rear\s*view|rearview|parking\s*(?:camera|assist)|driving\s*recorder|vehicle\s*camera|bike\s*dvr|motorcycle\s*dvr|helmet\s*intercom/i;
const OTHER_CAM = /\bdslr\b|thermal\s*print|\bguide\b|\btoys?\b|how\s*to\s*use|user'?s?\s*(?:guide|manual)|\bmanual\b|handbook|for\s*dummies|paperback|hardcover|kindle|\bbook\b|mirrorless|interchangeable\s*lens|\bef-?m\b|\be-?mount\b|digital\s*camera\s*(?:for\s*kids|kids|children|toy)|kids?\s*(?:digital\s*|video\s*|selfie\s*|mini\s*|sports?\s*(?:and\s*|&\s*)?|action\s*)*camera|children'?s?\s*(?:digital\s*)?camera|toy\s*camera|instant\s*(?:print|photo|film|camera)|instax|\banalog\s*mini\b|\bmini\s*1[12]\b|\bmini\s*evo\b|liplay|\bdiy\s*(?:instant\s*)?(?:digital\s*)?camera|(?:print|printer)\s*camera|camera\s*(?:with|and)\s*(?:built[-\s]?in\s*)?printer|polaroid|instax|webcam|web\s*camera|endoscope|borescope|inspection\s*camera|microscope|telescope|binocular|monocular|night\s*vision\s*(?:goggles?|scope|binocular|device|monocular)|thermal\s*(?:imag|camera)|drone|quadcopter|dummy|fake\s*(?:camera|cctv)|cinema\s*camera|film\s*camera|\bcamcorder\s*(?:full\s*)?hd\s*\d{2}x|projector|photo\s*printer|doorbell|smart\s*display|conference\s*cam|ptz|streaming\s*camera\s*for\s*pc|document\s*camera|visualiser|dental|otoscope|scanner|game\s*camera|body\s*camera\s*holder|body\s*cam\s*(?:mount|holder|clip)\s*only/i;
const ACCESSORY = /\b(?:mount|mounts|mounting|tripod|monopod|selfie\s*stick|stick|pole|grip|handle|case|cover|housing|cage|frame|skin|sticker|decal|protector|tempered\s*glass|filter|filters|lens\s*(?:cap|cover|protector|kit|filter)|\blens\b(?!.*(?:cam|camera)\s*\d)|strap|straps|lanyard|harness|chest\s*strap|head\s*strap|wrist\s*strap|floaty|float|buoy|adapter|adaptor|battery|batteries|charger|charging\s*(?:dock|cable|hub|case\s*for)|cable|card\s*reader|memory\s*card|micro\s*sd|sd\s*card|\btf\s*card|mic|microphone|windscreen|dead\s*cat|remote\s*control|remote\s*for|clip\s*for|holder|bracket|kit\s*for|accessories|accessory|combo\s*for|bundle\s*for|backpack\s*mount|suction\s*cup|helmet\s*mount|bike\s*mount|magnet\s*mount|pendant\s*for|mount\s*for|for\s*(?:gopro|insta\s*360|dji|osmo|akaso|sjcam|hero\s*\d)|nd\d+|nd\s*filters?|\bcpl\b|polari[sz]er|(?:fill|video|ring|led)\s*lights?|light\s*set|extension\s*(?:rod|pole)|power\s*bank)\b/i;
const CAMERA_NOUN = /\bcam(?:era|corder|er|s)?(?:\b|$)|\bdv\b|video\s*recorder/i;
const CAMERA_WORD = new RegExp(`${CAMERA_NOUN.source}|gopro|insta\\s*360|osmo|\\bsjcam\\b|\\bakaso\\b`, 'i');
// An accessory listing names the accessory as its noun ("lens caps for mini DV camcorder"); a camera bundle that
// includes accessories still names the camera first.
const BRAND_LEAD = /^(?:gopro|insta\s*360|dji|osmo|akaso|sjcam|transcend)\b/i;
const accessoryOnly = (t) => {
  if (!ACCESSORY.test(t)) return false;
  // "Insta360 GO 3S Magnet Pendant Mount", "DJI Osmo Action 5 Pro Extreme Battery": a maker's accessory named after
  // the camera it fits, with no camera noun, combo or "with" in the title.
  if (BRAND_LEAD.test(t) && !/\b(?:cam|camera|combo|edition|bundle|with)\b/i.test(t)) return true;
  // "Insta360 X4 Invisible Dive Case Camera Housing", "Insta360 Body Grip Camera Mount": the camera word only qualifies
  // the accessory noun that closes the title.
  if (/\bcam(?:era)?\s+(?:housing|mount|case|cage|grip|strap|holder|bracket|cover|skin|protector|bag|tripod|selfie\s*stick)\s*$/i.test(t) && !/\b(?:with|combo|bundle)\b/i.test(t)) return true;
  // "Tripod & Selfie Stick with Adapter for DJI Osmo Pocket 3", "10X Macro Lens Compatible with DJI Osmo Pocket 3": an
  // add-on named by what it fits — nothing before the "for"/"compatible with" names a camera (maker names don't count).
  const fit = /\b(?:for|compatible\s*(?:with|for)|fits?|designed\s*for|suitable\s*for)\s*(?:gopro|insta\s*360|dji|osmo|akaso|sjcam|hero\s*\d|action\s*cam|pocket\s*\d|go\s*\d|mini\s*dv|camcorders?\b|(?:\w+\s+){0,2}cameras?\b(?!\s*(?:\d|with|wifi|hd|4k)))/i.exec(t);
  if (fit && !CAMERA_NOUN.test(t.slice(0, fit.index))) return true;
  if (/lens\s*(?:caps?|guards?)|lenses\s*&\s*filters|filter\s*kit|screen\s*(?:protector|guard)|tempered\s*glass|protective\s*film|sling\s*bag|camera\s*bag|backpack\b/i.test(t)) return true;
  const head = t.slice(0, 60);
  return !CAMERA_WORD.test(head) || /^(?:[\w'&.-]+\s+){0,3}(?:mount|tripod|selfie\s*stick|case|cover|housing|filter|strap|lanyard|battery|charger|cable|memory\s*card|micro\s*sd|holder|bracket|kit|accessories|remote|mic|microphone|skin|sticker|protector|floaty|adapter|(?:macro|wide[-\s]?angle|anamorphic|fisheye|nd)\s*lens|lens\s*(?:cap|cover|protector|filter))\b/i.test(t);
};
const STRONG = new RegExp(`${FORM.map(([, re]) => re.source).join('|')}|wearable\\s*(?:camera|cam)|\\b(?:mini|magnet\\w*|portable|wearable|body|pocket|thumb)\\b[^|]{0,40}?\\b(?:cam|camera|camcorder|recorder)|\\b(?:1080p|4k|2\\.7k|5k|5\\.3k|8k)\\s*(?:wifi\\s*)?(?:action\\s*|sports?\\s*|mini\\s*|body\\s*|wearable\\s*)+(?:cam|camera)`, 'i');

// Card-level pre-filter for the page fetch: a truncated search-card title can hide the camera noun, so only the
// hard rejections are applied there; the full page title goes through `include` at generation time.
export const rejectTitle = (t) => COVERT.test(t) || DISGUISED.test(t) || CCTV.test(t) || VEHICLE.test(t) || OTHER_CAM.test(t) || accessoryOnly(t);
// Why a title is out, for the rejected-corpus report: the first matching class wins.
export const rejectClass = (t) => (COVERT.test(t) ? 'covert' : DISGUISED.test(t) ? 'disguised' : CCTV.test(t) ? 'cctv' : VEHICLE.test(t) ? 'vehicle' : OTHER_CAM.test(t) ? 'other' : accessoryOnly(t) ? 'accessory' : null);
// Exact model + variant of a listing, for one-row-per-model collapsing (generate.mjs `collapseModels`). Known
// maker families are read from the title ("GoPro HERO13 Black", "Insta360 GO 3S", "Osmo Action 5 Pro", "SJ4000
// Air"); other listings need a model code in the title ("H17", "i3", "SQ11", "ZcM11") or in the spec table's
// Model row. The storage size ("64GB" / "128GB") and a combo / bundle edition tell variants apart. A listing with
// no identifier at all stays its own row: sellers who print only "4K action camera" cannot be merged honestly.
const FAMILY = [
  [/\bhero\s*(\d{1,2})\s*(black|white|silver|session)?\b/i, (m) => `gopro hero${m[1]}${m[2] ? ' ' + m[2].toLowerCase() : ''}`],
  [/\bgopro\s*hero\b(?!\s*\d)/i, () => 'gopro hero'],
  [/\bgopro\s*max\s*2\b|\bmax\s*2\b(?=.*gopro)/i, () => 'gopro max 2'], [/\bgopro\s*max\b/i, () => 'gopro max'],
  [/\bgo\s*ultra\b/i, () => 'insta360 go ultra'], [/\bgo\s*3\s*s\b/i, () => 'insta360 go 3s'], [/\bgo\s*3\b/i, () => 'insta360 go 3'], [/\bgo\s*2\b/i, () => 'insta360 go 2'],
  [/\bace\s*pro\s*2\b/i, () => 'insta360 ace pro 2'], [/\bace\s*pro\b/i, () => 'insta360 ace pro'], [/insta\s*360\s*ace\b/i, () => 'insta360 ace'],
  [/insta\s*360\s*(x5|x4|x3|one\s*x2|one\s*rs|one\s*r|one\s*x)\b/i, (m) => `insta360 ${m[1].toLowerCase().replace(/\s+/g, ' ')}`],
  [/\b(x5|x4|x3)\b(?=.*(?:insta|360))/i, (m) => `insta360 ${m[1].toLowerCase()}`],
  [/\bosmo\s*action\s*(\d)\s*(pro)?\b/i, (m) => `dji osmo action ${m[1]}${m[2] ? ' pro' : ''}`], [/\bdji\s*action\s*2\b/i, () => 'dji action 2'],
  [/\bosmo\s*nano\b/i, () => 'dji osmo nano'], [/\bosmo\s*pocket\s*(\d)\b/i, (m) => `dji osmo pocket ${m[1]}`], [/\bosmo\s*360\b/i, () => 'dji osmo 360'],
  [/\bsj\s*-?\s*(\d{3,4})\s*(air|x|pro|plus|4k|elite|legend|dual)?\b/i, (m) => `sjcam sj${m[1]}${m[2] ? ' ' + m[2].toLowerCase() : ''}`], [/\bsjcam\s*(c\d{3}|a\d{2}|m\d{2})\b/i, (m) => `sjcam ${m[1].toLowerCase()}`],
  [/\bbrave\s*(\d)\s*(le|pro|elite)?\b/i, (m) => `akaso brave ${m[1]}${m[2] ? ' ' + m[2].toLowerCase() : ''}`], [/\bek\s*7000\s*(pro)?\b/i, (m) => `akaso ek7000${m[1] ? ' pro' : ''}`], [/\bv50\s*(x|elite|pro)?\b/i, (m) => `v50${m[1] ? ' ' + m[1].toLowerCase() : ''}`],
  [/\bqoocam\s*(\d\w*)/i, (m) => `kandao qoocam ${m[1].toLowerCase()}`], [/\bdrivepro\s*body\s*(\d+)/i, (m) => `transcend drivepro body ${m[1]}`], [/\bprocus\s*rush\s*(\d(?:\.\d)?)/i, (m) => `procus rush ${m[1]}`],
];
// "i3", "H17", "A9", "SQ11", "M7", "G6", "H88" — one or two letters and up to three digits; never a unit / resolution.
const SHORT_CODE = /\b([a-z]{1,2})\s?-?(\d{1,3})([a-z]{0,2})\b(?!\.\d)/gi;
const NOT_MODEL = /^(?:(?:hd|fhd|uhd|qhd|mp|gb|tb|mah|fps|ip|ipx|usb|hz|db|dc|ac|tf|sd|hp|hr|hrs|mm|cm|kg|in|no|of|or|to|pt|rs|inr|ir|led|lcd|lte|ai|wifi|bt|ph|pa|f|v|w|k|p)\d+[a-z]{0,2}|ip[x0-9]\d?|h\d{3}|mp\d)$/i;
const STORAGE_IN_TITLE = /\b(\d{2,4})\s*gb\b/i;
const EDITION = /\b(creator|adventure|essential|standard|travel|vlog|motorcycle|bike|dive|extreme|surf|snow|combo|bundle|full\s*pack)\b/i;
const identifier = (title, kvModel) => {
  for (const [re, name] of FAMILY) { const m = re.exec(title); if (m) return name(m); }
  const skip = (code) => NOT_MODEL.test(code) || /^(?:hd|fhd|uhd)\d/.test(code) || /^\d/.test(code);
  for (const m of title.matchAll(SHORT_CODE)) {
    const code = (m[1] + m[2] + m[3]).toLowerCase();
    if (skip(code) || (m[3] && /^(?:k|p|m|g|x|w|v|h|gb|mp|fps|mah|hz|in|cm|mm|hrs?|min|pcs?|deg|tb|ms|db|tf|ft)$/i.test(m[3]))) continue;
    if (/^(?:in|no|or|of|to|is|it|at|on|by)$/i.test(m[1])) continue;
    return code;
  }
  const codes = modelCodes(`${title} ${kvModel || ''}`).filter((c) => !skip(c));
  if (codes.length) return codes[0];
  const kv = String(kvModel || '').trim();
  if (kv && !/^(?:na|n\/a|none|nil|-|camera|cam|action\s*camera|body\s*camera|mini\s*camera)$/i.test(kv) && kv.length <= 40 && /\d/.test(kv)) return kv.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return null;
};
export const modelKey = (rec) => {
  const kv = rec.listingSpec || {};
  const id = identifier(rec.title, kv['Model Number'] || kv['Model Name'] || kv['Item model number'] || kv['Model'] || '');
  if (!id) return null;
  const brand = String(rec.brand || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const gb = STORAGE_IN_TITLE.exec(rec.title);
  const ed = EDITION.exec(rec.title);
  const edition = ed ? (/combo|bundle|full\s*pack/i.test(ed[1]) ? 'combo' : ed[1].toLowerCase()) : '';
  return `${brand}|${id}|${gb ? gb[1] + 'gb' : ''}|${edition}`;
};
const mpPoints = (v) => (v >= 20 ? 1 : v >= 12 ? 0.95 : v >= 8 ? 0.8 : v >= 5 ? 0.65 : v >= 3 ? 0.5 : v >= 2 ? 0.4 : 0.25);

export default {
  id: 'compact-cameras',
  label: 'Compact camera (action · thumb · body · mini)',
  kicker: 'CAMERA',
  family: 'camera',
  draft: true, // list-for-approval stage: no data files, manifest entry or navigation are published until the items are approved
  brandStore: true,
  collapseVariants: true,
  modelKey,
  unit: 'camera',
  blurb: 'Ready-to-go compact cameras on Flipkart, Amazon.in and maker stores — action cams, thumb / magnetic minis, body-worn clip cams, mini cube Wi-Fi cams and pocket gimbal cams. Scored only on what a maker page or the spec table states: sensor megapixels and size, video resolution, battery capacity and runtime, built-in storage / microSD ceiling, weight, water rating, and workflow features (app transfer, time-lapse / interval, loop recording, cloud or auto-backup). A "4K 48 MP" title badge earns nothing. Anything sold for covert recording (spy / hidden / nanny cams, cameras disguised as pens, bulbs, chargers or clocks), CCTV / home-security cameras, dash cams, toys and accessories never enter.',
  sources: { flipkart: ['cam2_fk_pages.0.json', 'cam2_fk_pages.1.json', 'cam2_fk_pages.2.json', 'cam2_fk_pages.3.json', 'cam2_fk_pages.4.json', 'cam2_fk_pages.5.json', 'cam2_fk_pages.r.json'], amazon: ['cam2_amz_pages.json', 'cam2_amz_pages.rev.json', 'cam2_amz_pages.mid.json'] },
  include: T.includer({
    strong: (t) => STRONG.test(t) && !/\btoys?\b/i.test(t),
    hard: rejectTitle,
  }),
  segment: {
    key: 'seg', label: 'Form',
    options: [
      { id: 'action', label: FORM_LABEL.action },
      { id: 'thumb', label: FORM_LABEL.thumb },
      { id: 'pocket', label: FORM_LABEL.pocket },
      { id: 'body', label: FORM_LABEL.body },
      { id: 'mini', label: FORM_LABEL.mini },
      { id: 'compact', label: FORM_LABEL.compact },
      { id: 'unstated', label: 'Form not stated' },
    ],
    of: (F) => (F.form && F.form.value ? F.form.value : 'unstated'),
  },
  fields: [
    { key: 'form', label: 'Camera form', group: 'Identity', dim: 'specs', weight: 0, title: true,
      listing: ['Camera Type', 'Type', 'Product Type', 'Form Factor', 'Mounting Type'], official: ['form factor', 'type'],
      parse: (s) => oneOf(s, FORM), display: (v) => FORM_LABEL[v] },
    { key: 'mp', label: 'Sensor resolution (stills)', group: 'Picture', dim: 'specs', weight: 3, title: true,
      listing: ['Effective Pixels', 'Camera Resolution', 'Sensor Resolution', 'Optical Sensor Resolution', 'Effective Still Resolution', 'Image Sensor Resolution', 'Photo Resolution', 'Still Image Resolution', 'Maximum Image Resolution', 'Megapixels', 'Mega Pixels', 'Resolution', 'Image Resolution', 'Photo Sensor Resolution', 'Lens Resolution', 'Pixels'],
      official: ['effective pixels', 'photo resolution', 'sensor resolution', 'megapixel', 'max photo', 'still resolution', 'photo'],
      officialPick: 'max', parse: megapixels, display: (v) => `${v} MP`, plausible: (v) => (v >= 0.3 && v <= 150) || `${v} MP is not a plausible photo resolution (0.3–150; 360 cameras stitch two sensors)`, points: mpPoints },
    { key: 'sensor', label: 'Sensor size', group: 'Picture', dim: 'specs', weight: 2, title: true,
      listing: ['Sensor Size', 'Image Sensor Size', 'Photo Sensor Size', 'Sensor Type', 'Image Sensor', 'Sensor', 'Optical Sensor Size', 'Image Sensor Type'], official: ['sensor size', 'sensor', 'image sensor'],
      parse: sensorSize, display: sensorLabel, plausible: (v) => (v >= 0.1 && v <= 1.6) || `sensor ${v} is not a plausible size`, points: (v) => (v >= 1 ? 1 : v >= 0.75 ? 0.9 : v >= 0.5 ? 0.8 : v >= 0.4 ? 0.65 : v >= 0.33 ? 0.55 : 0.4) },
    { key: 'video', label: 'Max video resolution', group: 'Picture', dim: 'specs', weight: 2, title: true,
      listing: ['Video Recording Resolution', 'Video Resolution', 'Maximum Video Resolution', 'Max Video Resolution', 'Video Capture Resolution', 'Video Quality', 'Recording Resolution', 'Video Output', 'Video Recording Quality'], official: ['video resolution', 'max video', 'video'],
      officialExclude: /lapse|photo|still|zoom|bitrate|bit\s*rate|conferenc|webcam|live|stream|page text|format|codec|slow|iso|shutter/i, officialPick: 'max', parse: videoLines, display: VIDEO_LABEL, plausible: (v) => (v >= 480 && v <= 4320) || `${v}p is not a plausible video resolution`, points: (v) => (v >= 2880 ? 1 : v >= 2160 ? 0.9 : v >= 1440 ? 0.75 : v >= 1080 ? 0.6 : 0.3) },
    T.feature('stab', 'Image stabilisation', 'Picture', STAB, { weight: 1, listing: ['Image Stabilization', 'Image Stabilisation', 'Stabilization', 'Video Stabilization', 'Other Camera and Imaging Features', 'Special Feature', 'Special Features', 'Key Features', 'Features', 'Other Features'], official: ['stabilization', 'stabilisation', 'eis', 'flowstate', 'hypersmooth', 'rocksteady'], noPts: 0.3 }),
    { key: 'capacity', label: 'Battery capacity', group: 'Battery', dim: 'specs', weight: 2, title: true,
      listing: ['Battery Capacity', 'Battery Capacity (mAh)', 'Battery', 'Battery Power Rating', 'Capacity', 'Battery Energy Content', 'Other Power Features', 'Battery Type'], official: ['battery capacity', 'capacity', 'battery', 'mah'],
      parse: mah, display: (v) => `${v.toLocaleString('en-IN')} mAh`, plausible: (v) => (v >= 100 && v <= 8000) || `${v} mAh is not a plausible compact-camera battery (100–8,000)`, points: (v) => (v >= 1500 ? 1 : v >= 1000 ? 0.85 : v >= 600 ? 0.7 : v >= 300 ? 0.55 : 0.4) },
    { key: 'runtime', label: 'Recording time (max stated)', group: 'Battery', dim: 'specs', weight: 1.5, title: true,
      listing: ['Battery Life', 'Recording Time', 'Maximum Record Time', 'Max Recording Time', 'Continuous Recording Time', 'Working Time', 'Run Time', 'Runtime', 'Battery Backup', 'Video Recording Time', 'Average Battery Life', 'Battery Average Life', 'Standby Time'], official: ['battery life', 'recording time', 'run time', 'runtime', 'record time'],
      officialPick: 'max', parse: hours, display: (v) => (v >= 1 ? `${Math.round(v * 10) / 10} h` : `${Math.round(v * 60)} min`), plausible: (v) => (v >= 0.25 && v <= 24) || `${v} h continuous recording is not plausible on one charge (15 min–24 h)`, points: (v) => (v >= 4 ? 1 : v >= 2 ? 0.85 : v >= 1.5 ? 0.7 : v >= 1 ? 0.55 : 0.4) },
    { key: 'batt', label: 'Battery type', group: 'Battery', dim: 'specs', weight: 0.5, title: true,
      listing: ['Battery Type', 'Battery Cell Composition', 'Battery', 'Power Source', 'Power Supply', 'Battery Description'], official: ['battery type', 'battery'],
      parse: (s) => oneOf(s, BATT), display: (v) => (v === 'removable' ? 'Removable / swappable battery' : 'Built-in rechargeable battery'), points: () => 1 },
    { key: 'port', label: 'Charging port', group: 'Battery', dim: 'specs', weight: 0.5, title: true,
      listing: ['Charging Port', 'Charging Type', 'Connector Type', 'Charging Interface', 'USB Port', 'Interface', 'Port Type', 'Connectivity'], official: ['charging', 'port', 'usb-c', 'type-c'],
      parse: (s) => oneOf(s, PORT), display: (v) => ({ 'usb-c': 'USB-C', micro: 'Micro-USB', magnetic: 'Magnetic / charging case', usb: 'USB (type not stated)' })[v], points: (v) => (v === 'usb-c' ? 1 : v === 'magnetic' ? 0.9 : v === 'micro' ? 0.6 : 0.6) },
    { key: 'storage', label: 'Built-in storage', group: 'Storage', dim: 'specs', weight: 1.5, title: true,
      listing: ['Internal Memory', 'Internal Storage', 'Built-in Memory', 'Built-in Storage', 'Memory Storage Capacity', 'Flash Memory Installed Size', 'Storage Capacity', 'Storage', 'Memory', 'Hard Disk Size', 'Digital Storage Capacity', 'Memory Card Included', 'Included Memory'], official: ['internal storage', 'built-in storage', 'storage', 'memory'],
      parse: gigabytes, display: (v) => (v >= 1024 ? `${v / 1024} TB` : `${v} GB`), plausible: (v) => (v >= 1 && v <= 2048) || `${v} GB is not a plausible built-in memory`, points: (v) => (v >= 128 ? 1 : v >= 64 ? 0.9 : v >= 32 ? 0.75 : 0.6) },
    { key: 'card', label: 'microSD slot (max stated)', group: 'Storage', dim: 'specs', weight: 1.5, title: true,
      listing: ['Memory Card Type', 'Expandable Memory', 'Expandable Storage', 'Maximum Memory Supported', 'Max Memory Card Support', 'Memory Card Slot', 'Memory Card Support', 'External Memory', 'Supported Memory Card', 'HDD Type', 'Storage Type', 'Media Type', 'Removable Memory', 'Compatible Memory Card', 'Other Connectivity Features'], official: ['memory card', 'microsd', 'micro sd', 'expandable'],
      parse: (s) => { const t = String(s); if (!/micro\s*-?\s*sd|\bsd\s*card|\btf\b|memory\s*card|expandable|up\s*to\s*\d+\s*gb/i.test(t)) return null; return gigabytes(t) || 1; },
      display: (v) => (v > 1 ? `microSD up to ${v >= 1024 ? `${v / 1024} TB` : `${v} GB`}` : 'microSD slot (ceiling not stated)'), plausible: (v) => (v >= 1 && v <= 2048) || `${v} GB is not a plausible card ceiling`, points: (v) => (v >= 256 ? 1 : v >= 128 ? 0.9 : v >= 64 ? 0.8 : 0.6) },
    T.weightField({ min: 5, max: 1500, light: 60, mid: 160, label: 'Weight (as stated)' }),
    { key: 'ip', label: 'Water / dust rating (IP)', group: 'Protection', dim: 'safety', weight: 2.5, title: true,
      listing: ['Water Resistance', 'Water Resistant', 'Waterproof', 'IP Rating', 'Ip Rating', 'Water Resistance Level', 'Protection Rating', 'Waterproof Rating', 'Weather Resistance', 'Special Feature', 'Features', 'Other Features', 'Additional Features', 'Water Resistance Depth'], official: ['ip rating', 'ipx', 'ip6', 'ip5', 'water resistance', 'waterproof'],
      parse: ipRating, display: (v) => v, points: (v) => { const w = Number(v[3]); return w >= 8 ? 1 : w >= 7 ? 0.95 : w >= 6 ? 0.85 : w >= 5 ? 0.75 : 0.5; } },
    { key: 'depth', label: 'Waterproof depth (no case)', group: 'Protection', dim: 'safety', weight: 2, title: true,
      listing: ['Waterproof Depth', 'Water Resistance Depth', 'Waterproof To', 'Underwater Depth', 'Maximum Depth', 'Water Resistance', 'Waterproof', 'Water Resistance Level', 'Special Feature', 'Features', 'Other Features'], official: ['waterproof', 'water resistance', 'depth', 'underwater'],
      parse: (s) => { const t = String(s); if (/^\s*\d+(?:\.\d+)?\s*(?:m|mtrs?|metres?|meters?|ft|feet)\s*(?:\(\s*\d+(?:\.\d+)?\s*(?:m|mtrs?|metres?|meters?|ft|feet)\s*\))?\s*$/i.test(t)) return metresDepth(t); if (!/water|depth|underwater|submers|dive|diving/i.test(t)) return null; if (/case|housing/i.test(t) && !/without\s*(?:a\s*|the\s*)?(?:\w+\s*)?(?:case|housing)/i.test(t)) return null; return metresDepth(t); },
      // Reads the maker page as a whole: an explicit body-only depth ("5 m body waterproof", "without a case: 10 m",
      // "waterproof to 33ft (10m) right out of the box") settles the value; a depth stated only with the case /
      // housing and no body-only statement rules the field out, so a bare "Waterproof: 30 m" row is not credited.
      officialRule: (o) => {
        const all = [...Object.entries(o.kv || {}).flatMap(([k, v]) => [k, v]), o.text || ''].join('\n').replace(/(\d{1,3})\s*ft\s*\((\d{1,3})\s*m\)/gi, '$2 m').replace(/(\d{1,3})\s*m\s*\((\d{1,3})\s*ft\)/gi, '$1 m');
        const D = '(\\d{1,3})\\s*(?:m|metres?|meters?)\\b';
        const CASE = '(?:a\\s*|the\\s*)?(?:\\w+\\s*){0,2}?(?:case|housing)';
        const nums = (re) => [...all.matchAll(re)].map((m) => Number(m[1])).filter((n) => n >= 1 && n <= 60);
        const body = nums(new RegExp(`${D}[^.\\n]{0,25}?\\bwithout\\s*${CASE}`, 'gi'))
          .concat(nums(new RegExp(`without\\s*${CASE}\\s*:?\\s*${D}`, 'gi')))
          .concat(nums(new RegExp(`${D}\\s*(?:of\\s*)?body[-\\s]*(?:only|waterproof|water\\s*resist)`, 'gi')))
          .concat(nums(new RegExp(`body[-\\s]*(?:only\\s*)?waterproof\\w*\\s*(?:to|rating|:)?\\s*${D}`, 'gi')))
          .concat(nums(new RegExp(`waterproof\\s*(?:to|up\\s*to)?\\s*${D}[^.\\n]{0,30}?(?:out\\s*of\\s*the\\s*box|no\\s*(?:case|housing)\\s*(?:needed|required))`, 'gi')));
        const withCase = nums(new RegExp(`${D}[^.\\n]{0,40}?\\bwith\\s*${CASE}`, 'gi')).concat(nums(new RegExp(`(?:case|housing)[^.\\n]{0,30}?${D}`, 'gi')));
        const stated = nums(new RegExp(`(?:waterproof|water\\s*resist\\w*|depth|underwater|dive)[^.\\n]{0,30}?${D}`, 'gi')).concat(nums(new RegExp(`${D}\\s*(?:waterproof|water\\s*resist|underwater|depth)`, 'gi')));
        if (body.length) return { value: Math.min(...body), note: `Maker page states ${Math.min(...body)} m for the body itself${withCase.length ? ` and ${Math.max(...withCase)} m with the case` : ''}` };
        if (withCase.length && stated.every((n) => withCase.includes(n))) return { veto: 'Maker page states its waterproof depth only with the case / housing — no body-only depth is credited' };
        return null;
      },
      display: (v) => `${v} m without a case`, plausible: (v) => (v >= 1 && v <= 60) || `${v} m is not a plausible body-only depth`, points: (v) => (v >= 15 ? 1 : v >= 10 ? 0.9 : v >= 5 ? 0.8 : 0.6) },
    T.feature('wcase', 'Waterproof case included', 'Protection', /waterproof\s*(?:case|housing)|dive\s*(?:case|housing)|underwater\s*(?:case|housing)|(?:case|housing)\s*(?:for\s*)?(?:up\s*to\s*)?\d{2,3}\s*m/i, { dim: 'safety', weight: 1, listing: ['In the Box', 'Sales Package', 'Included Components', 'Accessories Included', 'Special Feature', 'Features', 'Other Features', 'What is in the box', 'Box Contents'], official: ['in the box', 'included', 'waterproof case', 'housing'], noPts: 0.3 }),
    T.feature('cert', 'Safety certification stated (BIS / CE / FCC)', 'Protection', /\bbis\b|\bce\b|\brohs\b|\bfcc\b|\bul\b|\bwpc\b|certif/i, { dim: 'safety', weight: 1, listing: ['Certification', 'Certifications', 'Standards', 'Safety Standard', 'Compliance'], official: ['certif', 'bis', 'ce', 'rohs'], noPts: 0 }),
    T.feature('wifi', 'Wi-Fi / Bluetooth app transfer', 'Workflow', WIFI, { weight: 1.5, listing: ['Wi-Fi', 'WiFi', 'Wireless', 'Wireless Connectivity', 'Wireless Technology', 'Connectivity', 'Connectivity Technology', 'Connectivity Type', 'Network Interface Type', 'Remote Connectivity', 'Bluetooth', 'App Support', 'Mobile Compatibility', 'Other Connectivity Features', 'Special Feature', 'Features', 'Other Features', 'Key Features'], official: ['wi-fi', 'wifi', 'bluetooth', 'app', 'connectivity'], noPts: 0.2 }),
    T.feature('timelapse', 'Time-lapse / interval capture', 'Workflow', TIMELAPSE, { weight: 1.5, listing: ['Time Lapse', 'Timelapse', 'Time-Lapse', 'Shooting Modes', 'Record Modes', 'Recording Modes', 'Video Modes', 'Photo Modes', 'Modes', 'Special Feature', 'Features', 'Other Features', 'Key Features', 'Other Video Features'], official: ['time-lapse', 'timelapse', 'time lapse', 'interval', 'modes', 'shooting modes'], noPts: 0.2 }),
    T.feature('loop', 'Loop recording', 'Workflow', LOOP, { weight: 1, listing: ['Loop Recording', 'Record Modes', 'Recording Modes', 'Video Modes', 'Special Feature', 'Features', 'Other Features', 'Key Features', 'Other Video Features', 'Other Convenience Features'], official: ['loop recording', 'loop', 'modes'], noPts: 0.3 }),
    T.feature('cloud', 'Cloud / auto-backup stated', 'Workflow', CLOUD, { weight: 1, listing: ['Cloud Storage', 'Cloud', 'Storage Type', 'Auto Upload', 'Backup', 'Special Feature', 'Features', 'Other Features', 'Key Features', 'Other Connectivity Features', 'Other Convenience Features'], official: ['cloud', 'auto upload', 'backup', 'quick transfer', 'auto download'], noPts: 0.3 }),
    T.feature('screen', 'Screen', 'Body', SCREEN, { weight: 0.5, listing: ['Display', 'Screen', 'Screen Size', 'Display Size', 'Display Type', 'Touch Screen', 'Touchscreen', 'Special Feature', 'Features', 'Other Features'], official: ['display', 'screen', 'touchscreen'], noPts: 0.5 }),
    T.feature('night', 'Night vision / IR', 'Body', NIGHT, { weight: 0.5, listing: ['Night Vision', 'IR Distance', 'Number of IR LEDs', 'Low Light', 'Special Feature', 'Features', 'Other Features', 'Key Features'], official: ['night vision', 'infrared', 'ir'], noPts: 0.5 }),
    T.feature('mount', 'Clip / magnet / mount stated', 'Body', MOUNT, { weight: 1, listing: ['Mounting Type', 'Mount Type', 'Mounting', 'In the Box', 'Sales Package', 'Included Components', 'Special Feature', 'Features', 'Other Features', 'Key Features'], official: ['mount', 'clip', 'magnetic', 'in the box', 'included'], noPts: 0.3 }),
    T.feature('mic', 'Microphone / audio recording', 'Body', MIC, { weight: 0.5, listing: ['Microphone', 'Audio Recording', 'Audio', 'Built-in Microphone', 'Special Feature', 'Features', 'Other Features', 'Key Features', 'Other Audio Features'], official: ['microphone', 'audio', 'mic'], noPts: 0.4 }),
    { key: 'warranty', label: 'Warranty', group: 'Support', dim: 'maker', weight: 0, title: true,
      listing: ['Warranty Summary', 'Warranty', 'Domestic Warranty', 'Warranty Period', 'Manufacturer Warranty', 'Covered in Warranty'], official: ['warranty', 'warranty period', 'guarantee'],
      parse: warrantyMonths, display: (v) => (v % 12 === 0 ? `${v / 12} year${v > 12 ? 's' : ''}` : `${v} months`), plausible: (v) => (v <= 60 && v >= 1) || `${v} months warranty is not plausible` },
  ],
  match: {
    descriptive: [...T.DESCRIPTIVE, 'polar', 'camera', 'cameras', 'cam', 'action', 'mini', 'body', 'wearable', 'sports', 'video', 'recorder', 'recording', 'hd', 'full', '4k', '1080p', 'wifi', 'wireless', 'portable', 'small', 'magnetic', 'clip', 'night', 'vision', 'rechargeable', 'battery', 'audio', 'digital', 'smart', 'edition', 'bundle', 'standard', 'combo', 'creator', 'adventure', 'kit', 'gb', 'mp', 'megapixel', 'touch', 'screen', 'waterproof', 'underwater'],
    // "mini" tells GoPro's HERO11 Black Mini from the HERO11 Black; "pocket" tells Osmo Pocket from Osmo Action.
    keep: ['pocket', 'mini'],
    makerBundles: /\b(?:(?:standard|essentials?|creator|adventure|vlog|travel|motorcycle|bike|dive|action|starter|content|accessories|retro)\s*(?:combo|bundle|kit)|ultra\s*wide\s*edition|special\s*(?:edition|bundle))\b/i,
    // Mounts, cards, spare batteries and cases ship in camera boxes ("with Helmet Mount Kits", "64GB SD Card") and do
    // not change which camera the listing is; accessory-only listings are already rejected by the classifier.
    bundleNouns: ['drone', 'microphone', 'power bank', 'gimbal stabilizer'],
    numeric: [
      { label: 'MP', show: (v) => `${v} MP`, tol: 0.05, listing: (l) => megapixels(`${(l.listingSpec || {})['Effective Pixels'] || (l.listingSpec || {})['Camera Resolution'] || ''}`), catalog: (c) => megapixels(`${c.kv['Effective Pixels'] || c.kv['Photo Resolution'] || c.kv['Sensor Resolution'] || ''}`) },
    ],
  },
  officialProse: {
    'sensor MP (page text)': (t) => { const m = /(\d{1,3}(?:\.\d+)?)\s*-?\s*(?:mp|megapixels?)\b/i.exec(t); return m ? m[0] : null; },
    // "1/4\" screw mount" / "1/4-20" are tripod threads, not sensors; only take a fraction that sits next to a sensor word.
    'sensor size (page text)': (t) => { const m = /(?:sensor|cmos)[^.\n]{0,40}?(1\s*\/\s*\d(?:\.\d+)?\s*(?:["”]|inch|-inch|type))/i.exec(t) || /(1\s*\/\s*\d(?:\.\d+)?\s*(?:["”]|inch|-inch|type))[^.\n]{0,40}?(?:sensor|cmos)/i.exec(t) || /\b1\s*-?\s*inch\b(?=[^.\n]{0,30}(?:sensor|cmos))/i.exec(t); return m ? (m[1] || m[0]) : null; },
    'video (page text)': (t) => { const m = /\b(8k|5\.3k|5k|4k|2\.7k|1080p|720p)\b/i.exec(t); return m ? m[0].toUpperCase() : null; },
    'battery (page text)': (t) => { const m = /(\d{3,4})\s*mah/i.exec(t); return m ? m[0] : null; },
    'recording time (page text)': (t) => { const m = /(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?|min|minutes?)\b[^.]{0,30}(?:record|video|battery)/i.exec(t) || /(?:record|video|battery)[^.]{0,30}?(\d+(?:\.\d+)?)\s*(?:h|hrs?|hours?|min|minutes?)\b/i.exec(t); return m ? m[0] : null; },
    'storage (page text)': (t) => { const m = /(\d{2,4})\s*gb\b[^.]{0,20}(?:built[-\s]?in|internal|storage|memory)/i.exec(t) || /(?:built[-\s]?in|internal)\s*(?:storage|memory)[^.]{0,20}?(\d{2,4})\s*gb\b/i.exec(t); return m ? m[0] : null; },
    'microSD (page text)': (t) => { const m = /micro\s*-?\s*sd[^.]{0,40}?(\d{2,4})\s*gb/i.exec(t) || /(\d{2,4})\s*gb[^.]{0,20}micro\s*-?\s*sd/i.exec(t); return m ? m[0] : /micro\s*-?\s*sd/i.test(t) ? 'microSD' : null; },
    // "30 meters waterproof\nwith case": the depth only holds inside the housing, so the qualifier that follows is kept.
    'waterproof (page text)': (t) => { const m = /(?:waterproof|water\s*resist\w*)[^.]{0,30}?(\d{1,3})\s*(?:m|metres?|meters?)\b(\s*\(?\s*with(?:out)?\s*(?:a\s*|the\s*)?(?:dive\s*|waterproof\s*|protective\s*)?(?:case|housing)\)?)?/i.exec(t) || /(\d{1,3})\s*(?:m|metres?|meters?)\s*(?:waterproof|water\s*resist\w*)(\s*\(?\s*with(?:out)?\s*(?:a\s*|the\s*)?(?:dive\s*|waterproof\s*|protective\s*)?(?:case|housing)\)?)?/i.exec(t); return m ? m[0].replace(/\s+/g, ' ') : ipRating(t); },
    // "2.4G/5G Wi-Fi", "4G", "5G" are radio bands, not grams: a weight needs a weight word nearby or a value ≥ 10.
    'weight (page text)': (t) => { const m = /(?:weigh[st]?|weight)[^.\n]{0,40}?(\d{1,4}(?:\.\d+)?)\s*(?:g|gm|grams?)\b/i.exec(t) || /(\d{1,4}(?:\.\d+)?)\s*(?:g|gm|grams?)\b(?=[^.\n]{0,20}(?:weigh|\(|light))/i.exec(t) || /(?<!(?:sd|card|memory|storage|support|up to)[^.\n]{0,15})(?<![\w-])(\d{2,4}(?:\.\d+)?)\s*(?:g|gm|grams?)\b(?!\s*[/-]\s*\d|hz|b)(?![^.\n]{0,12}\b(?:card|storage|memory|tf|sd|built-in))/i.exec(t); return m && !/^(?:2\.4|5|4|3)$/.test(m[1]) ? `${m[1]} g` : null; },
    'time-lapse (page text)': (t) => (TIMELAPSE.test(t) ? 'Yes' : null),
    'auto-backup / cloud (page text)': (t) => { const m = CLOUD.exec(t); return m ? m[0] : null; },
    'app transfer (page text)': (t) => (WIFI.test(t) ? 'Yes' : null),
  },
  facets: [
    { group: 'form', label: 'Form', hint: 'Read from the title or spec table', of: (F) => (F.form && F.form.value ? F.form.value : null), labels: FORM_LABEL },
    { group: 'mp', label: 'Sensor MP', hint: 'Stated effective megapixels, spec row or maker page', of: (F) => (F.mp && F.mp.tier !== 'claimed' && F.mp.tier !== 'rejected' ? (F.mp.value >= 12 ? '12' : F.mp.value >= 5 ? '5' : '0') : null), labels: { 12: '12 MP +', 5: '5–11 MP', 0: 'Under 5 MP' } },
    { group: 'video', label: 'Video', hint: 'Stated max resolution', of: (F) => (F.video && F.video.tier !== 'claimed' && F.video.tier !== 'rejected' ? (F.video.value >= 2160 ? '4k' : F.video.value >= 1080 ? '1080' : '720') : null), labels: { '4k': '4K or higher', 1080: '1080p–2.7K', 720: '720p or lower' } },
    { group: 'store', label: 'Storage', hint: 'Spec row or maker page', multi: true, of: (F) => [F.storage && F.storage.tier !== 'claimed' && F.storage.tier !== 'rejected' ? 'builtin' : null, F.card && F.card.tier !== 'claimed' && F.card.tier !== 'rejected' ? 'microsd' : null].filter(Boolean), labels: { builtin: 'Built-in memory', microsd: 'microSD slot' } },
    { group: 'water', label: 'Water', hint: 'IP code or body-only depth stated', of: (F) => (F.depth && F.depth.tier !== 'claimed' && F.depth.tier !== 'rejected' ? 'depth' : F.ip && F.ip.tier !== 'claimed' ? (Number(F.ip.value[3]) >= 7 ? 'ipx7' : 'ipx4') : null), labels: { depth: 'Waterproof body (depth stated)', ipx7: 'IPX7 / IP68', ipx4: 'IPX4–IPX6 (splash)' } },
    { group: 'fx', label: 'Workflow features', hint: 'Spec row or maker page', multi: true,
      of: (F) => [F.wifi && F.wifi.value && F.wifi.tier !== 'claimed' ? 'wifi' : null, F.timelapse && F.timelapse.value && F.timelapse.tier !== 'claimed' ? 'timelapse' : null, F.loop && F.loop.value && F.loop.tier !== 'claimed' ? 'loop' : null, F.cloud && F.cloud.value && F.cloud.tier !== 'claimed' ? 'cloud' : null, F.stab && F.stab.value && F.stab.tier !== 'claimed' ? 'stab' : null, F.mount && F.mount.value && F.mount.tier !== 'claimed' ? 'mount' : null].filter(Boolean),
      labels: { wifi: 'App transfer (Wi-Fi / BT)', timelapse: 'Time-lapse / interval', loop: 'Loop recording', cloud: 'Cloud / auto-backup', stab: 'Stabilisation', mount: 'Clip / magnet / mount' } },
    { group: 'wt', label: 'Weight', hint: 'Stated', of: (F) => (F.weight && F.weight.tier !== 'claimed' && F.weight.tier !== 'rejected' ? (F.weight.value <= 60 ? '60' : F.weight.value <= 160 ? '160' : 'heavy') : null), labels: { 60: 'Under 60 g', 160: '60–160 g', heavy: 'Over 160 g' } },
  ],
  featured: ['seg:action', 'seg:thumb', 'seg:body', 'seg:mini', 'mp:12', 'video:4k', 'store:builtin', 'fx:timelapse', 'fx:cloud', 'water:depth', 'wt:60', 'ev:official', 'maker:global'],
  lines: {
    q: (F) => [F.mp && F.mp.tier !== 'rejected' ? F.mp.display : null, F.sensor && F.sensor.tier !== 'rejected' ? F.sensor.display : null, F.video && F.video.tier !== 'rejected' ? F.video.display : null].filter(Boolean).join(' · '),
    f: (F) => [F.capacity && F.capacity.tier !== 'rejected' ? F.capacity.display : null, F.runtime && F.runtime.tier !== 'rejected' ? `${F.runtime.display} rec` : null, F.storage && F.storage.tier !== 'rejected' ? `${F.storage.display} built-in` : F.card && F.card.tier !== 'rejected' ? 'microSD' : null, F.weight && F.weight.tier !== 'rejected' ? F.weight.display : null, F.timelapse && F.timelapse.value ? 'time-lapse' : null, F.cloud && F.cloud.value ? 'auto-backup stated' : null].filter(Boolean).join(' · '),
  },
};
