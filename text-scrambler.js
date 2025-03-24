class TextScrambler {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
    this.originalText = this.el.textContent;
    this.frameRequest = null;
    this.isActiveTab = el.classList.contains('active') && el.closest('.tab');
}
    // Configuration
    this.scrambleColor = el.dataset.scrambleColor || 
                        (this.isActiveTab ? 'white' : '#FFD700');
    this.onlyActive = el.hasAttribute('data-scramble-active-only');
  // Speed Controllers
    this.duration = parseInt(el.dataset.scrambleDuration) || 600;
    this.frameRate = 16.67;
    this.totalFrames = Math.round(this.duration / this.frameRate); 
  }

  setText(newText) {
    // Skip if element should only scramble when active but isn't
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
      let { from, to, start, end, char } = this.queue[i];
      
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span style="color:${this.scrambleColor}" class="scramble-char">${char}</span>`;
      } else {
        output += from;
      }
    }
    
    this.el.innerHTML = output;
    
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update.bind(this));
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// Initialize all scramblers
document.addEventListener('DOMContentLoaded', () => {
  // Regular elements
  document.querySelectorAll('[data-scramble]:not(.tab button)').forEach(el => {
    const scrambler = new TextScrambler(el);
    el.addEventListener('mouseenter', () => scrambler.setText(scrambler.originalText));
    
    if (el.tagName === 'A') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        scrambler.setText(scrambler.originalText).then(() => {
          window.location.href = el.href;
        });
      });
    }
  });

  // Tab buttons with special handling
  const tabButtons = document.querySelectorAll('.tab button');
  tabButtons.forEach(button => {
    const scrambler = new TextScrambler(button);
    scrambler.onlyActive = true; // Only scramble when active
    
    button.addEventListener('mouseenter', () => {
      scrambler.setText(scrambler.originalText);
    });
    
    button.addEventListener('click', function(e) {
      // Update active state
      tabButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Re-scramble with correct color
      const newScrambler = new TextScrambler(this);
      newScrambler.setText(newScrambler.originalText);
      
      // Call original tab function if exists
      if (typeof openTab === 'function') {
        const tabName = this.getAttribute('onclick').match(/'([^']+)'/)[1];
        openTab(e, tabName);
      }
    });
    
    // Initial scramble if active
    if (button.classList.contains('active')) {
      scrambler.setText(scrambler.originalText);
    }
  });
});
