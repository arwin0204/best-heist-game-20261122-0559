// world.js — the three heist rooms: walls, cover, loot, cameras, exits.
// Every room is one 1280x720 floor plan. Coordinates are canvas pixels.
// Cover blocks line of sight; loot is worth $; the vault is the big score.

export const ROOM_W = 1280;
export const ROOM_H = 720;

function wall(x, y, w, h) { return { x, y, w, h }; }
function loot(x, y, value, label, kind) { return { x, y, value, label, kind: kind || 'small', taken: false }; }
function camera(x, y, baseAngle, sweep, range) { return { x, y, baseAngle, sweep, range, angle: baseAngle, t: Math.random() * 6.28, disabledUntil: 0 }; }
function guardPath(points, speed) { return { points, speed }; }

export function buildRoom(index) {
  // Outer shell is implicit: the room border is a wall in collision + render.
  if (index === 0) return {
    name: 'The Meridian Gallery',
    par: 75,
    spawn: { x: 640, y: 660 },
    exit: { x: 640, y: 30, w: 120, h: 26, open: false },
    vault: { x: 640, y: 92, w: 150, h: 64, hp: 100, label: 'MERIDIAN VAULT' },
    walls: [
      wall(0, 0, 1280, 18), wall(0, 702, 1280, 18), wall(0, 0, 18, 720), wall(1262, 0, 18, 720),
      // display cases — low cover, blocks sight, thief can slip behind them
      wall(180, 180, 190, 46), wall(180, 300, 190, 46), wall(180, 420, 190, 46),
      wall(910, 180, 190, 46), wall(910, 300, 190, 46), wall(910, 420, 190, 46),
      // centre pillars — the risky middle lane
      wall(600, 250, 80, 80), wall(600, 430, 80, 80),
      // side alcoves: left vent route, right gallery route
      wall(90, 120, 40, 220), wall(1150, 120, 40, 220),
      wall(420, 170, 120, 30), wall(740, 170, 120, 30),
    ],
    loot: [
      loot(275, 203, 250, 'Jade Idol', 'small'), loot(275, 323, 250, 'Gold Mask', 'small'),
      loot(275, 443, 400, 'Ruby Tiara', 'small'), loot(1005, 203, 250, 'Pearl Vase', 'small'),
      loot(1005, 323, 400, 'Emerald Brooch', 'small'), loot(1005, 443, 250, 'Silver Chalice', 'small'),
      loot(110, 620, 300, 'Coin Cache', 'small'), loot(1170, 620, 300, 'Coin Cache', 'small'),
      loot(640, 560, 500, 'Diamond Case', 'big'),
    ],
    guards: [
      guardPath([{ x: 460, y: 220 }, { x: 820, y: 220 }, { x: 820, y: 480 }, { x: 460, y: 480 }], 62),
      guardPath([{ x: 300, y: 560 }, { x: 980, y: 560 }], 74),
    ],
    cameras: [
      camera(320, 26, Math.PI / 2, 0.9, 330),
      camera(20, 360, 0, 0.7, 300),
      camera(1260, 360, Math.PI, 0.7, 300),
    ],
  };
  if (index === 1) return {
    name: 'The Vault Hall',
    par: 90,
    spawn: { x: 120, y: 660 },
    exit: { x: 120, y: 30, w: 120, h: 26, open: false },
    vault: { x: 1080, y: 92, w: 150, h: 64, hp: 100, label: 'GRAND VAULT' },
    walls: [
      wall(0, 0, 1280, 18), wall(0, 702, 1280, 18), wall(0, 0, 18, 720), wall(1262, 0, 18, 720),
      wall(300, 140, 46, 220), wall(300, 420, 46, 220),
      wall(620, 120, 46, 180), wall(620, 420, 46, 180),
      wall(900, 200, 46, 320),
      wall(420, 560, 220, 40), wall(760, 560, 220, 40),
      wall(150, 300, 110, 40), wall(1010, 420, 110, 40),
    ],
    loot: [
      loot(205, 320, 300, 'Sapphire', 'small'), loot(545, 620, 400, 'Gold Bars', 'big'),
      loot(700, 210, 300, 'Opal', 'small'), loot(975, 250, 400, 'Crown Jewels', 'small'),
      loot(1130, 560, 500, 'Platinum Bars', 'big'), loot(420, 160, 250, 'Antique Coin', 'small'),
      loot(850, 620, 300, 'Coin Cache', 'small'),
    ],
    guards: [
      guardPath([{ x: 480, y: 200 }, { x: 480, y: 560 }, { x: 820, y: 560 }, { x: 820, y: 200 }], 70),
      guardPath([{ x: 180, y: 160 }, { x: 1080, y: 160 }], 84),
      guardPath([{ x: 1080, y: 500 }, { x: 240, y: 500 }], 66),
    ],
    cameras: [
      camera(640, 26, Math.PI / 2, 1.1, 360),
      camera(20, 160, 0, 0.8, 320),
      camera(1260, 560, Math.PI, 0.8, 320),
      camera(940, 26, Math.PI / 2, 0.6, 300),
    ],
  };
  return {
    name: 'The Rooftop Safehouse Run',
    par: 100,
    spawn: { x: 640, y: 660 },
    exit: { x: 640, y: 30, w: 120, h: 26, open: false },
    vault: { x: 640, y: 92, w: 150, h: 64, hp: 100, label: 'SKY VAULT' },
    walls: [
      wall(0, 0, 1280, 18), wall(0, 702, 1280, 18), wall(0, 0, 18, 720), wall(1262, 0, 18, 720),
      wall(140, 140, 200, 40), wall(140, 300, 200, 40), wall(140, 460, 200, 40),
      wall(940, 140, 200, 40), wall(940, 300, 200, 40), wall(940, 460, 200, 40),
      wall(560, 200, 160, 44), wall(560, 380, 160, 44), wall(560, 540, 160, 44),
      wall(430, 300, 40, 160),
    ],
    loot: [
      loot(240, 160, 400, 'Moonstone', 'small'), loot(240, 320, 300, 'Topaz', 'small'),
      loot(240, 480, 500, 'Vault Key', 'big'), loot(1040, 160, 400, 'Black Pearl', 'small'),
      loot(1040, 320, 300, 'Amethyst', 'small'), loot(1040, 480, 500, 'Gold Bullion', 'big'),
      loot(640, 300, 600, 'The Meridian Star', 'big'),
    ],
    guards: [
      guardPath([{ x: 420, y: 140 }, { x: 860, y: 140 }, { x: 860, y: 580 }, { x: 420, y: 580 }], 80),
      guardPath([{ x: 200, y: 600 }, { x: 1080, y: 600 }], 92),
      guardPath([{ x: 1080, y: 120 }, { x: 200, y: 120 }], 78),
      guardPath([{ x: 640, y: 240 }, { x: 640, y: 520 }], 70),
    ],
    cameras: [
      camera(320, 26, Math.PI / 2, 1.0, 340),
      camera(960, 26, Math.PI / 2, 1.0, 340),
      camera(20, 360, 0, 0.9, 320),
      camera(1260, 360, Math.PI, 0.9, 320),
      camera(640, 700, -Math.PI / 2, 0.7, 300),
    ],
  };
}

// Circle-vs-rect collision: push the circle out of any wall it overlaps.
export function collideCircleWalls(x, y, r, walls) {
  let nx = x, ny = y;
  for (const w of walls) {
    const cx = Math.max(w.x, Math.min(nx, w.x + w.w));
    const cy = Math.max(w.y, Math.min(ny, w.y + w.h));
    const dx = nx - cx, dy = ny - cy, d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      const d = Math.sqrt(d2) || 0.001;
      nx = cx + (dx / d) * r; ny = cy + (dy / d) * r;
    }
  }
  return { x: nx, y: ny };
}

// Segment vs rect: does the line from (x1,y1) to (x2,y2) hit a wall?
function segmentHitsRect(x1, y1, x2, y2, w) {
  const dx = x2 - x1, dy = y2 - y1;
  let tmin = 0, tmax = 1;
  if (dx === 0) { if (x1 < w.x || x1 > w.x + w.w) return false; }
  else {
    let t1 = (w.x - x1) / dx, t2 = (w.x + w.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (dy === 0) { if (y1 < w.y || y1 > w.y + w.h) return false; }
  else {
    let t1 = (w.y - y1) / dy, t2 = (w.y + w.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (const w of walls) if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  return true;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
