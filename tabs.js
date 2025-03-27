// Tab system controller with active-only scrambling
function openTab(evt, tabName) {
    // Hide all tab content
    const tabcontent = document.querySelectorAll(".tabcontent");
    tabcontent.forEach(content => content.style.display = "none");

    // Deactivate all tabs and STOP their scramblers
    const tablinks = document.querySelectorAll(".tablinks");
    tablinks.forEach(tab => {
        tab.classList.remove("active");
        if (tab.scrambler) {
            // Reset to original text and stop animations
            tab.scrambler.continuous = false;
            tab.scrambler.el.innerHTML = tab.scrambler.originalHTML;
        }
    });

    // Activate clicked tab
    const activeTab = evt.currentTarget;
    activeTab.classList.add("active");
    document.getElementById(tabName).style.display = "block";

    // Initialize/restart scrambler ONLY for active tab
    if (activeTab.hasAttribute('data-scramble')) {
        if (!activeTab.scrambler) {
            activeTab.scrambler = new TextScrambler(activeTab);
        }
        activeTab.scrambler.setText(activeTab.scrambler.originalText);
        
        // Restore continuous scramble if specified
        if (activeTab.hasAttribute('scramble-continuous')) {
            activeTab.scrambler.continuous = true;
        }
    }
}

// Initialize only default active tab
document.addEventListener('DOMContentLoaded', () => {
    const defaultTab = document.querySelector('.tablinks.active[data-scramble]');
    if (defaultTab) {
        defaultTab.scrambler = new TextScrambler(defaultTab);
        defaultTab.scrambler.setText(defaultTab.scrambler.originalText);
    }
});
