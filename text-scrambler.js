class TextScrambler {
  constructor(el) {
    this.el = el;
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
    this.originalText = this.prepareText(el.textContent);
    this.originalHTML = el.innerHTML;
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
    
    // Initialize immediately for continuous effect
    if (this.continuous) {
      this.setText(this.originalText);
    }
    
    // Set up hover effects
    if (!this.continuous && !el.closest('.tab')) {
      el.addEventListener('mouseenter', () => this.triggerScramble());
    }
  }

  // Normalize spaces and convert HTML entities
  prepareText(text) {
    const temp = document.createElement('div');
    temp.innerHTML = text;
    return temp.textContent
      .replace(/\u00A0/g, ' ') // Convert &nbsp; to space
      .replace(/\s+/g, ' ')    // Collapse multiple spaces
      .trim();
  }

  // Skip scrambling for spaces and &nbsp;
  shouldSkipScramble(char) {
    return char === ' ' || char === '\u00A0';
  }

  // Case-insensitive variable resolution
  resolveCharset(charset) {
    if (!charset) return null;
    
    if (charset.startsWith('$')) {
      const varName = charset.substring(1).toLowerCase();
      return this.getGlobalVariable(varName) || charset;
    }
    
    return this.getGlobalVariable(charset.toLowerCase()) || charset;
  }

  // Case-insensitive global variable access
  getGlobalVariable(name) {
    try {
      const lowerName = name.toLowerCase();
      if (typeof window !== 'undefined') {
        for (const key in window) {
          if (key.toLowerCase() === lowerName) return window[key];
        }
      }
      if (typeof globalThis !== 'undefined') {
        for (const key in globalThis) {
          if (key.toLowerCase() === lowerName) return globalThis[key];
        }
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  // Case-insensitive mapping parser
  parseCharMappings(mappingString) {
    if (!mappingString) return {};
    
    if (mappingString.startsWith('$')) {
      const varName = mappingString.substring(1).toLowerCase();
      const varValue = this.getGlobalVariable(varName);
      
      if (typeof varValue === 'string') {
        return this.parseDirectMappings(varValue);
      } else if (typeof varValue === 'object' && varValue !== null) {
        const lowerCaseMappings = {};
        for (const key in varValue) {
          lowerCaseMappings[key.toLowerCase()] = varValue[key];
          lowerCaseMappings[key.toUpperCase()] = varValue[key];
        }
        return lowerCaseMappings;
      }
      return {};
    }
    
    return this.parseDirectMappings(mappingString);
  }

  parseDirectMappings(mappingString) {
    const mappings = {};
    mappingString.split(',').forEach(pair => {
      const [char, set] = pair.split(':').map(s => s.trim());
      if (char && set) {
        const charset = this.resolveCharset(set);
        mappings[char.toLowerCase()] = charset;
        mappings[char.toUpperCase()] = charset;
        if (char !== char.toLowerCase() && char !== char.toUpperCase()) {
          mappings[char] = charset;
        }
      }
    });
    return mappings;
  }

  triggerScramble() {
    if (!this.isScrambling) {
      this.setText(this.originalText).then(() => {
        if (!this.continuous) {
          setTimeout(() => {
            this.el.innerHTML = this.originalHTML;
          }, this.duration);
        }
      });
    }
  }

  setText(newText) {
    if (this.isScrambling) return Promise.resolve();
    
    this.isScrambling = true;
    const preparedText = this.prepareText(newText);
    const oldText = this.prepareText(this.el.textContent);
    
    return new Promise(resolve => {
      this.resolve = () => {
        this.isScrambling = false;
        resolve();
        if (this.continuous) {
          setTimeout(() => this.setText(this.originalText), 1000);
        }
      };
      
      this.queue = [];
      const length = Math.max(oldText.length, preparedText.length);

      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = preparedText[i] || '';
        
        if (this.shouldSkipScramble(to)) {
          this.queue.push({
            from,
            to,
            start: 0,
            end: 0,
            chars: ''
          });
          continue;
        }

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

  getCharsForChar(char) {
    return this.charMappings[char] || 
           this.charMappings[char.toLowerCase()] || 
           this.charMappings[char.toUpperCase()] || 
           this.globalChars || 
           this.defaultChars;
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
      } else if (this.frame >= start && chars) {
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

  randomChar(charset) {
    return charset[Math.floor(Math.random() * charset.length)];
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-scramble]').forEach(el => {
    const scrambler = new TextScrambler(el);
    el.scrambler = scrambler;
  });
  
  const activeTab = document.querySelector('.tablinks.active[data-scramble]');
  if (activeTab && activeTab.scrambler) {
    activeTab.scrambler.setText(activeTab.scrambler.originalText);
  }
});
