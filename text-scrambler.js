class TextScrambler {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
    this.originalText = this.el.textContent;
    this.isActive = this.el.classList.contains('active');
    this.frameRequest = null;
    
    // Configuration from data attributes
    this.config = {
      duration: parseInt(el.dataset.scrambleDuration) || 600,
      intensity: parseFloat(el.dataset.scrambleIntensity) || 0.28,
      chars: el.dataset.scrambleChars || this.chars,
      continuous: el.hasAttribute('data-scramble-continuous'),
      noHover: el.hasAttribute('data-scramble-no-hover')
    };
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
        if (!char || Math.random() < this.config.intensity) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char">${char}</span>`;
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
    return this.config.chars[Math.floor(Math.random() * this.config.chars.length)];
  }

  startContinuous() {
    this.setText(this.originalText).then(() => {
      if (this.isActive || this.config.continuous) {
        setTimeout(() => this.startContinuous(), this.config.duration);
      }
    });
  }

  destroy() {
    cancelAnimationFrame(this.frameRequest);
    this.el.textContent = this.originalText;
  }
}

// Main controller class
class ScrambleManager {
  constructor() {
    this.instances = new Map();
    this.init();
  }

  init() {
    // Initialize all elements with data-scramble attribute
    document.querySelectorAll('[data-scramble]').forEach(el => {
      this.setupElement(el);
    });

    // Special handling for tab system
    this.setupTabs();
  }

  setupElement(el) {
    const scrambler = new TextScrambler(el);
    this.instances.set(el, scrambler);
    
    if (!scrambler.config.noHover) {
      el.addEventListener('mouseenter', () => this.handleHover(el));
    }
    
    if (scrambler.config.continuous || el.classList.contains('active')) {
      scrambler.startContinuous();
    }
  }

  setupTabs() {
    const tabContainer = document.querySelector('.tab');
    if (!tabContainer) return;
    
    tabContainer.querySelectorAll('button').forEach(btn => {
      if (!this.instances.has(btn)) {
        this.setupElement(btn);
      }
    });
    
    tabContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('tablinks')) {
        this.handleTabChange(e.target);
      }
    });
  }

  handleHover(el) {
    const instance = this.instances.get(el);
    if (instance) {
      instance.setText(instance.originalText);
    }
  }

  handleTabChange(tabBtn) {
    this.instances.forEach((instance, el) => {
      if (el.classList.contains('tablinks')) {
        instance.isActive = el === tabBtn;
        if (instance.isActive) {
          instance.startContinuous();
        }
      }
    });
  }

  destroy() {
    this.instances.forEach(instance => instance.destroy());
    this.instances.clear();
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.scrambleManager = new ScrambleManager();
});
