import { computeBudget } from '../budget.js';
import { tripScore, standings } from '../score.js';
import { TRIP } from '../data/trip.js';
import { W, PAD, PAPER, FONT, avatar, clip, fontsReady, stamp, toBlob, sharePng } from '../canvas.js';

// The score board as one image for the group chat: plan score + tier, points
// per day, and the standings. Names and points only — no rupees from the
// ledger, no docs, no pins.

export async function drawScoreCard(state) {
  const plan = computeBudget(state).plan;
  const score = tripScore(state, plan);
  const st = standings(state, plan);
  const ROW = 84;
  const H = 560 + (st.rows.length ? 80 + st.rows.length * ROW : 100) + 120;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  await fontsReady();

  ctx.fillStyle = PAPER.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAPER.jade; ctx.fillRect(0, 0, W, 14);

  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  ctx.fillStyle = PAPER.mute; ctx.font = FONT.mono(24);
  ctx.fillText('TRIP SCORE · VIETNAM', PAD, 92);
  ctx.fillStyle = PAPER.ink; ctx.font = FONT.display(148, 600);
  ctx.fillText(String(score.pts), PAD - 6, 240);
  const w = ctx.measureText(String(score.pts)).width;
  ctx.font = FONT.ui(36, 500); ctx.fillStyle = PAPER.mute; ctx.fillText('pts', PAD + w + 10, 240);
  ctx.fillStyle = PAPER.lantern; ctx.font = FONT.display(48, 600);
  ctx.fillText(score.tier.label, PAD, 310);
  ctx.fillStyle = PAPER.mute; ctx.font = FONT.ui(26);
  ctx.fillText(clip(ctx, `${TRIP.subtitle.split('.')[0]} · ${score.fun} fun picks · ${score.next ? `${score.next.min - score.pts} to ${score.next.label}` : 'top tier'}`, W - PAD * 2), PAD, 352);

  // Day bars.
  const top = 410; const barH = 96; const gap = 14;
  const bw = (W - PAD * 2 - gap * (score.days.length - 1)) / score.days.length;
  const max = Math.max(1, ...score.days.map((d) => d.pts));
  score.days.forEach((d, i) => {
    const x = PAD + i * (bw + gap);
    const h = Math.max(6, Math.round((d.pts / max) * barH));
    ctx.fillStyle = PAPER.soft; ctx.fillRect(x, top, bw, barH);
    ctx.fillStyle = d.n === score.best.n ? PAPER.lantern : PAPER.jade; ctx.fillRect(x, top + barH - h, bw, h);
    ctx.textAlign = 'center'; ctx.fillStyle = PAPER.ink; ctx.font = FONT.mono(22, 600);
    ctx.fillText(String(d.pts), x + bw / 2, top + barH + 30);
    ctx.fillStyle = PAPER.mute; ctx.font = FONT.mono(18);
    ctx.fillText(`D${d.n}`, x + bw / 2, top + barH + 54);
  });

  // Standings.
  let y = top + barH + 110;
  ctx.textAlign = 'left'; ctx.fillStyle = PAPER.mute; ctx.font = FONT.mono(22);
  ctx.fillText(st.rows.length ? 'STANDINGS' : 'STANDINGS · no one on the board yet', PAD, y);
  ctx.fillStyle = PAPER.line; ctx.fillRect(PAD, y + 16, W - PAD * 2, 2);
  y += 60;
  st.rows.forEach((r, i) => {
    if (i === st.split && st.split) { ctx.fillStyle = PAPER.lantern; ctx.fillRect(PAD, y - 46, W - PAD * 2, 2); }
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = r.rank === 1 && r.total > 0 ? PAPER.lantern : PAPER.mute; ctx.font = FONT.mono(28, 600);
    ctx.fillText(String(r.rank), PAD, y);
    avatar(ctx, r.p, PAD + 84, y, 26);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = PAPER.ink; ctx.font = FONT.ui(30, r.p.id === state.me ? 600 : 400);
    ctx.fillText(clip(ctx, r.p.name, 420), PAD + 130, y);
    ctx.fillStyle = PAPER.mute; ctx.font = FONT.mono(22);
    ctx.textAlign = 'right';
    ctx.fillText(`${r.cols.planned} · ${r.cols.paid} · ${r.cols.showed}`, W - PAD - 150, y);
    ctx.fillStyle = PAPER.ink; ctx.font = FONT.mono(34, 600);
    ctx.fillText(String(r.total), W - PAD, y);
    y += ROW;
  });
  if (st.rows.length) {
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = PAPER.mute; ctx.font = FONT.mono(18);
    ctx.fillText('planned · paid · showed', W - PAD - 150, y - 30);
  }

  stamp(ctx, H, 'trip score');
  const blob = await toBlob(c);
  return { canvas: c, blob };
}

export async function shareScoreCard(state) {
  const { blob } = await drawScoreCard(state);
  return sharePng(blob, 'vietnam-trip-score.png', 'Vietnam · trip score');
}
