// Tab system controller with scramble support
function openTab(evt, tabName) {
    // Hide all tab content
    const tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Deactivate all tabs and reset their scramblers
    const tablinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
        if (tablinks[i].scrambler) {
            tablinks[i].scrambler.setText(tablinks[i].scrambler.originalText);
        }
    }

    // Activate clicked tab
    const activeTab = evt.currentTarget;
    activeTab.classList.add("active");
    document.getElementById(tabName).style.display = "block";

    // Trigger scramble on active tab if available
    if (activeTab.scrambler) {
        activeTab.scrambler.setText(activeTab.scrambler.originalText);
    }
}

// Initialize tab scramblers on load
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tablinks[data-scramble]').forEach(tab => {
        // Create scrambler instance if not exists
        if (!tab.scrambler) {
            tab.scrambler = new TextScrambler(tab);
        }
        
        // Trigger scramble for default active tab
        if (tab.classList.contains('active')) {
            tab.scrambler.setText(tab.scrambler.originalText);
        }
    });
});
