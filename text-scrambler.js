class TextScrambler {
  constructor(el) {
    this.el = el;
    this.frame = 0;
    this.queue = [];
    this.resolve = null;
    this.originalHTML = el.innerHTML;
    this.originalText = this.getTextContent(el.innerHTML);
    this.frameRequest = null;
    
    // Configurable with case-insensitive attribute support
    this.scrambleSpaces = this.getCaseInsensitiveAttr('scramble-spc') === 'true'; // Scramble spaces when true
    this.charMappings = this.parseCharMappings(this.getCaseInsensitiveAttr('scramble-mappings'));
    this.globalChars = this.resolveCharset(this.getCaseInsensitiveAttr('scramble-chars'));
    this.defaultChars = '!<>-_\\/[]{}—=+*^?#________';
    this.duration = parseInt(this.getCaseInsensitiveAttr('scramble-duration')) || 600;
    this.frameRate = 16.67;
    this.totalFrames = Math.round(this.duration / this.frameRate);
    this.scrambleColor = this.getCaseInsensitiveAttr('scramble-color') || '#FFFFFF';
    this.continuous = this.hasCaseInsensitiveAttr('scramble-continuous');
    this.ignoreCase = this.getCaseInsensitiveAttr('scramble-case') === 'true';
    this.isScrambling = false;
    
    // Initialize immediately for continuous effect
    if (this.continuous) {
      this.setText(this.originalText);
    }
    
    // Set up hover effects (preserving original tab functionality)
    if (!this.continuous && !el.closest('.tab')) {
      el.addEventListener('mouseenter', () => this.triggerScramble());
    }
  }

  // Extract text content while preserving HTML structure
  getTextContent(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').replace(/\u00A0/g, ' ');
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
      if (typeof window !== 'undefined' && window[name]) return window[name];
      if (typeof globalThis !== 'undefined' && globalThis[name]) return globalThis[name];
    } catch (e) {
      return null;
    }
    return null;
  }

  // mapping with case-insensitive support when scramble-case="true"
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
    if (!mappingString) return mappings;
    
    mappingString.split(',').forEach(pair => {
      const [char, set] = pair.split(':').map(s => s.trim());
      if (char && set) {
        const charset = this.resolveCharset(set);
        if (this.ignoreCase) {
          mappings[char.toLowerCase()] = charset;
          mappings[char.toUpperCase()] = charset;
        }
        mappings[char] = charset;
      }
    });
    return mappings;
  }

  //skip space and &nbsp; unless scramble-spc="true"
  shouldSkipScramble(char) {
    return (char === ' ' || char === '\u00A0' || char === '\n') && !this.scrambleSpaces;
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
    const oldText = this.getTextContent(this.el.innerHTML);
    
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

  // Modified to apply case-insensitivity when scramble-case="true"
  getCharsForChar(char) {
    const targetChar = this.ignoreCase ? char.toLowerCase() : char;
    
    if (this.charMappings[char]) {
      return this.charMappings[char];
    }
    
    if (this.ignoreCase && this.charMappings[targetChar]) {
      return this.charMappings[targetChar];
    }
    
    const charset = this.globalChars || this.defaultChars;
    
    if (this.ignoreCase) {
      return charset;
    }
    
    return charset;
  }

  // Update text while preserving HTML structure
  update() {
    const temp = document.createElement('div');
    temp.innerHTML = this.originalHTML;
    const textNodes = [];
    const walker = document.createTreeWalker(temp, NodeFilter.SHOW_TEXT, null, false);
    let node;
    
    while (node = walker.nextNode()) {
      if (node.nodeValue.trim().length > 0) {
        textNodes.push(node);
      }
    }

    let textOffset = 0;
    let complete = 0;

    textNodes.forEach(textNode => {
      let newContent = '';
      const length = textNode.nodeValue.length;
      
      for (let i = 0; i < length; i++) {
        const qIndex = textOffset + i;
        if (qIndex >= this.queue.length) continue;
        
        const { from, to, start, end, chars } = this.queue[qIndex];
        let char = this.queue[qIndex].char;

        if (this.frame >= end) {
          complete++;
          newContent += to;
        } else if (this.frame >= start && chars) {
          if (!char || Math.random() < 0.28) {
            char = this.randomChar(chars);
            this.queue[qIndex].char = char;
          }
          newContent += `<span class="scramble-char" style="color:${this.scrambleColor}">${char}</span>`;
        } else {
          newContent += from;
        }
      }
      
      textOffset += length;
      const wrapper = document.createElement('span');
      wrapper.innerHTML = newContent;
      textNode.parentNode.replaceChild(wrapper, textNode);
    });

    this.el.innerHTML = temp.innerHTML;

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

document.addEventListener("DOMContentLoaded", () => {
    const fonts = [
        'Roboto', 'Pacifico', 'Press Start 2P', 'Courier Prime', 'Indie Flower'
    ];
    const textElement = document.getElementById('scramble-text');

    function scrambleFont() {
        const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
        textElement.style.fontFamily = randomFont;
    }

    setInterval(scrambleFont, 200);
});

