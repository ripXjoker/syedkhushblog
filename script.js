document.addEventListener('DOMContentLoaded', () => {
    // ... (all your existing JS code from the previous answer) ...

    const changeButterflyColorBtn = document.getElementById('change-butterfly-color-btn');

    // --- Butterfly Color Changer ---
    function getRandomButterflyColor() {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function changeButterflyColor() {
        const color = getRandomButterflyColor();
        const mothShape = document.getElementById('shape-moth'); // The <g> element
        if (mothShape) {
            const mainPath = mothShape.querySelector('#main'); // The <path> inside the <g>
            if (mainPath) {
                mainPath.style.fill = color;
            } else {
                console.error("Element with ID 'main' not found inside 'shape-moth'");
            }
        } else {
            console.error("Element with ID 'shape-moth' not found");
        }
    }

    if (changeButterflyColorBtn) {
        changeButterflyColorBtn.addEventListener('click', changeButterflyColor);
    }

    // Optional: Trigger one color change on load so it's not always the default blue
    // setTimeout(changeButterflyColor, 100); // slight delay
});
