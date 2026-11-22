// game.js — the heist state machine: alarm, tools, loot, vault crack, getaway.
// Phases: briefing -> playing -> caught | roomclear | escaped | gameover | win.
// The alarm is the shared pressure: seen by a guard or a camera it climbs,
// in the dark it falls. At 100 the room locks down and the run ends.

import { buildRoom, collideCircleWalls, pointInRect } from './world.js';
import { makeGuard, makeCamera, updateGuard, updateCamera } from './guards.js';

export const TOOL_COSTS = { smoke: 25, emp: 40, coin: 10 };
export const START_COINS = 60;
export const VAULT_VALUE = 2000;

export function newGame() {
  return {
    phase: 'briefing', roomIndex: 0, room: null, guards: [], cameras: [],
    thief: { x: 640, y: 660, r: 14, speed: 165 },
    alarm: 0, loot: 0, coins: START_COINS, score: 0,
    vaultCracking: 0, vaultOpen: false, time: 0, roomTime: 0,
    smokeUntil: 0, empUntil: 0, coinToss: null,
    message: '', messageUntil: 0, caughtBy: '',
    shake: 0, flashRed: 0, roomsCleared: 0, totalLoot: 0,
  };
}

export function loadRoom(game, index) {
  game.roomIndex = index;
  game.room = buildRoom(index);
  game.guards = game.room.guards.map(g => makeGuard(g, g.speed));
  game.cameras = game.room.cameras.map(makeCamera);
  game.thief.x = game.room.spawn.x; game.thief.y = game.room.spawn.y;
  game.alarm = Math.max(0, game.alarm - 25); // a fresh room cools the heat a little
  game.vaultCracking = 0; game.vaultOpen = false;
  game.room.exit.open = false;
  game.roomTime = 0; game.smokeUntil = 0; game.empUntil = 0; game.coinToss = null;
  game.phase = 'playing';
}

export function startGame(game) { loadRoom(game, 0); game.loot = 0; game.coins = START_COINS; game.score = 0; game.time = 0; game.totalLoot = 0; game.roomsCleared = 0; }

export function showMessage(game, text, seconds) {
  game.message = text; game.messageUntil = game.time + (seconds || 2.5);
}

export function useTool(game, kind) {
  if (game.phase !== 'playing') return false;
  const cost = TOOL_COSTS[kind];
  if (game.coins < cost) { showMessage(game, 'Not enough coins for that tool!', 1.6); return false; }
  game.coins -= cost;
  if (kind === 'smoke') {
    game.smokeUntil = game.time + 5;
    showMessage(game, 'SMOKE BOMB — every cone is blind for 5s. Move!', 2.2);
  } else if (kind === 'emp') {
    game.empUntil = game.time + 8;
    for (const c of game.cameras) c.disabledUntil = game.time + 8;
    showMessage(game, 'EMP PULSE — all cameras frozen for 8s!', 2.2);
  } else if (kind === 'coin') {
    const t = game.thief;
    const tx = t.x + (Math.random() * 160 - 80), ty = t.y - 120;
    game.coinToss = { x: tx, y: ty, until: game.time + 0.6 };
    let nearest = null, best = 1e9;
    for (const g of game.guards) {
      const d = Math.hypot(g.x - tx, g.y - ty);
      if (d < best) { best = d; nearest = g; }
    }
    if (nearest) { nearest.distracted = { x: tx, y: ty, until: game.time + 5 }; nearest.alert = Math.max(0, nearest.alert - 0.5); }
    showMessage(game, 'NOISE COIN tossed — a guard goes to check the clink.', 2.2);
  }
  return true;
}

export function updateGame(game, input, dt) {
  if (game.phase !== 'playing') return;
  game.time += dt; game.roomTime += dt;
  const t = game.thief;
  const sneaking = input.sneak;
  const sprinting = input.sprint && !sneaking;
  let speed = t.speed * (sneaking ? 0.55 : sprinting ? 1.5 : 1);
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (mx || my) {
    const len = Math.hypot(mx, my); mx /= len; my /= len;
    const moved = collideCircleWalls(t.x + mx * speed * dt, t.y + my * speed * dt, t.r, game.room.walls);
    t.x = moved.x; t.y = moved.y;
  }
  game.moving = !!(mx || my);
  game.noise = sprinting && game.moving ? 1 : sneaking ? 0.15 : 0.5;

  // Detection: guards + cameras feed the alarm. Sprinting is loud: seen faster.
  let seen = 0;
  for (const g of game.guards) {
    const vis = updateGuard(g, dt, t, game.room.walls, game.time);
    seen = Math.max(seen, vis * (sprinting ? 1.35 : sneaking ? 0.7 : 1));
  }
  for (const cam of game.cameras) {
    const vis = updateCamera(cam, dt, t, game.room.walls, game.time, game.smokeUntil);
    seen = Math.max(seen, vis * 1.15);
  }
  if (game.time < game.smokeUntil) seen = 0;
  if (seen > 0) {
    game.alarm = Math.min(100, game.alarm + seen * dt * 26);
    game.flashRed = Math.max(game.flashRed, seen * 0.5);
  } else {
    game.alarm = Math.max(0, game.alarm - dt * 8);
  }
  game.seen = seen;
  game.shake = seen > 0.4 ? 3 : 0;
  if (game.alarm >= 100) {
    game.phase = 'caught';
    game.caughtBy = seen > 0 ? 'Spotted in the open — the alarm hit 100%.' : 'The alarm hit 100%.';
    game.score = game.totalLoot + game.loot;
    return;
  }

  // Loot pickup (walk over it).
  for (const l of game.room.loot) {
    if (!l.taken && Math.hypot(t.x - l.x, t.y - l.y) < 30) {
      l.taken = true; game.loot += l.value;
      showMessage(game, `+ $${l.value} — ${l.label}`, 1.6);
    }
  }

  // Vault crack: stand at the vault, it opens after a few seconds of work.
  const v = game.room.vault;
  const nearVault = t.x > v.x - 30 && t.x < v.x + v.w + 30 && t.y > v.y - 40 && t.y < v.y + v.h + 40;
  if (nearVault && !game.vaultOpen) {
    game.vaultCracking += dt * 34;
    if (game.vaultCracking >= 100) {
      game.vaultOpen = true; game.loot += VAULT_VALUE;
      game.room.exit.open = true;
      showMessage(game, `VAULT OPEN! +$${VAULT_VALUE} — now reach the green EXIT!`, 3.5);
    }
  } else {
    game.vaultCracking = Math.max(0, game.vaultCracking - dt * 20);
  }

  // Getaway: exit only counts once the vault is open.
  const e = game.room.exit;
  if (game.vaultOpen && pointInRect(t.x, t.y, { x: e.x - 10, y: e.y - 10, w: e.w + 20, h: e.h + 40 })) {
    const timeBonus = Math.max(0, Math.round((game.room.par - game.roomTime) * 10));
    game.coins += 15; // the crew fences a little extra after every clean room
    game.totalLoot += game.loot + timeBonus;
    game.roomsCleared++;
    if (game.roomIndex >= 2) {
      game.phase = 'win';
      game.score = game.totalLoot;
    } else {
      game.phase = 'roomclear';
      game.roomBonus = timeBonus;
    }
  }
}

export function nextRoom(game) { loadRoom(game, game.roomIndex + 1); game.loot = 0; }
