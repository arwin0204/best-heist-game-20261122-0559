// guards.js — patrols, vision cones, security cameras, and detection.
// A guard walks its waypoint loop; its cone sweeps as it turns. A camera
// sweeps a fixed arc. Both spot the thief only with a clear line of sight,
// and only inside the cone — so reading the sweep before moving is the game.

import { hasLineOfSight } from './world.js';

export const CONE_RANGE = 260;
export const CONE_HALF_ANGLE = 0.42; // ~48 degrees wide in total

export function makeGuard(path, speed) {
  return {
    path, speed, x: path.points[0].x, y: path.points[0].y,
    leg: 0, facing: 0, alert: 0, // 0 calm .. 1 fully alert
    distracted: null, // {x, y, until} — a noise coin pulled the guard here
    state: 'patrol', // patrol | investigate | chase
  };
}

export function makeCamera(def) {
  return { ...def, angle: def.baseAngle };
}

function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// How strongly does watcher (x,y,facing,range,halfAngle) see the thief?
// 0 = unseen, 1 = dead centre of the cone at close range.
export function coneVisibility(wx, wy, facing, range, halfAngle, tx, ty, walls) {
  const dx = tx - wx, dy = ty - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return 0;
  if (dist < 26) return 1; // bumped into them — always seen
  if (Math.abs(angleDiff(angleTo(wx, wy, tx, ty), facing)) > halfAngle) return 0;
  if (!hasLineOfSight(wx, wy, tx, ty, walls)) return 0;
  const centre = 1 - Math.abs(angleDiff(angleTo(wx, wy, tx, ty), facing)) / halfAngle;
  const near = 1 - dist / range;
  return Math.min(1, centre * 0.7 + near * 0.5);
}

export function updateGuard(g, dt, thief, walls, now) {
  // Pick a target point: distraction beats patrol; chase beats both.
  let target;
  if (g.distracted && now < g.distracted.until) {
    target = g.distracted; g.state = 'investigate';
  } else if (g.alert > 0.85) {
    target = thief; g.state = 'chase';
  } else {
    g.state = 'patrol';
    target = g.path.points[(g.leg + 1) % g.path.points.length];
  }
  const dx = target.x - g.x, dy = target.y - g.y;
  const dist = Math.hypot(dx, dy);
  const speed = g.state === 'chase' ? g.speed * 1.55 : g.speed;
  if (dist > 4) {
    const step = Math.min(dist, speed * dt);
    g.x += (dx / dist) * step; g.y += (dy / dist) * step;
    g.facing = Math.atan2(dy, dx);
  } else if (g.state === 'patrol') {
    g.leg = (g.leg + 1) % g.path.points.length;
  } else if (g.state === 'investigate') {
    g.facing += dt * 1.4; // look around, then give up
    if (now >= g.distracted.until) g.distracted = null;
  }
  // Alert decays when the thief is out of sight.
  const vis = coneVisibility(g.x, g.y, g.facing, CONE_RANGE, CONE_HALF_ANGLE, thief.x, thief.y, walls);
  if (vis > 0) g.alert = Math.min(1, g.alert + vis * dt * 1.5);
  else g.alert = Math.max(0, g.alert - dt * 0.35);
  return vis;
}

export function updateCamera(cam, dt, thief, walls, now, smokeUntil) {
  cam.t += dt;
  cam.angle = cam.baseAngle + Math.sin(cam.t * 0.55) * cam.sweep;
  if (now < cam.disabledUntil || now < smokeUntil) return 0;
  return coneVisibility(cam.x, cam.y, cam.angle, cam.range, 0.38, thief.x, thief.y, walls);
}

export function guardSeesThief(g, thief, walls) {
  return coneVisibility(g.x, g.y, g.facing, CONE_RANGE, CONE_HALF_ANGLE, thief.x, thief.y, walls);
}
