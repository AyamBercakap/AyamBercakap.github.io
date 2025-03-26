class TextScrambler {
  constructor(el) {
    this.el = el;
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
    this.originalText = el.textContent.trim();
    this.originalHTML = el.innerHTML; // Store original HTML
    this.frameRequest = null;
    
    // Character configuration
    this.charMappings = this.parseCharMappings(el.dataset.scrambleMappings);
    this.globalChars = this.resolveCharset(el.dataset.scrambleChars);
    this.defaultChars = '!<>-_\\/[]{}—=+*^?#________';
    
    // Animation config
    this.duration = parseInt(el.dataset.scrambleDuration) || 600;
    this.frameRate = 16.67;
    this.totalFrames = Math.round(this.duration / this.frameRate);
    this.scrambleColor = el.dataset.scrambleColor || '#FFFFFF';
    this.continuous = el.hasAttribute('data-scramble-continuous');
    this.isScrambling = false;
    
    // Initialize continuous effect
    if (this.continuous) {
      this.setText(this.originalText);
    }
    
    // hover effects for non-continuous elements
    if (!this.continuous && !el.closest('.tab')) {
      el.addEventListener('mouseenter', () => {
        if (!this.isScrambling) {
          this.setText(this.originalText);
        }
      });
      
      el.addEventListener('mouseleave', () => {
        if (!this.isScrambling) {
          this.el.innerHTML = this.originalHTML;
        }
      });
    }
  }

  // ... [Keep all the previous helper methods unchanged] ...

  setText(newText) {
    if (this.isScrambling) return;
    
    this.isScrambling = true;
    const oldText = this.el.textContent;
    
    return new Promise(resolve => {
      this.resolve = () => {
        this.isScrambling = false;
        resolve();
        if (this.continuous) {
          setTimeout(() => this.setText(this.originalText), 1000);
        }
      };
      
      this.queue = [];
      const length = Math.max(oldText.length, newText.length);

      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * this.totalFrames * 0.3);
        const end = start + Math.floor(Math.random() * this.totalFrames * 0.7);
        this.queue.push({ 
          from, 
          to, 
          start, 
          end,
          chars: this.getCharsForChar(to)
        });
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
      const { from, to, start, end, chars } = this.queue[i];
      let char = this.queue[i].char;

      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar(chars);
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char" style="color:${this.scrambleColor}">${char}</span>`;
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
}

// Initialize with tab support
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all scramblers
  document.querySelectorAll('[data-scramble]').forEach(el => {
    new TextScrambler(el);
  });
  
  // Special handling for active tab on load
  const activeTab = document.querySelector('.tablinks.active');
  if (activeTab && activeTab.hasAttribute('data-scramble')) {
    activeTab.scrambler.setText(activeTab.scrambler.originalText);
  }
});
