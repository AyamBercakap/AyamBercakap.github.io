class TextScrambler {
  constructor(el) {
    this.el = el;
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
    this.originalText = el.textContent.trim();
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

  // Fixed variable resolution
  resolveCharset(charset) {
    if (!charset) return null;
    
    // Handle variable reference
    if (charset.startsWith('$')) {
      const varName = charset.substring(1);
      return this.getGlobalVariable(varName) || charset;
    }
    
    // Handle direct charset or variable name
    return this.getGlobalVariable(charset) || charset;
  }

  // Safely get global variables
  getGlobalVariable(name) {
    try {
      // Check window (browser) and globalThis (Node.js)
      if (typeof window !== 'undefined' && window[name]) return window[name];
      if (typeof globalThis !== 'undefined' && globalThis[name]) return globalThis[name];
    } catch (e) {
      return null;
    }
    return null;
  }

  // Fixed mapping parser with case-insensitive support
  parseCharMappings(mappingString) {
    if (!mappingString) return {};
    
    // Handle variable reference
    if (mappingString.startsWith('$')) {
      const varName = mappingString.substring(1);
      const varValue = this.getGlobalVariable(varName);
      
      if (typeof varValue === 'string') {
        return this.parseDirectMappings(varValue);
      } else if (typeof varValue === 'object' && varValue !== null) {
        // Convert object keys to support case-insensitive matching
        const caseInsensitiveMappings = {};
        for (const key in varValue) {
          caseInsensitiveMappings[key.toLowerCase()] = varValue[key];
          caseInsensitiveMappings[key.toUpperCase()] = varValue[key];
        }
        return caseInsensitiveMappings;
      }
      return {};
    }
    
    // Handle direct mappings with case-insensitive support
    return this.parseDirectMappings(mappingString);
  }

  parseDirectMappings(mappingString) {
    const mappings = {};
    mappingString.split(',').forEach(pair => {
      const [char, set] = pair.split(':').map(s => s.trim());
      if (char && set) {
        const charset = this.resolveCharset(set);
        // Map both lowercase and uppercase versions
        mappings[char.toLowerCase()] = charset;
        mappings[char.toUpperCase()] = charset;
        // Preserve original case if mixed (e.g., 'Ä')
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

  getCharsForChar(char) {
    // Check in order: exact match -> lowercase -> uppercase -> global -> default
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

  randomChar(charset) {
    return charset[Math.floor(Math.random() * charset.length)];
  }
}

// Initialize with proper variable support
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all scramblers
  document.querySelectorAll('[data-scramble]').forEach(el => {
    const scrambler = new TextScrambler(el);
    
    // Store instance on element for tab access
    el.scrambler = scrambler;
  });
  
  // Initialize active tab
  const activeTab = document.querySelector('.tablinks.active[data-scramble]');
  if (activeTab && activeTab.scrambler) {
    activeTab.scrambler.setText(activeTab.scrambler.originalText);
  }
});
