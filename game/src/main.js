// main.js — boot the heist: canvas loop, HUD sync, overlays, demo presets.
// ?demo=cover puts the thief mid-room with the alarm half up so a screenshot
// shows the whole game at once; ?demo=alarm / ?demo=getaway stage other beats.

import { newGame, startGame, loadRoom, nextRoom, updateGame, useTool, showMessage } from './game.js';
import { drawRoom } from './render.js';
import { createInput } from './input.js';
import { startDrone, playLoot, playVault, playAlarm, playCaught, playEscape, playClick, playCoinToss, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const game = newGame();
let last = performance.now();
let lastAlarmSound = 0;
let lastLoot = 0;
let lastVault = false;

const params = new URLSearchParams(location.search);
const demo = params.get('demo');

const input = createInput(canvas,
  (kind) => { if (useTool(game, kind)) { if (kind === 'coin') playCoinToss(); else playClick(); syncHud(); } },
  () => { if (game.phase === 'playing' || game.phase === 'caught') { loadRoom(game, game.roomIndex); showMessage(game, 'Room restarted.', 1.5); } },
  () => confirmOverlay(),
  () => { const m = toggleMute(); showMessage(game, m ? 'Sound muted.' : 'Sound on.', 1.2); },
);

document.getElementById('tool-smoke').addEventListener('click', () => inputTool('smoke'));
document.getElementById('tool-emp').addEventListener('click', () => inputTool('emp'));
document.getElementById('tool-coin').addEventListener('click', () => inputTool('coin'));
function inputTool(kind) { if (useTool(game, kind)) { if (kind === 'coin') playCoinToss(); else playClick(); syncHud(); } }

function fmtTime(s) { const m = Math.floor(s / 60), ss = Math.floor(s % 60); return m + ':' + String(ss).padStart(2, '0'); }

function syncHud() {
  document.getElementById('hud-room').textContent = (game.roomIndex + 1) + '/3';
  document.getElementById('hud-loot').textContent = '$' + (game.totalLoot + game.loot);
  document.getElementById('hud-coins').textContent = game.coins;
  document.getElementById('hud-alarm').textContent = Math.round(game.alarm) + '%';
  document.getElementById('hud-alarm-fill').style.width = game.alarm + '%';
  document.getElementById('hud-time').textContent = fmtTime(game.time);
  for (const [id, kind] of [['tool-smoke', 'smoke'], ['tool-emp', 'emp'], ['tool-coin', 'coin']]) {
    document.getElementById(id).disabled = game.phase !== 'playing' || game.coins < { smoke: 25, emp: 40, coin: 10 }[kind];
  }
}

function panel(html) { overlay.innerHTML = '<div class="panel">' + html + '</div>'; }
function clearPanel() { overlay.innerHTML = ''; }

function showBriefing() {
  panel('<h1>MIDNIGHT VAULT</h1><p class="big">Steal the Meridian Vault. Get out alive.</p>'
    + '<p>Three rooms, one thief, guards with sweeping vision cones and cameras that never blink. Read the cones before you move — gold cases are cover, red cones are danger, gold diamonds are loot.</p>'
    + '<p>Crack the vault by standing at it, grab what you can, then reach the green EXIT. Every second you are seen, the ALARM climbs. At 100% the room locks down and the run is over.</p>'
    + '<p>Tools cost coins: <b>Smoke</b> blinds every cone, <b>EMP</b> freezes the cameras, <b>Noise Coin</b> lures a guard away. Sneak with Shift, sprint with Space — sprinting is loud.</p>'
    + '<p class="keys">WASD / Arrows move · Shift sneak · Space sprint · 1/2/3 tools · R restart room · M mute</p>'
    + '<button id="start-btn">START THE HEIST</button>');
  document.getElementById('start-btn').addEventListener('click', () => { startDrone(); startGame(game); clearPanel(); });
}

function showCaught() {
  playCaught();
  panel('<h2>CAUGHT!</h2><p class="big">' + game.caughtBy + '</p>'
    + '<p>You banked $' + game.score + ' of loot before the lockdown.</p>'
    + '<p class="keys">Press R or click below to retry this room.</p>'
    + '<button id="retry-btn">RETRY ROOM</button>');
  document.getElementById('retry-btn').addEventListener('click', () => { loadRoom(game, game.roomIndex); clearPanel(); });
}

function showRoomClear() {
  playEscape();
  panel('<h2>ROOM CLEAR — CLEAN GETAWAY!</h2><p class="big">Loot banked: $' + game.loot + ' · Time bonus: $' + game.roomBonus + '</p>'
    + '<p>Total so far: $' + game.totalLoot + ' · Alarm peaked and cooled. Next room: more guards, more cameras.</p>'
    + '<button id="next-btn">NEXT ROOM</button>');
  document.getElementById('next-btn').addEventListener('click', () => { nextRoom(game); clearPanel(); });
}

function showWin() {
  playEscape();
  panel('<h2>THE PERFECT HEIST</h2><p class="big">All three rooms cleared. Total take: $' + game.score + '</p>'
    + '<p>The Meridian Star is yours. The crew is already at the safehouse — and nobody ever saw your face.</p>'
    + '<button id="again-btn">RUN IT AGAIN</button>');
  document.getElementById('again-btn').addEventListener('click', () => { startGame(game); clearPanel(); });
}

function confirmOverlay() {
  if (game.phase === 'briefing') { startDrone(); startGame(game); clearPanel(); }
  else if (game.phase === 'roomclear') { nextRoom(game); clearPanel(); }
  else if (game.phase === 'caught') { loadRoom(game, game.roomIndex); clearPanel(); }
  else if (game.phase === 'win') { startGame(game); clearPanel(); }
}

function applyDemo() {
  if (!demo) return;
  startGame(game);
  if (demo === 'cover') {
    // Mid-room, mid-heist: thief between two cases, cones sweeping, alarm half up.
    game.thief.x = 700; game.thief.y = 600;
    game.alarm = 46;
    game.loot = 1250; game.coins = 35;
    game.room.loot[0].taken = true; game.room.loot[3].taken = true;
    game.guards[0].alert = 0.5;
  } else if (demo === 'alarm') {
    game.thief.x = 640; game.thief.y = 300;
    game.alarm = 82; game.seen = 0.9; game.flashRed = 0.6;
    game.loot = 900;
    game.guards[0].alert = 0.95; game.guards[0].x = 700; game.guards[0].y = 330;
    game.guards[0].facing = Math.atan2(game.thief.y - 330, game.thief.x - 700);
  } else if (demo === 'getaway') {
    game.thief.x = 560; game.thief.y = 110;
    game.vaultOpen = true; game.room.exit.open = true;
    game.loot = 3250; game.alarm = 58;
    for (const l of game.room.loot) l.taken = true;
  } else if (demo === 'tools') {
    game.thief.x = 460; game.thief.y = 520;
    game.smokeUntil = game.time + 5; game.alarm = 22;
    game.loot = 650;
    game.guards[1].distracted = { x: 300, y: 400, until: game.time + 5 };
    game.coinToss = { x: 300, y: 400, until: game.time + 4 };
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const prevPhase = game.phase;
  updateGame(game, input, dt);
  if (game.loot > lastLoot) { playLoot(); lastLoot = game.loot; }
  if (game.vaultOpen && !lastVault) { playVault(); lastVault = true; }
  if (!game.vaultOpen) lastVault = false;
  if (game.seen > 0.4 && now - lastAlarmSound > 900) { playAlarm(); lastAlarmSound = now; }
  game.flashRed = Math.max(0, game.flashRed - dt * 1.5);
  if (game.phase !== prevPhase) {
    if (game.phase === 'caught') showCaught();
    else if (game.phase === 'roomclear') showRoomClear();
    else if (game.phase === 'win') showWin();
  }
  if (game.room) drawRoom(ctx, game, input, now / 1000);
  else {
    // Briefing backdrop: draw room 1 behind the panel.
    const g = newGame(); loadRoom(g, 0); g.phase = 'briefing';
    game.room = g.room; game.guards = g.guards; game.cameras = g.cameras;
    game.thief = g.thief; game.alarm = 0; game.loot = 0; game.coins = 60;
    drawRoom(ctx, game, input, now / 1000);
  }
  if (game.message && game.time < game.messageUntil) {
    ctx.fillStyle = 'rgba(8,10,22,0.85)';
    ctx.fillRect(340, 660, 600, 34);
    ctx.fillStyle = '#ffd75e'; ctx.font = 'bold 15px Verdana'; ctx.textAlign = 'center';
    ctx.fillText(game.message, 640, 682);
  }
  syncHud();
  requestAnimationFrame(frame);
}

showBriefing();
applyDemo();
if (demo) clearPanel();
requestAnimationFrame(frame);
