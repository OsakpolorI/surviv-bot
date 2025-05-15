function meleeAttack() {
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
}