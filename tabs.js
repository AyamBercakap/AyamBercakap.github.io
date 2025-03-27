// Tab system controller with scramble awareness
function openTab(evt, tabName) {
  const tabcontent = document.querySelectorAll(".tabcontent");
  const tablinks = document.querySelectorAll(".tablinks");

  // Deactivate all tabs
  tablinks.forEach(tab => {
    tab.classList.remove("active");
    if (tab.scrambler) {
      tab.scrambler.continuous = false;
      tab.scrambler.el.innerHTML = tab.scrambler.originalHTML;
    }
  });

  // Activate clicked tab if scrambler enabled
  const activeTab = evt.currentTarget;
  activeTab.classList.add("active");
  document.getElementById(tabName).style.display = "block";

  if (activeTab.scrambler && !activeTab.scrambler.skipScramble) {
    activeTab.scrambler.setText(activeTab.scrambler.originalText);
  }
}

// Initialize only non-skipped tabs
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tablinks[data-scramble]').forEach(tab => {
    tab.scrambler = new TextScrambler(tab);
    if (tab.classList.contains('active') && !tab.scrambler.skipScramble) {
      tab.scrambler.setText(tab.scrambler.originalText);
    }
  });
});
