class TextScrambler {
  constructor(el) {
    this.el = el;
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
    this.originalText = el.textContent;
    this.originalHTML = el.innerHTML;
    this.frameRequest = null;
    
    // Configurable
    this.ignoreSpaces = this.hasCaseInsensitiveAttr('scramble-spc');
    this.charMappings = this.parseCharMappings(this.getCaseInsensitiveAttr('scramble-mappings'));
    this.globalChars = this.resolveCharset(this.getCaseInsensitiveAttr('scramble-chars'));
    this.defaultChars = '!<>-_\\/[]{}—=+*^?#________';
    this.duration = parseInt(this.getCaseInsensitiveAttr('scramble-duration')) || 600;
    this.frameRate = 16.67;
    this.totalFrames = Math.round(this.duration / this.frameRate);
    this.scrambleColor = this.getCaseInsensitiveAttr('scramble-color') || '#FFFFFF';
    this.continuous = this.hasCaseInsensitiveAttr('scramble-continuous');
    this.ignoreCase = el.hasAttribute('scramble-case'); // Global case-insensitivity flag
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

  // Case-insensitive attribute helpers
  hasCaseInsensitiveAttr(attrName) {
    return this.el.getAttributeNames().some(attr => 
      attr.toLowerCase() === attrName.toLowerCase()
    );
  }

  getCaseInsensitiveAttr(attrName) {
    const foundAttr = this.el.getAttributeNames().find(attr => 
      attr.toLowerCase() === attrName.toLowerCase()
    );
    return foundAttr ? this.el.getAttribute(foundAttr) : null;
  }

  // charset & charset variables
  resolveCharset(charset) {
    if (!charset) return null;
    if (charset.startsWith('$')) {
      const varName = charset.substring(1);
      return this.getGlobalVariable(varName) || charset;
    }
    return this.getGlobalVariable(charset) || charset;
  }

  getGlobalVariable(name) {
    try {
      // Check for variable in window (browser), globalThis (universal), and global (Node)
      if (typeof window !== 'undefined' && window[name]) return window[name];
      if (typeof globalThis !== 'undefined' && globalThis[name]) return globalThis[name];
      if (typeof global !== 'undefined' && global[name]) return global[name];
    } catch (e) {
      console.warn(`Scrambler: Error accessing variable ${name}:`, e);
      return null;
    }
    return null;
  }

  // mapping with case-insensitive support when data-case exists
  parseCharMappings(mappingString) {
    if (!mappingString) return {};
    
    // Handle variable references (e.g., "$myMap")
    if (mappingString.startsWith('$')) {
      const varName = mappingString.substring(1);
      const varValue = this.getGlobalVariable(varName);
      
      if (varValue === null) {
        console.warn(`Scrambler: Mapping variable $${varName} not found`);
        return {};
      }
      
      // If variable contains a string mapping (e.g., "a:🚗, b:🚕"), parse it
      if (typeof varValue === 'string') {
        return this.parseDirectMappings(varValue);
      }
      // If it's already a prepared mapping object, use it directly
      else if (typeof varValue === 'object' && varValue !== null) {
        return varValue;
      }
      
      return {};
    }
    
    // Handle direct mapping strings
    return this.parseDirectMappings(mappingString);
  }

  parseDirectMappings(mappingString) {
    const mappings = {};
    if (!mappingString) return mappings;
    
    // Process each key:value pair in the mapping string
    mappingString.split(',').forEach(pair => {
      const [char, set] = pair.split(':').map(s => s.trim());
      if (char && set) {
        const charset = this.resolveCharset(set);
        // Handle case insensitivity if enabled
        if (this.ignoreCase) {
          mappings[char.toLowerCase()] = charset;
          mappings[char.toUpperCase()] = charset;
        }
        // Always include exact match
        mappings[char] = charset;
      }
    });
    return mappings;
  }

  //skip space and &nbsp
  shouldSkipScramble(char) {
    return this.ignoreSpaces && (char === ' ' || char === '\u00A0');
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

  // scramble handler
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
        
        if (this.shouldSkipScramble(to)) {
          this.queue.push({ from, to, start: 0, end: 0, chars: '' });
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

  // Modified to apply case-insensitivity globally
  getCharsForChar(char) {
    // Get target character based on case sensitivity
    const targetChar = this.ignoreCase ? char.toLowerCase() : char;
    
    // Check the mapping
    if (this.charMappings[char]) {
      return this.charMappings[char];
    }
    
    // case insensitive for mapping
    if (this.ignoreCase && this.charMappings[targetChar]) {
      return this.charMappings[targetChar];
    }
    
    const charset = this.globalChars || this.defaultChars;
    
    // case insensitive for global variable/ pre set or default
    if (this.ignoreCase) {
      return charset;
    }
    
    //case sensitive
    return charset;
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
    new TextScrambler(el);
  });
});
