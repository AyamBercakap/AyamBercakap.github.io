class TextScrambler {
  constructor(el) {
    this.el = el;
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
    this.originalText = el.textContent.trim();
    this.frameRequest = null;
    
    // Character configuration (also configurable in html)
    this.charMappings = this.parseCharMappings(el.dataset.scrambleMappings);
    this.globalChars = this.resolveCharset(el.dataset.scrambleChars);
    this.defaultChars = '!<>-_\\/[]{}—=+*^?#________';
    
    // Configurable in html
    this.duration = parseInt(el.dataset.scrambleDuration) || 600;
    this.frameRate = 16.67;
    this.totalFrames = Math.round(this.duration / this.frameRate);
    this.scrambleColor = el.dataset.scrambleColor || '#FFFFFF';
    this.continuous = el.hasAttribute('data-scramble-continuous');
    this.isScrambling = false;
    
    // Store instance on element
    el.scrambler = this;
  }

  // Parse character mappings (supports variables and direct mappings)
  parseCharMappings(mappingString) {
    if (!mappingString) return {};
    
    // Handle variable reference
    if (mappingString.startsWith('$')) {
      const varName = mappingString.substring(1);
      const varValue = window[varName];
      
      if (typeof varValue === 'string') {
        return this.parseDirectMappings(varValue);
      } else if (typeof varValue === 'object') {
        return varValue;
      }
      return {};
    }
    
    // Handle direct mappings
    return this.parseDirectMappings(mappingString);
  }

  parseDirectMappings(mappingString) {
    const mappings = {};
    mappingString.split(',').forEach(pair => {
      const [char, set] = pair.split(':').map(s => s.trim());
      if (char && set) {
        mappings[char] = this.resolveCharset(set);
      }
    });
    return mappings;
  }

  // Resolve charset (supports variables, strings, or direct chars)
  resolveCharset(charset) {
    if (!charset) return null;
    if (charset.startsWith('$')) {
      return window[charset.substring(1)] || charset;
    }
    return window[charset] || charset;
  }

  // Get appropriate charset for a character
  getCharsForChar(char) {
    return this.charMappings[char] || this.globalChars || this.defaultChars;
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

  _queueNextScramble() {
    this.frameRequest = requestAnimationFrame(() => {
      this.setText(this.originalText);
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

  randomChar(charset) {
    return charset[Math.floor(Math.random() * charset.length)];
  }
}

// Initialize all scramblers
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-scramble]').forEach(el => {
    const scrambler = new TextScrambler(el);
    
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

    // Continuous scramble
    if (el.hasAttribute('data-scramble-continuous')) {
      scrambler.setText(scrambler.originalText);
    }
  });
});
