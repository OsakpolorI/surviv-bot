class ActionNode {
  constructor(actionFn, duration = 0, interruptCondition = null) {
    this.action = actionFn;
    this.duration = duration;
    this.interruptCondition = interruptCondition;
    this.timeout = null;
  }

  execute(state, onComplete) {
    if (this.interruptCondition && this.interruptCondition(state)) {
      if (onComplete) onComplete();
      return;
    }

    state.currentAction = this;
    this.action(state);

    if (this.duration > 0) {
      this.timeout = setTimeout(() => {
        state.currentAction = null;
        if (onComplete) onComplete();
      }, this.duration);
    } else {
      if (onComplete) onComplete();
    }
  }

  cancel() {
    if (this.timeout) clearTimeout(this.timeout);
  }
}

// Action nodes (instances)
const fightActionNode = new ActionNode(
  function(state) {
    console.log("Enemy detected, preparing to fight...");
    // Add fight logic here (shooting, aiming, etc.)
  },
  5000,
  (state) => (state.enemy === null || state.player.data.isKnocked == true ||state.player.data.isKnocked === true)
);

const wanderActionNode = new ActionNode(
  function(state) {
    const targetPos = { x: 150, y: 160 };
    
    // Store the interval ID on this node instance so we can clear it later
    if (!this.wanderInterval) {
      this.wanderInterval = setInterval(() => {
        wanderToTarget(targetPos);
        meleeAttack()
      }, 50);
    }
  },
  100000, // long duration (e.g., 100 seconds)
  (state) => (state.enemy.data.id !== null || state.player.data.isKnocked == true)
);

// Override cancel method to clear interval too
wanderActionNode.cancel = function() {
  if (this.wanderInterval) {
    clearInterval(this.wanderInterval);
    this.wanderInterval = null;
  }
  if (this.timeout) clearTimeout(this.timeout);

  clearKeyboardInputs();
};

const reviveActionNode = new ActionNode(
  function (state) {
    console.log('hello')
    const keyCode = 70; // 'F' key

    // Press the key
    gameState._input.keys[keyCode] = true;
    gameState._input.keysOld[keyCode] = false;

    // Release after 4.1 seconds
    setTimeout(() => {
      gameState._input.keys[keyCode] = false;
      gameState._input.keysOld[keyCode] = false;
    }, 4100);
  },
  4100
);

const healActionNode = new ActionNode(
  function (state) {
    console.log("Healing... (you can replace this with a real heal action)");
    // Example: press 4 to heal (bandage/medkit key)
    const keyCode = 55;
    gameState._input.keys[keyCode] = true;
    gameState._input.keysOld[keyCode] = false;

    setTimeout(() => {
      gameState._input.keys[keyCode] = false;
      gameState._input.keysOld[keyCode] = false;
    }, 1000); // healing duration placeholder
  },
  1000,
  (state) => state.player.data.health < 50
);







