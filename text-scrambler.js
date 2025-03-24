class TextScramble {
  constructor(element) {
    this.element = element;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
    this.originalText = element.innerText;
  }

  setText(newText) {
    const oldText = this.element.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    
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
    return promise;
  }

  update() {
    let output = '';
    let complete = 0;
    
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="scramble">${char}</span>`;
      } else {
        output += from;
      }
    }
     scrambleOnActive() {
    if (this.isActiveTab) {
      // Continuous subtle scramble effect for active tab
      this.setText(this.originalText).then(() => {
        if (this.element.classList.contains('active')) {
          setTimeout(() => this.scrambleOnActive(), 1000);
        }
      });
    }
  }
}

  // For tab buttons
  const tabButtons = document.querySelectorAll('.tab button');
  tabButtons.forEach(button => {
    const scrambler = new TextScramble(button);
    
    button.addEventListener('mouseenter', () => {
      scrambler.setText(scrambler.originalText);
    });
    
    // Check if button is active on load
    if (button.classList.contains('active')) {
      scrambler.scrambleOnActive();
    }
  });
  const links = document.querySelectorAll('a.container');
  links.forEach(link => {
    const scrambler = new TextScramble(link);
    
    link.addEventListener('mouseenter', () => {
      scrambler.setText(scrambler.originalText);
    });
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      scrambler.setText(scrambler.originalText).then(() => {
        window.location.href = link.href;
      });
    });
  });

  // Watch for tab changes to apply active scramble
  document.querySelector('.tab').addEventListener('click', (e) => {
    if (e.target.classList.contains('tablinks')) {
      const activeScrambler = new TextScramble(e.target);
      activeScrambler.scrambleOnActive();
    }
  });
});

    this.element.innerHTML = output;
    
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// Initialize scrambler on both tab buttons and container links
document.addEventListener('DOMContentLoaded', () => {
  // For tab buttons
  const tabButtons = document.querySelectorAll('.tab button');
  tabButtons.forEach(button => {
    const scrambler = new TextScramble(button);
    
    button.addEventListener('mouseenter', () => {
      scrambler.setText(scrambler.originalText);
    });
  });

  // For container links
  const links = document.querySelectorAll('a.container');
  links.forEach(link => {
    const scrambler = new TextScramble(link);
    
    link.addEventListener('mouseenter', () => {
      scrambler.setText(scrambler.originalText);
    });
    
    // Optional: Add click effect too
    link.addEventListener('click', (e) => {
      e.preventDefault();
      scrambler.setText(scrambler.originalText).then(() => {
        window.location.href = link.href;
      });
    });
  });
});
