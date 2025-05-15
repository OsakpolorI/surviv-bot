// Now define decision nodes that lead to those actions
const lowHealthDecisionNode = new DecisionNode(
  (state) => state.player.data.health < 50,
  healActionNode,
  fightActionNode // do nothing if health >= 50
);

const isEnemyDetectedNode = new DecisionNode(
  (gameState) => gameState.enemy.data.id !== null,
  fightActionNode,
  wanderActionNode
);

const isKnockedNode = new DecisionNode(
  (gameState) => gameState.player.data.isKnocked == true,
  reviveActionNode,
  isEnemyDetectedNode
)

function buildBehaviourTree() {
  return isKnockedNode;  // Root node of the tree
}