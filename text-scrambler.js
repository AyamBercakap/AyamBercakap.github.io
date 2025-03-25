class TextScrambler {
  constructor(el) {
    this.el = el;
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
    this.originalText = el.textContent;
    this.frameRequest = null;
    
    // Configuration
    this.duration = parseInt(el.dataset.scrambleDuration) || 600;
    this.frameRate = 16.67;
    this.totalFrames = Math.round(this.duration / this.frameRate);
    this.scrambleColor = el.dataset.scrambleColor || '#FFFFFF';
    this.onlyActive = el.hasAttribute('data-scramble-active-only');
    this.continuous = el.hasAttribute('data-scramble-continuous');
    
    // charset with 3 fallbacks
    this.chars = this._resolveCharSet(el);
  }

  _resolveCharSet(el) {
    const charSource = el.dataset.scrambleChars;
    
    // check if referring global vars
    if (charSource && window[charSource]) {
      return window[charSource];
    }
    
    // check if it is a string
    if (charSource && typeof charSource === 'string') {
      return charSource;
    }
    
    // Fall back to default symbol
    return '!<>-_\\/[]{}—=+*^?#________';
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

// Initialize with all features
document.addEventListener('DOMContentLoaded', () => {
  // Regular elements
  document.querySelectorAll('[data-scramble]').forEach(el => {
    const scrambler = new TextScrambler(el);
    
    // Continuous animation
    if (el.hasAttribute('data-scramble-continuous')) {
      scrambler.setText(scrambler.originalText);
    }
    
    // Hover effect (unless disabled)
    if (!el.hasAttribute('data-scramble-no-hover')) {
      el.addEventListener('mouseenter', () => {
        scrambler.setText(scrambler.originalText);
      });
    }
  });

  // Tab system integration
  const tabButtons = document.querySelectorAll('.tab button[data-scramble]');
  tabButtons.forEach(button => {
    const scrambler = new TextScrambler(button);
    
    button.addEventListener('click', function(e) {
      // Update active state
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Re-scramble with proper character set
      new TextScrambler(this).setText(this.textContent);
      
      // Call original tab handler if exists
      if (typeof openTab === 'function') {
        const tabName = this.onclick.toString().match(/'([^']+)'/)[1];
        openTab(e, tabName);
      }
    });

    // Initialize active tab
    if (button.classList.contains('active')) {
      scrambler.setText(scrambler.originalText);
    }
  });
});
