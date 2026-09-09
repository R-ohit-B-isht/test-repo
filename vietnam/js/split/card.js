import { livePeople, personOf } from './model.js';
import { balances, settleUp, totals } from './math.js';
import { TRIP } from '../data/trip.js';
import { W, PAD, PAPER, inr, avatar, clip, fontsReady, stamp, toBlob, sharePng } from '../canvas.js';

// Settle-up card as an image (Splitwise's shareable "who owes who"). Drawn on
// a canvas from the live ledger, then handed to the Web Share sheet as a PNG
// when the browser allows files, else downloaded. Names + rupee figures only:
// no notes, receipts or row titles leave the device.

// Layout → { canvas, blob }. Height grows with the number of rows.
export async function drawSettleCard(state) {
  const people = livePeople(state);
  const net = balances(state);
  const pays = settleUp(net);
  const t = totals(state);
  const ROW = 88;
  const H = 330 + people.length * ROW + (pays.length ? 96 + pays.length * ROW : 120) + 150;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  await fontsReady();

  ctx.fillStyle = PAPER.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAPER.lantern; ctx.fillRect(0, 0, W, 10);

  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PAPER.mute; ctx.font = '500 26px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText('VIETNAM · WHO OWES WHO', PAD, 110);
  ctx.fillStyle = PAPER.ink; ctx.font = '600 72px Fraunces, Georgia, serif';
  ctx.fillText(inr(t.total), PAD, 200);
  ctx.fillStyle = PAPER.mute; ctx.font = '400 30px Inter, system-ui, sans-serif';
  ctx.fillText(`spent together · ${t.count} rows · ${TRIP.subtitle.split('.')[0]}`, PAD, 250);

  let y = 330;
  ctx.strokeStyle = PAPER.line; ctx.lineWidth = 2;
  people.forEach((p) => {
    avatar(ctx, p, PAD + 28, y - 10, 28);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PAPER.ink; ctx.font = '500 34px Inter, system-ui, sans-serif';
    ctx.fillText(clip(ctx, p.name, 520), PAD + 80, y + 2);
    const n = net[p.id] || 0;
    ctx.textAlign = 'right';
    ctx.fillStyle = n > 0 ? PAPER.jade : n < 0 ? PAPER.lantern : PAPER.mute;
    ctx.font = '600 36px Inter, system-ui, sans-serif';
    ctx.fillText(n === 0 ? 'settled' : inr(Math.abs(n)), W - PAD, y + 2);
    if (n !== 0) { ctx.font = '500 22px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = PAPER.mute; ctx.fillText(n > 0 ? 'GETS BACK' : 'OWES', W - PAD, y + 34); }
    ctx.beginPath(); ctx.moveTo(PAD, y + 52); ctx.lineTo(W - PAD, y + 52); ctx.stroke();
    y += ROW;
  });

  y += 40;
  if (pays.length) {
    const boxH = 60 + pays.length * ROW;
    ctx.fillStyle = PAPER.soft;
    ctx.beginPath(); ctx.roundRect(PAD - 24, y - 40, W - 2 * (PAD - 24), boxH, 24); ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = PAPER.mute; ctx.font = '500 24px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillText(pays.length > 1 ? `${pays.length} PAYMENTS CLEAR IT` : '1 PAYMENT CLEARS IT', PAD, y + 4);
    y += 66;
    pays.forEach((p) => {
      avatar(ctx, personOf(state, p.from), PAD + 24, y - 6, 24);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = PAPER.ink; ctx.font = '500 32px Inter, system-ui, sans-serif';
      const from = clip(ctx, personOf(state, p.from)?.name || 'Someone', 260);
      ctx.fillText(from, PAD + 64, y + 4);
      const fx = PAD + 64 + ctx.measureText(from).width + 20;
      ctx.fillStyle = PAPER.mute; ctx.fillText('→', fx, y + 4);
      avatar(ctx, personOf(state, p.to), fx + 60, y - 6, 24);
      ctx.fillStyle = PAPER.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.font = '500 32px Inter, system-ui, sans-serif';
      ctx.fillText(clip(ctx, personOf(state, p.to)?.name || 'Someone', 260), fx + 100, y + 4);
      ctx.textAlign = 'right'; ctx.font = '600 36px Inter, system-ui, sans-serif';
      ctx.fillText(inr(p.inr), W - PAD, y + 4);
      y += ROW;
    });
  } else {
    ctx.textAlign = 'left'; ctx.fillStyle = PAPER.jade; ctx.font = '600 34px Inter, system-ui, sans-serif';
    ctx.fillText('All settled ✓', PAD, y + 4);
    y += 80;
  }

  stamp(ctx, H, 'who owes who');
  const blob = await toBlob(c);
  return { canvas: c, blob };
}

// Share sheet with the PNG when possible, else save it. Returns how it went.
export async function shareSettleCard(state) {
  const { blob } = await drawSettleCard(state);
  return sharePng(blob, 'vietnam-settle-up.png', 'Vietnam · who owes who');
}
