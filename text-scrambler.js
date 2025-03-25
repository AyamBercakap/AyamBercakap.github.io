class TextScrambler {
  constructor(el) {
    this.el = el;
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
    this.originalText = el.textContent.trim();
    this.frameRequest = null;
    
    const charSource = el.dataset.scrambleChars;
    this.chars = charSource 
      ? (window[charSource] || charSource)
      : '!<>-_\\/[]{}—=+*^?#________';
    
    this.duration = parseInt(el.dataset.scrambleDuration) || 600;
    this.frameRate = 16.67;
    this.totalFrames = Math.round(this.duration / this.frameRate);
    this.scrambleColor = el.dataset.scrambleColor || '#FFFFFF';
    this.continuous = el.hasAttribute('data-scramble-continuous');
    this.isScrambling = false;
  }

  setText(newText) {
    if (this.isScrambling) return;
    this.isScrambling = true;
    
    return new Promise(resolve => {
      this.resolve = () => {
        resolve();
        this.isScrambling = false;
        if (this.continuous) this._queueNextScramble();
      };
      
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

  _queueNextScramble() {
    this.frameRequest = requestAnimationFrame(() => {
      this.setText(this.originalText);
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
    } else {
      this.frameRequest = requestAnimationFrame(this.update.bind(this));
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// Initialize with tab button support
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-scramble]').forEach(el => {
    const scrambler = new TextScrambler(el);
    el.scrambler = scrambler;

    // Only add hover effect to non-tab elements
    if (!el.closest('.tab')) {
      el.addEventListener('mouseenter', () => {
        scrambler.setText(scrambler.originalText);
      });
    }

    // Initialize active tab
    if (el.classList.contains('active') && el.closest('.tab')) {
      scrambler.setText(scrambler.originalText);
    }

    if (el.hasAttribute('data-scramble-continuous')) {
      scrambler.setText(scrambler.originalText);
    }
  });
});s
