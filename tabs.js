// Tab system controller with active-only scrambling
function openTab(evt, tabName) {
    // Hide all tab content
    const tabcontent = document.querySelectorAll(".tabcontent");
    tabcontent.forEach(content => {
        content.style.display = "none";
    });

    // Deactivate all tabs and stop their scramblers
    const tablinks = document.querySelectorAll(".tablinks");
    tablinks.forEach(tab => {
        tab.classList.remove("active");
        if (tab.scrambler && tab.scrambler.continuous) {
            tab.scrambler.continuous = false; // Pause continuous scramble
        }
    });

    // Activate clicked tab
    const activeTab = evt.currentTarget;
    activeTab.classList.add("active");
    document.getElementById(tabName).style.display = "block";

    // Initialize or restart scrambler ONLY for active tab
    if (activeTab.hasAttribute('data-scramble')) {
        if (!activeTab.scrambler) {
            activeTab.scrambler = new TextScrambler(activeTab);
        }
        activeTab.scrambler.setText(activeTab.scrambler.originalText);
        
        // Enable continuous scramble if specified
        if (activeTab.hasAttribute('scramble-continuous')) {
            activeTab.scrambler.continuous = true;
        }
    }
}

// Initialize tab system
document.addEventListener('DOMContentLoaded', () => {
    // Set default active tab
    const defaultTab = document.querySelector('.tablinks.active');
    if (defaultTab && defaultTab.hasAttribute('data-scramble')) {
        defaultTab.scrambler = new TextScrambler(defaultTab);
        defaultTab.scrambler.setText(defaultTab.scrambler.originalText);
    }
});
