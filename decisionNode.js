// decisionNode.js

// Define the DecisionNode class
class DecisionNode {
  constructor(conditionFn, trueBranch, falseBranch) {
    this.conditionFn = conditionFn;
    this.trueBranch = trueBranch;
    this.falseBranch = falseBranch;
  }

  execute(state, onComplete) {
    const conditionResult = this.conditionFn(state);
    const nextNode = conditionResult ? this.trueBranch : this.falseBranch;

    if (nextNode && typeof nextNode.execute === "function") {
      nextNode.execute(state, onComplete);
    } else {
      // No nextNode or it doesn't have execute, just call onComplete
      if (onComplete) onComplete();
    }
  }
}
