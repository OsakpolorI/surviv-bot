// utils.js

function getTeam(player) {
  const teamInfo = game?.playerBarn?.teamInfo;
  if (!teamInfo || !player) return null;

  return Object.keys(teamInfo).find(team =>
    teamInfo[team].playerIds.includes(player.__id)
  );
}


function findClosestEnemy(players, me, getTeamFn, game) {
  const meTeam = getTeamFn(me);
  let enemy = null;
  let minDistance = Infinity;

  players.forEach(player => {
    const info = game?.playerBarn?.playerInfo?.[player.__id];
    if (
      !info ||
      info.name === 'Nort' || info.name === 'Player' ||
      player.netData?.downed || !player.active || player.netData?.dead ||
      player.__id === me.__id || getTeamFn(player) === meTeam
    ) return;

    const screenPos = game.camera.pointToScreen(player.pos);
    const dist = (screenPos.x - game.input.mousePos.x) ** 2 +
                 (screenPos.y - game.input.mousePos.y) ** 2;

    if (dist < minDistance) {
      minDistance = dist;
      enemy = player;
    }
  });

  return [enemy, distance];
}

function isBehindCover(playerPos, enemyPos, objectPos, objectRadius, buffer = 0.3) {
  // Vector from enemy to player
  const rayVec = {
    x: playerPos.x - enemyPos.x,
    y: playerPos.y - enemyPos.y,
  };

  // Vector from enemy to object
  const objVec = {
    x: objectPos.x - enemyPos.x,
    y: objectPos.y - enemyPos.y,
  };

  const rayLength = Math.hypot(rayVec.x, rayVec.y);
  if (rayLength === 0) return false;

  // Normalize rayVec
  const rayNorm = {
    x: rayVec.x / rayLength,
    y: rayVec.y / rayLength,
  };

  // Project objVec onto rayVec
  const projectionLength = objVec.x * rayNorm.x + objVec.y * rayNorm.y;

  // If the object is not between enemy and player, skip it
  if (projectionLength < 0 || projectionLength > rayLength) return false;

  // Closest point on the ray to the object
  const closestPoint = {
    x: enemyPos.x + rayNorm.x * projectionLength,
    y: enemyPos.y + rayNorm.y * projectionLength,
  };

  // Perpendicular distance from object to the ray
  const dx = objectPos.x - closestPoint.x;
  const dy = objectPos.y - closestPoint.y;
  const perpendicularDist = Math.hypot(dx, dy);

  return perpendicularDist <= objectRadius + buffer;
}

function clearKeyboardInputs() {
  state = gameState
  for (const key in state._input.keys) {
    if (Object.hasOwnProperty.call(state._input.keys, key)) {
      state._input.keys[key] = false;
    }
  }
  for (const key in state._input.keysOld) {
    if (Object.hasOwnProperty.call(state._input.keysOld, key)) {
      state._input.keysOld[key] = false;
    }
  }
}