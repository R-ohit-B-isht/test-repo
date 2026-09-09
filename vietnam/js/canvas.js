// Shared bits for the share-as-image cards (Split settle-up, Score board):
// one paper palette, the avatar disc, text clipping and the share-or-save step.

export const W = 1080;
export const PAD = 72;
export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN');
export const hsl = (h, s, l) => `hsl(${h} ${s}% ${l}%)`;

export const PAPER = { bg: '#f6f1e7', ink: '#1b1a17', mute: '#6f6a60', line: '#e3dccb', jade: '#1f7a5c', lantern: '#d64a1f', soft: '#efe8d8', sun: '#c98a12' };

export const FONT = {
  mono: (px, w = 500) => `${w} ${px}px "JetBrains Mono", ui-monospace, monospace`,
  ui: (px, w = 400) => `${w} ${px}px Inter, system-ui, sans-serif`,
  display: (px, w = 600) => `${w} ${px}px Fraunces, Georgia, serif`,
};

export const fontsReady = () => (document.fonts?.ready || Promise.resolve());

export function avatar(ctx, p, x, y, r) {
  const h = p?.hue ?? 14;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = p ? hsl(h, 70, 82) : PAPER.soft; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = p ? `hsl(${h} 45% 60% / 0.5)` : PAPER.line; ctx.stroke();
  ctx.fillStyle = p ? hsl(h, 45, 22) : PAPER.mute;
  ctx.font = FONT.ui(Math.round(r * 0.9), 600);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText((p?.name || '?').trim().charAt(0).toUpperCase(), x, y + 2);
}

export const clip = (ctx, s, max) => { let t = s; while (t.length > 1 && ctx.measureText(t).width > max) t = t.slice(0, -1); return t === s ? s : `${t.slice(0, -1)}…`; };

export const stamp = (ctx, H, what) => {
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PAPER.mute; ctx.font = FONT.ui(24);
  const d = new Date();
  ctx.fillText(`${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · ${what} · from the Vietnam planner`, PAD, H - 60);
};

export const toBlob = (c) => new Promise((res) => c.toBlob(res, 'image/png'));

// Share sheet with the PNG when the browser allows files, else download it.
// Returns 'shared' | 'cancelled' | 'saved'.
export async function sharePng(blob, name, title) {
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'saved';
}
