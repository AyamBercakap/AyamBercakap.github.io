
class TextScramble {
  constructor(element) {
    this.element = element;
    this.links = Array.from(this.element.querySelectorAll('a'));
    this.init();
  }

  init = () => {
    this.links.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        // Run the scramble animation
      });
    });
  }
}

// Init TextScramble
const scrambleElements = document.querySelectorAll('[data-text-scramble]');
scrambleElements.forEach((element) => {
  new TextScramble(element);
});
