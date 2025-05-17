document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.thesis-section');
    const tocLinks = document.querySelectorAll('#table-of-contents a');
    const introWrapper = document.getElementById('intro-content');
    const readMoreIntroBtn = document.querySelector('.read-more-intro');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const body = document.body;

    // Update copyright year
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Theme Toggler ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            themeToggleBtn.textContent = '☀️'; // Sun icon for light mode
            themeToggleBtn.setAttribute('aria-label', 'Switch to Light Theme');
        } else {
            body.classList.remove('dark-theme');
            themeToggleBtn.textContent = '🌙'; // Moon icon for dark mode
            themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Theme');
        }
    };

    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

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
            // Allow clicking anywhere on the header to toggle
            header.addEventListener('click', () => toggleSection(contentWrapper, toggleBtn));
            
            // Also allow clicking the button specifically (for accessibility)
            // toggleBtn.addEventListener('click', (e) => {
            //     e.stopPropagation(); // Prevent header click from firing twice
            //     toggleSection(contentWrapper, toggleBtn);
            // });
        }
    });
    
    function toggleSection(contentWrapper, button) {
        const isExpanded = contentWrapper.classList.toggle('expanded');
        button.setAttribute('aria-expanded', isExpanded);
        button.textContent = isExpanded ? 'Collapse' : 'Expand';
    }

    // --- "Read More" for Introduction ---
    if (readMoreIntroBtn && introWrapper) {
        // Initially, keep the intro collapsed by default in JS if not handled by CSS.
        // Our CSS handles initial brief state. This JS is for the button action.
        const introToggleBtn = document.querySelector('#introduction .toggle-section-btn');

        readMoreIntroBtn.addEventListener('click', () => {
            introWrapper.classList.add('show-elongated');
            introWrapper.classList.add('expanded'); // Also expand it
            if (introToggleBtn) {
                introToggleBtn.textContent = 'Collapse';
                introToggleBtn.setAttribute('aria-expanded', 'true');
            }
        });

        // If the main section toggle is used for intro, reset brief/elongated view
        if (introToggleBtn) {
            const introHeader = document.querySelector('#introduction .section-header');
            introHeader.addEventListener('click', () => {
                // If we are collapsing, and it was showing elongated, revert to brief
                if (!introWrapper.classList.contains('expanded') && introWrapper.classList.contains('show-elongated')) {
                     introWrapper.classList.remove('show-elongated');
                } else if (introWrapper.classList.contains('expanded') && !introWrapper.classList.contains('show-elongated')) {
                    // If expanding and it's still in brief mode (e.g., after page load), show elongated
                    introWrapper.classList.add('show-elongated');
                }
            });
        }
    }


    // --- Smooth Scrolling for Table of Contents ---
    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Ensure section is expanded before scrolling
                const contentWrapper = targetElement.querySelector('.section-content-wrapper');
                const toggleBtn = targetElement.querySelector('.toggle-section-btn');
                if (contentWrapper && !contentWrapper.classList.contains('expanded')) {
                    toggleSection(contentWrapper, toggleBtn);
                }

                // Wait a tiny bit for expansion animation to start if needed
                setTimeout(() => {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, contentWrapper && !contentWrapper.classList.contains('expanded') ? 100 : 0);
                 // Add focus for accessibility
                targetElement.focus({ preventScroll: true }); // preventScroll as we're handling it
                // Optionally, set focus to the heading inside for better screen reader announcement
                const heading = targetElement.querySelector('h2');
                if (heading) heading.setAttribute('tabindex', '-1'); // Make it focusable
                if (heading) heading.focus();
            }
        });
    });

    // --- Keyboard Navigation ---
    let currentSectionIndex = -1; // Start before the first section

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return; // Don't interfere with form inputs
        }

        const thesisSections = Array.from(document.querySelectorAll('.thesis-section'));
        if (thesisSections.length === 0) return;
        
        let newIndex = currentSectionIndex;

        if (e.key === 'n' || e.key === 'N') { // Next Section
            e.preventDefault();
            newIndex = (currentSectionIndex + 1) % thesisSections.length;
        } else if (e.key === 'p' || e.key === 'P') { // Previous Section
            e.preventDefault();
            newIndex = (currentSectionIndex - 1 + thesisSections.length) % thesisSections.length;
        } else if (e.key === 't' || e.key === 'T') { // Toggle Theme
            e.preventDefault();
            themeToggleBtn.click();
            return; // Don't scroll
        } else {
            return; // Not a navigation key
        }

        if (newIndex !== currentSectionIndex) {
            currentSectionIndex = newIndex;
            const targetSection = thesisSections[currentSectionIndex];
            
            // Ensure section is expanded
            const contentWrapper = targetSection.querySelector('.section-content-wrapper');
            const toggleBtn = targetSection.querySelector('.toggle-section-btn');
            if (contentWrapper && !contentWrapper.classList.contains('expanded')) {
                 toggleSection(contentWrapper, toggleBtn);
            }
            
            // Scroll to the section header
            const sectionHeader = targetSection.querySelector('.section-header h2');
            if (sectionHeader) {
                 setTimeout(() => { // Allow expansion to start
                    sectionHeader.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    sectionHeader.setAttribute('tabindex', '-1'); // Make focusable
                    sectionHeader.focus(); // Set focus to heading for screen readers
                }, contentWrapper && !contentWrapper.classList.contains('expanded') ? 100 : 0);
            }
        }
    });

    // Optional: Expand the first section by default (or a specific one via URL hash)
    const hash = window.location.hash;
    if (hash) {
        const targetSectionByHash = document.querySelector(hash);
        if (targetSectionByHash && targetSectionByHash.classList.contains('thesis-section')) {
            const contentWrapper = targetSectionByHash.querySelector('.section-content-wrapper');
            const toggleBtn = targetSectionByHash.querySelector('.toggle-section-btn');
            if (contentWrapper && toggleBtn) {
                toggleSection(contentWrapper, toggleBtn);
                 // If it's the intro and it was expanded by hash, also show full content
                if (targetSectionByHash.id === 'introduction' && introWrapper) {
                    introWrapper.classList.add('show-elongated');
                }
            }
        }
    } else if (sections.length > 0) {
        // Expand the first section if no hash specified
        const firstSectionContent = sections[0].querySelector('.section-content-wrapper');
        const firstSectionBtn = sections[0].querySelector('.toggle-section-btn');
        if (firstSectionContent && firstSectionBtn) {
            // For the intro, only expand if it's not in brief mode or show elongated if it is
            if (sections[0].id === 'introduction' && introWrapper) {
                // If it's the intro, and it has brief/elongated, let the "Read More" control it.
                // Or, if you want it fully expanded initially:
                // toggleSection(firstSectionContent, firstSectionBtn);
                // introWrapper.classList.add('show-elongated');
            } else {
                 // toggleSection(firstSectionContent, firstSectionBtn); // Uncomment to auto-expand first non-intro section
            }
        }
    }
});
