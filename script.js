document.addEventListener('DOMContentLoaded', () => {
    const allDetails = document.querySelectorAll('.accordion-container details');

    allDetails.forEach(detailsEl => {
        // The 'toggle' event fires on the <details> element when its 'open' state changes
        detailsEl.addEventListener('toggle', event => {
            // If the details element was opened (its 'open' attribute is now true)
            if (detailsEl.open) {
                // Close all other details elements
                allDetails.forEach(otherDetailsEl => {
                    if (otherDetailsEl !== detailsEl && otherDetailsEl.open) {
                        // We remove the 'open' attribute to close it.
                        // We also have to manually click its summary if we want its
                        // 'before' pseudo-element (the +/- sign) to update correctly
                        // IF we weren't using the [open] attribute in CSS for the sign.
                        // But since our CSS handles the +/- based on the [open] attribute,
                        // simply removing the attribute is enough.
                        otherDetailsEl.removeAttribute('open');
                    }
                });
            }
        });
    });

    // Set current year in footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});
