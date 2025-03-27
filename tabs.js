// Tab system controller with scramble support
function openTab(evt, tabName) {
    // Hide all tab content
    const tabcontent = document.querySelectorAll(".tabcontent");
    tabcontent.forEach(content => content.style.display = "none");

    // Deactivate all tabs
    const tablinks = document.querySelectorAll(".tablinks");
    tablinks.forEach(tab => {
        tab.classList.remove("active");
        if (tab.scrambler) {
            // Reset to original text
            tab.scrambler.continuous = false;
            tab.scrambler.el.innerHTML = tab.scrambler.originalHTML;
        }
    });

    // Activate clicked tab
    const activeTab = evt.currentTarget;
    activeTab.classList.add("active");
    document.getElementById(tabName).style.display = "block";

    // Initialize scrambler for active tab if enabled
    if (activeTab.hasAttribute('data-scramble') && activeTab.scrambler && !activeTab.scrambler.skipScramble) {
        activeTab.scrambler.setText(activeTab.scrambler.originalText);
        
        // Restore continuous scramble if specified
        if (activeTab.hasAttribute('scramble-continuous')) {
            activeTab.scrambler.continuous = true;
        }
    }
}

// Initialize only non-skipped tabs
document.addEventListener('DOMContentLoaded', () => {
    const defaultTab = document.querySelector('.tablinks.active[data-scramble]');
    if (defaultTab) {
        defaultTab.scrambler = new TextScrambler(defaultTab);
        if (!defaultTab.scrambler.skipScramble) {
            defaultTab.scrambler.setText(defaultTab.scrambler.originalText);
        }
    }
});
