// render.js — every pixel of the heist, drawn on one canvas.
// Visual language: safe floor is deep blue, cover is dark slate with gold
// trim, danger is red (cones, cameras, alarm), loot is gold, the exit is green.

import { CONE_RANGE, CONE_HALF_ANGLE } from './guards.js';

function drawCone(ctx, x, y, facing, range, halfAngle, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = alpha * 1.6;
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing - halfAngle) * range, y + Math.sin(facing - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing + halfAngle) * range, y + Math.sin(facing + halfAngle) * range);
  ctx.stroke();
  ctx.restore();
}

function drawWall(ctx, w) {
  ctx.fillStyle = '#232a4a';
  ctx.fillRect(w.x, w.y, w.w, w.h);
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2;
  ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(w.x + 3, w.y + 3, w.w - 6, 5);
}

function drawLoot(ctx, l, time) {
  if (l.taken) return;
  const pulse = 1 + Math.sin(time * 4 + l.x) * 0.12;
  const r = (l.kind === 'big' ? 13 : 9) * pulse;
  ctx.save();
  ctx.translate(l.x, l.y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = '#ffd75e';
  ctx.shadowColor = '#ffd75e'; ctx.shadowBlur = 18;
  ctx.fillRect(-r / 1.4, -r / 1.4, r * 1.4, r * 1.4);
  ctx.restore();
  ctx.fillStyle = '#fff3c4';
  ctx.font = 'bold 11px Verdana'; ctx.textAlign = 'center';
  ctx.fillText('$' + l.value, l.x, l.y - r - 6);
}

function drawGuard(ctx, g, time) {
  const alert = g.alert;
  const coneColor = alert > 0.6 ? '#ff3b3b' : alert > 0.25 ? '#ff9a3d' : '#ffe14d';
  drawCone(ctx, g.x, g.y, g.facing, CONE_RANGE, CONE_HALF_ANGLE, coneColor, 0.16 + alert * 0.14);
  // body: navy uniform, red when alerted
  ctx.fillStyle = alert > 0.6 ? '#a31212' : '#1d3a6e';
  ctx.beginPath(); ctx.arc(g.x, g.y, 15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#dfe6ff'; ctx.lineWidth = 2; ctx.stroke();
  // facing tick + flashlight dot
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.facing) * 20, g.y + Math.sin(g.facing) * 20); ctx.stroke();
  ctx.fillStyle = '#ffe14d';
  ctx.beginPath(); ctx.arc(g.x + Math.cos(g.facing) * 22, g.y + Math.sin(g.facing) * 22, 3, 0, Math.PI * 2); ctx.fill();
  if (alert > 0.25) {
    ctx.fillStyle = alert > 0.6 ? '#ff3b3b' : '#ff9a3d';
    ctx.font = 'bold 20px Verdana'; ctx.textAlign = 'center';
    ctx.fillText(alert > 0.6 ? '!' : '?', g.x, g.y - 22);
  }
  ctx.fillStyle = '#c9cde0'; ctx.font = '10px Verdana'; ctx.textAlign = 'center';
  ctx.fillText(g.state === 'chase' ? 'GUARD — CHASE' : g.state === 'investigate' ? 'GUARD — CHECKING' : 'GUARD', g.x, g.y + 28);
}

function drawCamera(ctx, cam, time, now) {
  const disabled = now < cam.disabledUntil;
  const color = disabled ? '#5a6b8a' : '#ff3b3b';
  if (!disabled) drawCone(ctx, cam.x, cam.y, cam.angle, cam.range, 0.38, color, 0.13);
  ctx.save(); ctx.translate(cam.x, cam.y); ctx.rotate(cam.angle);
  ctx.fillStyle = disabled ? '#3a435e' : '#8a1622';
  ctx.fillRect(-8, -6, 20, 12);
  ctx.fillStyle = disabled ? '#5a6b8a' : '#ff3b3b';
  ctx.beginPath(); ctx.arc(14, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = disabled ? '#8d94b0' : '#ff8080';
  ctx.font = '10px Verdana'; ctx.textAlign = 'center';
  ctx.fillText(disabled ? 'CAM — OFF' : 'CAMERA', cam.x, cam.y + (cam.y < 60 ? 34 : -16));
}

function drawThief(ctx, t, sneaking, time) {
  ctx.save();
  ctx.shadowColor = '#ffd75e'; ctx.shadowBlur = sneaking ? 4 : 10;
  ctx.fillStyle = '#14121a';
  ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = sneaking ? '#7dd87d' : '#ffd75e'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.stroke();
  // hood point + eyes
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath(); ctx.moveTo(t.x - 8, t.y - 4); ctx.lineTo(t.x + 8, t.y - 4); ctx.lineTo(t.x, t.y - 15); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(t.x - 6, t.y - 2, 4, 3); ctx.fillRect(t.x + 2, t.y - 2, 4, 3);
  ctx.fillStyle = '#ffd75e'; ctx.font = 'bold 10px Verdana'; ctx.textAlign = 'center';
  ctx.fillText(sneaking ? 'YOU — SNEAKING' : 'YOU — THIEF', t.x, t.y + 26);
}

export function drawRoom(ctx, game, input, time) {
  const room = game.room;
  const shakeX = game.shake ? (Math.random() - 0.5) * game.shake : 0;
  const shakeY = game.shake ? (Math.random() - 0.5) * game.shake : 0;
  ctx.save(); ctx.translate(shakeX, shakeY);

  // Floor: deep blue checker + red carpet runner down the middle lane.
  for (let y = 0; y < 720; y += 60) for (let x = 0; x < 1280; x += 60) {
    ctx.fillStyle = ((x + y) / 60) % 2 === 0 ? '#141a35' : '#10142a';
    ctx.fillRect(x, y, 60, 60);
  }
  ctx.fillStyle = '#5e1220';
  ctx.fillRect(596, 18, 88, 684);
  ctx.strokeStyle = '#c9a227'; ctx.lineWidth = 2;
  ctx.strokeRect(596, 18, 88, 684);
  ctx.fillStyle = '#c9a227'; ctx.font = 'bold 12px Verdana'; ctx.textAlign = 'center';
  ctx.fillText(room.name.toUpperCase(), 640, 712);

  // Walls / cover.
  for (const w of room.walls) drawWall(ctx, w);

  // Exit door (top centre): green when open, red-locked before the vault.
  const e = room.exit;
  ctx.fillStyle = e.open ? '#1f9d4d' : '#7a1f1f';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = e.open ? '#7dff9e' : '#ff8080'; ctx.lineWidth = 2;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Verdana'; ctx.textAlign = 'center';
  ctx.fillText(e.open ? 'EXIT — GO!' : 'EXIT — LOCKED', e.x + e.w / 2, e.y + 18);

  // The vault: big safe with a crack-progress ring.
  const v = room.vault;
  ctx.fillStyle = game.vaultOpen ? '#3a2f10' : '#2b2f45';
  ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.strokeStyle = '#ffd75e'; ctx.lineWidth = 3; ctx.strokeRect(v.x, v.y, v.w, v.h);
  ctx.fillStyle = '#ffd75e'; ctx.font = 'bold 13px Verdana'; ctx.textAlign = 'center';
  ctx.fillText(game.vaultOpen ? 'VAULT OPEN' : v.label, v.x + v.w / 2, v.y + 22);
  ctx.fillStyle = '#fff3c4'; ctx.font = 'bold 15px Verdana';
  ctx.fillText(game.vaultOpen ? 'LOOTED $' + 2000 : 'CRACK IT — STAND HERE', v.x + v.w / 2, v.y + 44);
  if (!game.vaultOpen && game.vaultCracking > 0) {
    ctx.strokeStyle = '#ffd75e'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(v.x + v.w / 2, v.y + v.h / 2, 26, -Math.PI / 2, -Math.PI / 2 + (game.vaultCracking / 100) * Math.PI * 2); ctx.stroke();
  }

  // Loot, cameras, guards, thief.
  for (const l of room.loot) drawLoot(ctx, l, time);
  for (const cam of game.cameras) drawCamera(ctx, cam, time, game.time);
  for (const g of game.guards) drawGuard(ctx, g, time);
  drawThief(ctx, game.thief, input.sneak, time);

  // Smoke cloud.
  if (game.time < game.smokeUntil) {
    ctx.fillStyle = 'rgba(200,200,210,0.25)';
    ctx.beginPath(); ctx.arc(game.thief.x, game.thief.y, 110, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8e6d9'; ctx.font = 'bold 12px Verdana'; ctx.textAlign = 'center';
    ctx.fillText('SMOKE — CONES BLIND', game.thief.x, game.thief.y - 60);
  }
  // Noise coin marker.
  if (game.coinToss && game.time < game.coinToss.until + 4) {
    ctx.fillStyle = '#ffd75e';
    ctx.beginPath(); ctx.arc(game.coinToss.x, game.coinToss.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 11px Verdana'; ctx.textAlign = 'center';
    ctx.fillText('CLINK!', game.coinToss.x, game.coinToss.y - 12);
  }
  // Click ping.
  if (input.ping && performance.now() < input.ping.until) {
    ctx.strokeStyle = '#7dd87d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(input.ping.x, input.ping.y, 12, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.restore();

  // In-canvas alarm bar (top-left) so the meter is visible in the frame itself.
  const aw = 300, ax = 24, ay = 24;
  ctx.fillStyle = 'rgba(8,10,22,0.85)';
  ctx.fillRect(ax - 8, ay - 8, aw + 110, 40);
  ctx.fillStyle = '#ff5d5d'; ctx.font = 'bold 14px Verdana'; ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, ay + 12);
  ctx.fillStyle = '#2a0f16'; ctx.fillRect(ax + 70, ay, aw, 16);
  ctx.fillStyle = game.alarm > 70 ? '#ff3b3b' : game.alarm > 35 ? '#ff9a3d' : '#ffd75e';
  ctx.fillRect(ax + 70, ay, (aw * game.alarm) / 100, 16);
  ctx.strokeStyle = '#5a2230'; ctx.strokeRect(ax + 70, ay, aw, 16);
  ctx.fillStyle = '#fff'; ctx.fillText(Math.round(game.alarm) + '%', ax + 78 + aw, ay + 13);
  if (game.seen > 0.15) {
    ctx.fillStyle = '#ff3b3b'; ctx.font = 'bold 16px Verdana'; ctx.textAlign = 'center';
    ctx.fillText('SPOTTED!', 640, 60);
  }
  // Room + loot readout top-right.
  ctx.fillStyle = 'rgba(8,10,22,0.85)';
  ctx.fillRect(1280 - 330, 16, 306, 40);
  ctx.fillStyle = '#ffd75e'; ctx.font = 'bold 14px Verdana'; ctx.textAlign = 'right';
  ctx.fillText('ROOM ' + (game.roomIndex + 1) + '/3   LOOT $' + game.loot + '   COINS ' + game.coins, 1256, 42);

  // Red flash when seen.
  if (game.flashRed > 0.02) {
    ctx.fillStyle = 'rgba(255,30,30,' + Math.min(0.25, game.flashRed * 0.3) + ')';
    ctx.fillRect(0, 0, 1280, 720);
  }
}
