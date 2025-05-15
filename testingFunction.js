// === Debug canvas setup ===
let debugCanvas = document.getElementById("wander-debug-canvas");
if (!debugCanvas) {
  debugCanvas = document.createElement("canvas");
  debugCanvas.id = "wander-debug-canvas";
  Object.assign(debugCanvas.style, {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 9999,
    pointerEvents: "none"
  });
  document.body.appendChild(debugCanvas);
}
const ctx = debugCanvas.getContext("2d");

// === Resize canvas ===
function resizeCanvas() {
  debugCanvas.width = window.innerWidth;
  debugCanvas.height = window.innerHeight;
}

// === Convert world position to screen position ===
function toScreen(pos) {
  const cam = gameState._camera;
  if (!cam) return { x: 0, y: 0 };
  return cam.pointToScreen(pos);
}

// === Draw helpers ===
function drawCircle(pos, radius, color, label = "") {
  const screen = toScreen(pos);
  const screenRad = gameState._camera.scaleToScreen(radius);

  ctx.beginPath();
  ctx.arc(screen.x, screen.y, screenRad, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (label) {
    ctx.fillStyle = color;
    ctx.font = "12px Arial";
    ctx.fillText(label, screen.x + screenRad + 5, screen.y);
  }
}

function drawLine(start, end, color, label = "") {
  const s = toScreen(start);
  const e = toScreen(end);

  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(e.x, e.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (label) {
    ctx.fillStyle = color;
    ctx.font = "12px Arial";
    ctx.fillText(label, e.x + 5, e.y);
  }
}

// === Utility functions ===
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function normalizeVector(x, y) {
  const mag = Math.hypot(x, y);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: x / mag, y: y / mag };
}

// === Find closest obstacle ===
function getClosestObstacle(pos, obstacles) {
  let closest = null;
  let minDist = Infinity;

  for (const obs of obstacles) {
    if (!obs?.pos || !obs?.collider?.rad) continue;

    const dist = distance(pos, obs.pos) - obs.collider.rad;
    if (dist < minDist) {
      minDist = dist;
      closest = obs;
    }
  }

  return closest;
}

// === Unstuck logic helper ===
function unstuckPlayer(pos) {
  const angle = Math.random() * Math.PI * 2;
  const nudgeX = Math.cos(angle);
  const nudgeY = Math.sin(angle);

  gameState._input.keys[87] = nudgeY > 0;
  gameState._input.keys[83] = nudgeY < 0;
  gameState._input.keys[65] = nudgeX < 0;
  gameState._input.keys[68] = nudgeX > 0;

  // Aim in the nudge direction
  const aimDistance = 100;
  const aimWorldPos = { x: pos.x + nudgeX * aimDistance, y: pos.y + nudgeY * aimDistance };
  const aimScreenPos = gameState._camera?.pointToScreen(aimWorldPos);
  if (aimScreenPos) {
    document.dispatchEvent(new MouseEvent('mousemove', {
      clientX: aimScreenPos.x,
      clientY: aimScreenPos.y,
      bubbles: true,
      cancelable: true,
      view: window
    }));
  }

  drawLine(pos, { x: pos.x + nudgeX * 20, y: pos.y + nudgeY * 20 }, "yellow", "→ Unstuck");
}

// === Wander with obstacle avoidance and stuck detection ===

// Stuck detection state
let lastPos = null;
let stuckFrames = 0;
const stuckThreshold = 1; // minimum distance to consider as movement
const stuckLimit = 60;    // frames to count as stuck (~1 second at 60fps)

function wanderNearTarget(targetPos) {
  const me = gameState._player;
  const pos = me?.pos;
  if (!pos) return;

  resizeCanvas();
  ctx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);

  const obstacles = gameState.map.data.obstacles;
  const closestObstacle = getClosestObstacle(pos, obstacles);

  // Draw player and target
  drawCircle(pos, 1, "blue", "Player");
  drawCircle(targetPos, 1, "green", "Goal");
  drawLine(pos, targetPos, "green", "→ Target");

  // Vector towards target
  let moveX = targetPos.x - pos.x;
  let moveY = targetPos.y - pos.y;

  if (closestObstacle) {
    const obsPos = closestObstacle.pos;
    const obsRadius = closestObstacle.collider.rad;
    const safeDist = obsRadius + 4.5;
    const distToObstacle = distance(pos, obsPos);

    // Draw obstacle and safe distance
    drawCircle(obsPos, obsRadius, "red");
    drawCircle(obsPos, safeDist, "orange");

    if (distToObstacle < safeDist) {
      let avoidX = pos.x - obsPos.x;
      let avoidY = pos.y - obsPos.y;

      const normTarget = normalizeVector(moveX, moveY);
      const normAvoid = normalizeVector(avoidX, avoidY);

      const blendFactor = 1 - (distToObstacle / safeDist);
      moveX = normTarget.x * (1 - blendFactor) + normAvoid.x * blendFactor;
      moveY = normTarget.y * (1 - blendFactor) + normAvoid.y * blendFactor;

      drawLine(pos, { x: pos.x + normAvoid.x * 20, y: pos.y + normAvoid.y * 20 }, "blue", "→ Avoid");
    }
  }

  // Normalize move vector
  const moveMag = Math.hypot(moveX, moveY);
  if (moveMag > 0) {
    moveX /= moveMag;
    moveY /= moveMag;
  }

  drawLine(pos, { x: pos.x + moveX * 20, y: pos.y + moveY * 20 }, "purple", "→ Final");

  // Simulate aiming by dispatching mousemove event
  const aimDistance = 100;
  const aimWorldPos = { x: pos.x + moveX * aimDistance, y: pos.y + moveY * aimDistance };
  const aimScreenPos = gameState._camera?.pointToScreen(aimWorldPos);
  if (aimScreenPos) {
    document.dispatchEvent(new MouseEvent('mousemove', {
      clientX: aimScreenPos.x,
      clientY: aimScreenPos.y,
      bubbles: true,
      cancelable: true,
      view: window
    }));
  }

  // Movement keys
  gameState._input.keys[87] = moveY > 0;  // W
  gameState._input.keys[83] = moveY < 0;  // S
  gameState._input.keys[65] = moveX < 0;  // A
  gameState._input.keys[68] = moveX > 0;  // D

  // Stuck detection
  if (lastPos) {
    const distMoved = distance(pos, lastPos);
    if (distMoved < stuckThreshold) {
      stuckFrames++;
    } else {
      stuckFrames = 0;
    }

    if (stuckFrames >= stuckLimit) {
      console.warn("Bot appears to be stuck");
      unstuckPlayer(pos);
      stuckFrames = 0;
    }
  }
  lastPos = { ...pos };
}

// === Melee attack simulation ===
let meleeInterval = null;
function startMeleeAttack() {
  if (meleeInterval) return;
  meleeInterval = setInterval(() => {
    if (Math.random() < 0.6) {
      document.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0
      }));
      setTimeout(() => {
        document.dispatchEvent(new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          view: window,
          button: 0
        }));
      }, 100);
    }
  }, 500);
}

function stopMeleeAttack() {
  if (meleeInterval) {
    clearInterval(meleeInterval);
    meleeInterval = null;
  }
}

// === Start/Stop wander loop with requestAnimationFrame ===
let wanderRunning = false;
let targetPos = { x: 0, y: -400 };

function wanderLoop() {
  if (!wanderRunning) return;
  wanderNearTarget(targetPos);
  requestAnimationFrame(wanderLoop);
}

function startWandering() {
  if (wanderRunning) return;
  wanderRunning = true;
  startMeleeAttack();
  requestAnimationFrame(wanderLoop);
}

function stopWandering() {
  if (!wanderRunning) return;
  wanderRunning = false;
  stopMeleeAttack();

  if (gameState._input?.keys) {
    gameState._input.keys[87] = false;
    gameState._input.keys[83] = false;
    gameState._input.keys[65] = false;
    gameState._input.keys[68] = false;
  }
}

function toggleWandering() {
  if (wanderRunning) {
    stopWandering();
  } else {
    startWandering();
  }
}
