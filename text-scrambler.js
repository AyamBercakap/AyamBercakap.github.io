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
    this.ignoreSpaces = el.hasAttribute('scramble-spc');
    this.charMappings = this.parseCharMappings(el.getAttribute('scramble-mappings'));
    this.globalChars = this.resolveCharset(el.getAttribute('scramble-chars'));
    this.defaultChars = '!<>-_\\/[]{}—=+*^?#________';
    this.duration = parseInt(el.getAttribute('scramble-duration')) || 600;
    this.frameRate = 16.67;
    this.totalFrames = Math.round(this.duration / this.frameRate);
    this.scrambleColor = el.getAttribute('scramble-color') || '#FFFFFF';
    this.continuous = el.hasAttribute('scramble-continuous');
    this.isScrambling = false;
    
    // continuous fx
    if (this.continuous) {
      this.setText(this.originalText);
    }
    
    // hover & not continuous
    if (!this.continuous && !el.closest('.tab')) {
      el.addEventListener('mouseenter', () => this.triggerScramble());
    }
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
      if (typeof window !== 'undefined' && window[name]) return window[name];
      if (typeof globalThis !== 'undefined' && globalThis[name]) return globalThis[name];
    } catch (e) {
      return null;
    }
    return null;
  }
  // mapping aka specific characters scramble to another specific characters (can be set manually or as a variable)
  parseCharMappings(mappingString) {
    if (!mappingString) return {};
    if (mappingString.startsWith('$')) {
      const varName = mappingString.substring(1);
      const varValue = this.getGlobalVariable(varName);
      if (typeof varValue === 'string') return this.parseDirectMappings(varValue);
      if (typeof varValue === 'object') return varValue;
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
//ignore case
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

// Initialize only elements with data-scramble
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-scramble]').forEach(el => {
    new TextScrambler(el);
  });
});
