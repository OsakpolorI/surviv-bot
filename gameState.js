const gameState = {
  currentAction: null,

  get _game() {
    return window.game;
  },

  get _player() {
    return this._game?.activePlayer;
  },

  get _camera() {
    return this._game?.camera;
  },

  get _input() {
    return this._game?.input;
  },

  get _localData() {
    return this._player?.localData;
  },

  get _weaponData() {
    return window.weaponData;
  },

  player: {
    get data() {
      const localData = gameState._localData;
      const weaponData = gameState._weaponData;
      const curWeapIdx = localData?.curWeapIdx;
      const weapons = localData?.weapons;
      const weapon = weapons?.[curWeapIdx];
      const weaponInfo = weaponData?.[weapon];

      return {
        health: localData?.health ?? 100,
        isKnocked: gameState._player?.downed ?? false,
        curWeapIdx,
        ammoInClip: weapon?.ammo,
        maxAmmoInClip: weaponInfo?.maxClip,
        isWeaponAutomatic: weaponInfo?.fireMode !== 'single',
        position: gameState._player?.pos,
        direction: gameState._player?.dir,
        layer: gameState._player?.layer,
      };
    }
  },

  enemy: {
    get data() {
      const players = gameState._game?.playerBarn?.playerPool?.pool ?? [];
      const player = gameState._player;
      const [enemy, distance] = findClosestEnemy(players, player, getTeam, gameState._game) ?? [];

      return {
        isVisible: enemy?.isVisible ?? false,
        position: enemy?.pos ?? { x: 0, y: 0 },
        id: enemy?.__id ?? null,
        layer: enemy?.layer,
        direction: enemy?.dir,
        distance: distance ?? null
      };
    }
  },

  map: {
  get data() {
    const map = gameState._game?.map;
    const obstacles = map?.obstaclePool?.pool ?? [];

    const playerPos = gameState.player.data.position;
    const enemyPos = gameState.enemy.data.position;
    const checkRadius = 200; // Adjust this radius as needed

    // Check if any object is blocking line of sight
    const behindCover = obstacles.some(ob => {
      return isBehindCover(
        playerPos,
        enemyPos,
        ob.pos,
        ob.radius
      );
    });

    // Check if there are *any* obstacles within a certain radius around the player
    const isOpenArea = !obstacles.some(ob => {
      const dx = ob.pos.x - playerPos.x;
      const dy = ob.pos.y - playerPos.y;
      const dist = Math.hypot(dx, dy);
      return dist <= checkRadius;
    });

    return {
      obstacles,
      isBehindCover: behindCover,
      distanceToCover: null,
      hasLineOfSight: !behindCover,
      isOpenArea,
    };
  }
},

  timing: {
    get data() {
      return {
        lastShotTime: null,
        lastReloadTime: null,
        reloadDurationRemaining: null,
        healDurationRemaining: null,
        actionTimerRemaining: null,
      };
    }
  },

  computedStates: {
    get data() {
      return {
        shouldShoot: null,
        shouldReload: null,
        shouldHeal: null,
        shouldEvade: null,
        safeToPerformAction: null,
      };
    }
  },

  devLogs: {
    treePathTrace: []
  }
};