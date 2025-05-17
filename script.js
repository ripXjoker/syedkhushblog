document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.thesis-section');
    const tocLinks = document.querySelectorAll('#table-of-contents a');
    const introWrapper = document.getElementById('intro-content');
    const readMoreIntroBtn = document.querySelector('.read-more-intro');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;
    const changeButterflyColorBtn = document.getElementById('change-butterfly-color-btn');

    // Update copyright year
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Theme Toggler ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme'); // Explicitly remove light
            themeToggleBtn.textContent = '☀️';
            themeToggleBtn.setAttribute('aria-label', 'Switch to Light Theme');
        } else {
            body.classList.add('light-theme'); // Explicitly add light
            body.classList.remove('dark-theme');
            themeToggleBtn.textContent = '🌙';
            themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Theme');
        }
    };

    const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const savedTheme = localStorage.getItem('theme') || preferredTheme;
    // Ensure the correct class is on the body on load based on saved/preferred
    if (savedTheme === 'dark') {
        body.classList.remove('light-theme'); // remove light if it was default in HTML
        body.classList.add('dark-theme');
    } else {
        body.classList.remove('dark-theme'); // remove dark if it was default in HTML
        body.classList.add('light-theme');
    }
    applyTheme(savedTheme); // Set button icon correctly

    themeToggleBtn.addEventListener('click', () => {
        const newTheme = body.classList.contains('dark-theme') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // --- Section Toggling (Expand/Collapse) ---
    sections.forEach(section => {
        const header = section.querySelector('.section-header');
        const toggleBtn = section.querySelector('.toggle-section-btn');
        const contentWrapper = section.querySelector('.section-content-wrapper');

        if (header && toggleBtn && contentWrapper) {
            header.addEventListener('click', () => toggleSection(contentWrapper, toggleBtn));
        }
    });
    
    function toggleSection(contentWrapper, button) {
        const isExpanded = contentWrapper.classList.toggle('expanded');
        button.setAttribute('aria-expanded', isExpanded);
        button.textContent = isExpanded ? 'Collapse' : 'Expand';

        // If it's the intro section and it's being expanded, ensure full content is shown
        if (contentWrapper.id === 'intro-content' && isExpanded && introWrapper.classList.contains('brief')) {
            introWrapper.classList.add('show-elongated');
        } else if (contentWrapper.id === 'intro-content' && !isExpanded && introWrapper.classList.contains('brief')) {
            // If collapsing intro and it was showing elongated, revert to brief (optional, button text handles it)
            // introWrapper.classList.remove('show-elongated'); // This might fight with the read-more button
        }
    }

    // --- "Read More" for Introduction ---
    if (readMoreIntroBtn && introWrapper) {
        const introToggleBtn = document.querySelector('#introduction .toggle-section-btn');

        readMoreIntroBtn.addEventListener('click', () => {
            introWrapper.classList.add('show-elongated'); // Show full text
            if (!introWrapper.classList.contains('expanded')) { // If not already expanded by main toggle
                introWrapper.classList.add('expanded');
                if (introToggleBtn) {
                    introToggleBtn.textContent = 'Collapse';
                    introToggleBtn.setAttribute('aria-expanded', 'true');
                }
            }
        });
    }

    // --- Smooth Scrolling for Table of Contents ---
    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const contentWrapper = targetElement.querySelector('.section-content-wrapper');
                const toggleBtn = targetElement.querySelector('.toggle-section-btn');
                if (contentWrapper && toggleBtn && !contentWrapper.classList.contains('expanded')) {
                    toggleSection(contentWrapper, toggleBtn);
                }
                setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    const heading = targetElement.querySelector('h2');
                    if (heading) {
                        heading.setAttribute('tabindex', '-1');
                        heading.focus({preventScroll: true});
                    }
                }, contentWrapper && toggleBtn && !contentWrapper.classList.contains('expanded') ? 100 : 0);
            }
        });
    });

    // --- Keyboard Navigation ---
    let currentSectionIndex = -1;
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const thesisSections = Array.from(document.querySelectorAll('.thesis-section'));
        if (thesisSections.length === 0) return;
        let newIndex = currentSectionIndex;
        if (e.key === 'n' || e.key === 'N') { e.preventDefault(); newIndex = (currentSectionIndex + 1) % thesisSections.length; }
        else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); newIndex = (currentSectionIndex - 1 + thesisSections.length) % thesisSections.length; }
        else if (e.key === 't' || e.key === 'T') { e.preventDefault(); themeToggleBtn.click(); return; }
        else { return; }
        if (newIndex !== currentSectionIndex) {
            currentSectionIndex = newIndex;
            const targetSection = thesisSections[currentSectionIndex];
            const contentWrapper = targetSection.querySelector('.section-content-wrapper');
            const toggleBtn = targetSection.querySelector('.toggle-section-btn');
            if (contentWrapper && toggleBtn && !contentWrapper.classList.contains('expanded')) {
                 toggleSection(contentWrapper, toggleBtn);
            }
            const sectionHeaderH2 = targetSection.querySelector('.section-header h2');
            if (sectionHeaderH2) {
                 setTimeout(() => {
                    sectionHeaderH2.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    sectionHeaderH2.setAttribute('tabindex', '-1');
                    sectionHeaderH2.focus();
                }, contentWrapper && toggleBtn && !contentWrapper.classList.contains('expanded') ? 100 : 0);
            }
        }
    });

    // --- Butterfly Color Changer ---
    function getRandomButterflyColor() {
        const letters = "0123456789ABCDEF"; let color = "#";
        for (let i = 0; i < 6; i++) { color += letters[Math.floor(Math.random() * 16)]; }
        return color;
    }
    function changeButterflyColor() {
        const color = getRandomButterflyColor();
        const mothShape = document.getElementById('shape-moth');
        if (mothShape) {
            const mainPath = mothShape.querySelector('#main');
            if (mainPath) { mainPath.style.fill = color; }
            else { console.error("Path #main not found in #shape-moth"); }
        } else { console.error("#shape-moth not found"); }
    }
    if (changeButterflyColorBtn) {
        changeButterflyColorBtn.addEventListener('click', changeButterflyColor);
    }
    setTimeout(changeButterflyColor, 150); // Initial random color for butterfly

    // Optional: Expand first section or section from hash
    const hash = window.location.hash;
    let sectionToExpandInitially = null;
    if (hash) {
        sectionToExpandInitially = document.querySelector(hash + '.thesis-section');
    }
    
    if (sectionToExpandInitially) {
        const contentWrapper = sectionToExpandInitially.querySelector('.section-content-wrapper');
        const toggleBtn = sectionToExpandInitially.querySelector('.toggle-section-btn');
        if (contentWrapper && toggleBtn) {
            toggleSection(contentWrapper, toggleBtn);
             if (sectionToExpandInitially.id === 'introduction' && introWrapper.classList.contains('brief')) {
                introWrapper.classList.add('show-elongated');
            }
        }
    } else if (sections.length > 0 && sections[0].id === 'introduction' && introWrapper.classList.contains('brief')) {
        // For intro, don't auto-expand fully, let read-more handle it, or just keep brief view.
        // If you want the brief intro to be visible (but not fully expanded):
        const firstToggleBtn = sections[0].querySelector('.toggle-section-btn');
        // toggleSection(introWrapper, firstToggleBtn); // This would expand it to brief view.
    }
});
