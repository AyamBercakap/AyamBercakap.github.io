// Initialize all elements
document.addEventListener('DOMContentLoaded', () => {
  // Regular elements
  document.querySelectorAll('[data-scramble]').forEach(el => {
    if (!el.closest('.tab')) { // Skip tab buttons
      const scrambler = new TextScrambler(el);
      el.addEventListener('mouseenter', () => scrambler.setText(scrambler.originalText));
    }
  });

  // Tab buttons
  const tabButtons = document.querySelectorAll('.tab [data-scramble]');
  tabButtons.forEach(button => {
    const scrambler = new TextScrambler(button);
    
    button.addEventListener('mouseenter', () => {
      if (button.classList.contains('active')) {
        scrambler.setText(scrambler.originalText);
      }
    });

    button.addEventListener('click', function(e) {
      // Update active state
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Trigger scramble
      const newScrambler = new TextScrambler(this);
      newScrambler.setText(newScrambler.originalText);
      
      // Call original openTab if exists
      if (typeof openTab === 'function') {
        const tabName = this.onclick.toString().match(/'([^']+)'/)[1];
        openTab(e, tabName);
      }
    });

    // Initial active tab
    if (button.classList.contains('active')) {
      scrambler.setText(scrambler.originalText);
    }
  });
});
