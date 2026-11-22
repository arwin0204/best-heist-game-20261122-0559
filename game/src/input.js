// input.js — keyboard + mouse, in one place. WASD/arrows move, Shift sneaks,
// Space sprints, 1/2/3 fire tools, R restarts the room, M mutes, Enter starts.

export function createInput(canvas, onTool, onRestart, onConfirm, onMute) {
  const input = { up: false, down: false, left: false, right: false, sneak: false, sprint: false };
  const keys = {};
  const keyMap = {
    KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  };
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys[e.code] = true;
    if (keyMap[e.code]) input[keyMap[e.code]] = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sneak = true;
    if (e.code === 'Space') input.sprint = true;
    if (e.code === 'Digit1') onTool('smoke');
    if (e.code === 'Digit2') onTool('emp');
    if (e.code === 'Digit3') onTool('coin');
    if (e.code === 'KeyR') onRestart();
    if (e.code === 'KeyM') onMute();
    if (e.code === 'Enter') onConfirm();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (keyMap[e.code]) input[keyMap[e.code]] = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') input.sneak = false;
    if (e.code === 'Space') input.sprint = false;
  });
  // Clicking the canvas pings a move marker (mouse is part of play: tools
  // also live on the toolbar buttons under the canvas).
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    input.ping = { x, y, until: performance.now() + 900 };
  });
  return input;
}
