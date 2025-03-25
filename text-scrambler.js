class TextScrambler {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
    this.originalText = el.textContent;
    this.frameRequest = null;
    
    // Configuration
    this.duration = parseInt(el.dataset.scrambleDuration) || 600;
    this.frameRate = 16.67;
    this.totalFrames = Math.round(this.duration / this.frameRate);
    this.scrambleColor = el.dataset.scrambleColor || '#FFD700';
    this.onlyActive = el.hasAttribute('data-scramble-active-only');
    this.continuous = el.hasAttribute('data-scramble-continuous');
  }

  setText(newText) {
    if (this.onlyActive && !this.el.classList.contains('active')) {
      this.el.textContent = this.originalText;
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.resolve = resolve;
      this.queue = [];
      const oldText = this.el.textContent;
      const length = Math.max(oldText.length, newText.length);

      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * this.totalFrames * 0.3);
        const end = start + Math.floor(Math.random() * this.totalFrames * 0.7);
        this.queue.push({ from, to, start, end });
      }

      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.update();
    });
  }

  update() {
    let output = '';
    let complete = 0;

    for (let i = 0; i < this.queue.length; i++) {
      const { from, to, start, end } = this.queue[i];
      let char = this.queue[i].char;

      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span style="color:${this.scrambleColor}">${char}</span>`;
      } else {
        output += from;
      }
    }

    this.el.innerHTML = output;

    if (complete === this.queue.length) {
      this.resolve();
      // Restart if continuous
      if (this.continuous || (this.onlyActive && this.el.classList.contains('active'))) {
        requestAnimationFrame(() => this.setText(this.originalText));
      }
    } else {
      this.frameRequest = requestAnimationFrame(this.update.bind(this));
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Regular elements
  document.querySelectorAll('[data-scramble]').forEach(el => {
    const scrambler = new TextScrambler(el);
    
    // Start continuous if requested
    if (el.hasAttribute('data-scramble-continuous')) {
      scrambler.setText(scrambler.originalText);
    }
    
    // Hover handling
    el.addEventListener('mouseenter', () => {
      scrambler.setText(scrambler.originalText);
    });
  });

  // Tab system
  const tabButtons = document.querySelectorAll('.tab button');
  tabButtons.forEach(button => {
    const scrambler = new TextScrambler(button);
    
    button.addEventListener('click', function(e) {
      // Update active state
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Restart animation for new active tab
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
