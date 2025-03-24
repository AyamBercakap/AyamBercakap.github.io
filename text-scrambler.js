class TextScramble {
  constructor(element) {
    this.element = element;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
    this.originalText = element.textContent;
    this.isActiveTab = element.classList.contains('active');
    this.duration = element.dataset.scrambleDuration || 1000;
    this.intensity = element.dataset.scrambleIntensity || 0.28;
  }

  setText(newText) {
    const oldText = this.element.textContent;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = '';
    let complete = 0;
    
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < this.intensity) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char">${char}</span>`;
      } else {
        output += from;
      }
    }

    this.element.innerHTML = output;
    
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }

  startContinuousEffect() {
    this.setText(this.originalText).then(() => {
      if (this.element.classList.contains('active') || 
          this.element.hasAttribute('data-scramble-continuous')) {
        setTimeout(() => this.startContinuousEffect(), this.duration);
      }
    });
  }
}

// Initialize scrambler on all elements with data-scramble attribute
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all elements with data-scramble attribute
  document.querySelectorAll('[data-scramble]').forEach(el => {
    const scrambler = new TextScramble(el);
    
    // Set custom properties if defined
    if (el.dataset.scrambleChars) {
      scrambler.chars = el.dataset.scrambleChars;
    }
    if (el.dataset.scrambleIntensity) {
      scrambler.intensity = parseFloat(el.dataset.scrambleIntensity);
    }
    
    // Mouseenter effect
    if (!el.hasAttribute('data-scramble-no-hover')) {
      el.addEventListener('mouseenter', () => {
        scrambler.setText(scrambler.originalText);
      });
    }
    
    // Continuous effect if specified
    if (el.hasAttribute('data-scramble-continuous')) {
      scrambler.startContinuousEffect();
    }
  });

  // Special handling for tab system
  const tabButtons = document.querySelectorAll('.tab button');
  tabButtons.forEach(button => {
    const scrambler = new TextScramble(button);
    button.addEventListener('mouseenter', () => {
      scrambler.setText(scrambler.originalText);
    });
    
    if (button.classList.contains('active')) {
      scrambler.startContinuousEffect();
    }
  });

  // Watch for tab changes
  document.querySelector('.tab')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('tablinks')) {
      const activeScrambler = new TextScramble(e.target);
      activeScrambler.startContinuousEffect();
    }
  });
});
