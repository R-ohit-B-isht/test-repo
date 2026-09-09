// Minimal EXIF reader: only DateTimeOriginal (0x9003) from a JPEG's APP1
// segment. The first 128 KB is enough for every camera/phone we know of; a
// file without it (screenshots, PNG, WebP) simply returns null and the
// journal falls back to the file's modified time.

const TAG_EXIF_IFD = 0x8769;
const TAG_DATE_ORIGINAL = 0x9003;
const TAG_DATE_DIGITIZED = 0x9004;
const TAG_DATE = 0x0132;

const ascii = (view, at, len) => {
  let s = '';
  for (let i = 0; i < len; i += 1) {
    const c = view.getUint8(at + i);
    if (!c) break;
    s += String.fromCharCode(c);
  }
  return s;
};

// "YYYY:MM:DD HH:MM:SS" (camera local time) → ms, or null when it is the
// all-zero placeholder some cameras write.
export const parseExifDate = (s) => {
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(s || '');
  if (!m) return null;
  const [, y, mo, d, h, mi, se] = m.map(Number);
  if (!y || !mo || !d) return null;
  const t = new Date(y, mo - 1, d, h, mi, se).getTime();
  return Number.isNaN(t) ? null : t;
};

const readIfd = (view, tiff, ifd, le, want) => {
  if (ifd + 2 > view.byteLength) return {};
  const count = view.getUint16(ifd, le);
  const out = {};
  for (let i = 0; i < count; i += 1) {
    const e = ifd + 2 + i * 12;
    if (e + 12 > view.byteLength) break;
    const tag = view.getUint16(e, le);
    if (!want.has(tag)) continue;
    const type = view.getUint16(e + 2, le);
    const n = view.getUint32(e + 4, le);
    if (tag === TAG_EXIF_IFD) { out[tag] = view.getUint32(e + 8, le); continue; }
    if (type !== 2) continue;
    const at = n > 4 ? tiff + view.getUint32(e + 8, le) : e + 8;
    if (at + n <= view.byteLength) out[tag] = ascii(view, at, n);
  }
  return out;
};

export const exifTaken = (buffer) => {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;
  let off = 2;
  while (off + 4 <= view.byteLength) {
    const marker = view.getUint16(off);
    if ((marker & 0xff00) !== 0xff00) return null;
    const len = view.getUint16(off + 2);
    if (marker === 0xffe1 && ascii(view, off + 4, 4) === 'Exif') {
      const tiff = off + 10;
      if (tiff + 8 > view.byteLength) return null;
      const bom = view.getUint16(tiff);
      if (bom !== 0x4949 && bom !== 0x4d4d) return null;
      const le = bom === 0x4949;
      const ifd0 = readIfd(view, tiff, tiff + view.getUint32(tiff + 4, le), le, new Set([TAG_EXIF_IFD, TAG_DATE]));
      const sub = ifd0[TAG_EXIF_IFD] != null ? readIfd(view, tiff, tiff + ifd0[TAG_EXIF_IFD], le, new Set([TAG_DATE_ORIGINAL, TAG_DATE_DIGITIZED])) : {};
      return parseExifDate(sub[TAG_DATE_ORIGINAL]) || parseExifDate(sub[TAG_DATE_DIGITIZED]) || parseExifDate(ifd0[TAG_DATE]);
    }
    if (marker === 0xffda) return null; // start of scan: no EXIF ahead
    off += 2 + len;
  }
  return null;
};

export async function takenAt(file) {
  if (!/jpe?g/i.test(file.type) && !/\.jpe?g$/i.test(file.name)) return null;
  try {
    return exifTaken(await file.slice(0, 131072).arrayBuffer());
  } catch {
    return null;
  }
}
