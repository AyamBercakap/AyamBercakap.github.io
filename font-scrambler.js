document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll("[font-scramble]");

    elements.forEach(el => {
        const scrambleDuration = parseInt(el.getAttribute("scramble-duration"), 10) || 600;
        const continuous = el.hasAttribute("scramble-continuous");
        const userFonts = el.getAttribute("scramble-fonts") ? el.getAttribute("scramble-fonts").split(",").map(f => f.trim()) : [];

        // Improved font detection that checks element's own style first
        let originalFont = "";
        
        // First check if element has inline style
        if (el.style.fontFamily) {
            originalFont = el.style.fontFamily;
        } 
        // Then check computed style
        else {
            originalFont = getComputedStyle(el).fontFamily;
            
            // If it's inheriting from body, try to get the "real" computed font
            if (originalFont === "Noto Sans" || originalFont.includes("Noto Sans")) {
                // Create a temporary span to detect the "real" font
                const temp = document.createElement("span");
                temp.style.display = "none";
                temp.style.fontFamily = "inherit";
                temp.textContent = "a";
                el.appendChild(temp);
                originalFont = getComputedStyle(temp).fontFamily;
                el.removeChild(temp);
            }
        }

        // Clean up the font family string
        originalFont = originalFont.replace(/['"]+/g, '').trim().split(',')[0].trim();
        
        // Fallback to Noto Sans if detection failed
        if (!originalFont) originalFont = "Noto Sans";

        // Store the original font
        if (!el.hasAttribute("font-scramble-original")) {
            el.setAttribute("font-scramble-original", originalFont);
        } else {
            originalFont = el.getAttribute("font-scramble-original");
        }

        const hasSingleFont = userFonts.length === 1;
        let fontScramble = userFonts.length > 0 ? [...userFonts, originalFont] : [originalFont];

        function getRandomFontPair(index) {
            if (hasSingleFont) {
                return Math.random() > 0.5 ? originalFont : userFonts[0];
            }
            return fontScramble[Math.floor(Math.random() * fontScramble.length)];
        }

        function scrambleFonts() {
            let text = el.textContent.trim();
            let scrambledHTML = "";

            for (let i = 0; i < text.length; i++) {
                scrambledHTML += `<span style="font-family: '${getRandomFontPair(i)}';">${text[i]}</span>`;
            }

            el.innerHTML = scrambledHTML;
        }

        function restoreOriginalFont() {
            let text = el.textContent.trim();
            let restoredHTML = "";

            for (let i = 0; i < text.length; i++) {
                restoredHTML += `<span style="font-family: '${originalFont}';">${text[i]}</span>`;
            }

            el.innerHTML = restoredHTML;
        }

        function startScrambling() {
            const startTime = performance.now();
            const scrambleInterval = setInterval(() => {
                scrambleFonts();
                if (performance.now() - startTime >= scrambleDuration) {
                    clearInterval(scrambleInterval);
                    if (continuous) {
                        setTimeout(startScrambling, 100);
                    } else {
                        restoreOriginalFont();
                    }
                }
            }, 16.67);
        }

        el.addEventListener("mouseenter", startScrambling);
    });
});