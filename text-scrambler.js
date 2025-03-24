class TextScrambler {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
    this.originalText = this.el.textContent;
    this.frameRequest = null;
    
    // Get color from data attribute or use default
    this.scrambleColor = el.dataset.scrambleColor || '#FFD700'; // Default gold
  }

  setText(newText) {
    return new Promise(resolve => {
      this.resolve = resolve;
      this.queue = [];
      
      const oldText = this.el.textContent;
      const length = Math.max(oldText.length, newText.length);
      
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
        // Apply the scramble color with inline style
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

// Initialize with support for color customization
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-scramble]').forEach(el => {
    const scrambler = new TextScrambler(el);
    
    el.addEventListener('mouseenter', () => {
      scrambler.setText(scrambler.originalText);
    });
    
    // Special handling for clickable elements
    if (el.tagName === 'A') {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        scrambler.setText(scrambler.originalText).then(() => {
          window.location.href = el.href;
        });
      });
    }
  });
});
