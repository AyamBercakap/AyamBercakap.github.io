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
            tab.scrambler.continuous = false;
            tab.scrambler.el.innerHTML = tab.scrambler.originalHTML;
        }
    });

    // Activate clicked tab
    const activeTab = evt.currentTarget;
    activeTab.classList.add("active");
    document.getElementById(tabName).style.display = "block";

    // Initialize scrambler for active tab
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const defaultTab = document.querySelector('.tablinks.active[data-scramble]');
    if (defaultTab) {
        defaultTab.scrambler = new TextScrambler(defaultTab);
        defaultTab.scrambler.setText(defaultTab.scrambler.originalText);
    }

    // Make tabs keyboard accessible
    const tabs = document.querySelectorAll('.tablinks');
    tabs.forEach(tab => {
        tab.setAttribute('tabindex', '0');
        
        // Handle keyboard activation (Enter/Space)
        tab.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const tabName = e.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1];
                openTab(e, tabName);
            }
        });
    });
});

// Keyboard navigation between tabs
document.addEventListener('keydown', function(event) {
    // Only handle navigation when a tab has focus
    if (!event.target.classList.contains('tablinks')) return;
    
    const tabs = document.querySelectorAll('.tablinks');
    if (!tabs.length) return;
    
    // Find currently active tab index
    let activeIndex = -1;
    tabs.forEach((tab, index) => {
        if (tab.classList.contains('active')) {
            activeIndex = index;
        }
    });
    
    if (activeIndex === -1) return;
    
    // Handle navigation keys
    switch(event.key) {
        case 'ArrowLeft':
            // Move to previous tab (with wrap-around)
            event.preventDefault();
            const prevIndex = (activeIndex - 1 + tabs.length) % tabs.length;
            tabs[prevIndex].click();
            tabs[prevIndex].focus();
            break;
            
        case 'ArrowRight':
            // Move to next tab (with wrap-around)
            event.preventDefault();
            const nextIndex = (activeIndex + 1) % tabs.length;
            tabs[nextIndex].click();
            tabs[nextIndex].focus();
            break;
            
        case 'Home':
            // Jump to first tab
            event.preventDefault();
            tabs[0].click();
            tabs[0].focus();
            break;
            
        case 'End':
            // Jump to last tab
            event.preventDefault();
            tabs[tabs.length - 1].click();
            tabs[tabs.length - 1].focus();
            break;
    }
});