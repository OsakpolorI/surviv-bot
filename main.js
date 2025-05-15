const rootDecisionNode = buildBehaviourTree();

setInterval(() => {
  const currentAction = gameState.currentAction;

  if (currentAction) {
    if (currentAction.interruptCondition && currentAction.interruptCondition(gameState)) {
      currentAction.cancel();
      gameState.currentAction = null;
    }
    return;
  }

  const newAction = rootDecisionNode.execute(gameState);
  if (newAction) {
    gameState.currentAction = newAction;
    console.log("newAction:", newAction);
    console.log("typeof newAction.execute:", typeof newAction.execute);

    newAction.execute(gameState);
  }
}, 500);