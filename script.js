// Project data (keep as is)
const projects = [
  { id: 1, title: "Silence", year: "2021", image: "https://cdn.cosmos.so/7d47d4e2-0eff-4e2f-9734-9d24a8ba067e?format=jpeg", detailPage: "silence.html" },
  { id: 2, title: "Resonance", year: "2022", image: "https://cdn.cosmos.so/5eee2d2d-3d4d-4ae5-96d4-cdbae70a2387?format=jpeg", detailPage: "resonance.html" },
  { id: 3, title: "Essence", year: "2022", image: "https://cdn.cosmos.so/def30e8a-34b2-48b1-86e1-07ec5c28f225?format=jpeg", detailPage: "essence.html" },
  { id: 4, title: "Void", year: "2023", image: "https://cdn.cosmos.so/44d7cb23-6759-49e4-9dc1-acf771b3a0d1?format=jpeg", detailPage: "void.html" },
  { id: 5, title: "Presence", year: "2023", image: "https://cdn.cosmos.so/7712fe42-42ca-4fc5-9590-c89f2db99978?format=jpeg", detailPage: "presence.html" },
  { id: 6, title: "Flow", year: "2024", image: "https://cdn.cosmos.so/cbee1ec5-01b6-4ffe-9f34-7da7980454cf?format=jpeg", detailPage: "flow.html" },
  { id: 7, title: "Clarity", year: "2024", image: "https://cdn.cosmos.so/2e91a9d1-db85-4499-ad37-6222a6fea23b?format=jpeg", detailPage: "clarity.html" },
  { id: 8, title: "Breath", year: "2024", image: "https://cdn.cosmos.so/ff2ac3d3-fa94-4811-89f6-0d008b27e439?format=jpeg", detailPage: "breath.html" },
  { id: 9, title: "Stillness", year: "2025", image: "https://cdn.cosmos.so/c39a4043-f489-4406-8018-a103a3f89802?format=jpeg", detailPage: "stillness.html" },
  { id: 10, title: "Surrender", year: "2025", image: "https://cdn.cosmos.so/e5e399f2-4050-463b-a781-4f5a1615f28e?format=jpeg", detailPage: "surrender.html" }
];

document.addEventListener("DOMContentLoaded", function () {
  const projectsContainer = document.querySelector(".projects-container");
  const backgroundImage = document.getElementById("background-image");
  const glitchSound = document.getElementById("glitch-sound"); // Get the audio element

  renderProjects(projectsContainer, glitchSound); // Pass sound element
  initialAnimation();
  preloadImages();
  setupHoverEvents(backgroundImage, projectsContainer);
});

function renderProjects(container, soundElement) { // Accept soundElement
  projects.forEach((project) => {
    // Create an anchor tag for navigation
    const projectLink = document.createElement("a");
    projectLink.classList.add("project-item-link"); // New class for styling the link itself if needed

    // We need to pass the image URL to the detail page.
    // We'll use a query parameter. Example: silence.html?image=ENCODED_IMAGE_URL
    const detailPageUrl = `${project.detailPage}?image=${encodeURIComponent(project.image)}`;
    projectLink.href = detailPageUrl;

    // Create the div structure inside the link
    const projectItemDiv = document.createElement("div");
    projectItemDiv.classList.add("project-item");
    projectItemDiv.dataset.id = project.id;
    projectItemDiv.dataset.image = project.image; // Keep for hover effect

    projectItemDiv.innerHTML = `
      <div class="project-title">${project.title}</div>
      <div class="project-year">${project.year}</div>
    `;

    projectLink.appendChild(projectItemDiv);
    container.appendChild(projectLink);

    // Add click listener for sound
    projectLink.addEventListener('click', function(event) {
      // Play sound
      if (soundElement) {
        soundElement.currentTime = 0; // Rewind to start
        soundElement.play();
      }
      // Note: The default action (navigation) will happen after the sound plays
      // If the sound is long, or you want to delay navigation, you'd
      // event.preventDefault() and then window.location.href = this.href after a timeout.
      // But for a short glitch, this should be fine.
    });
  });
}

function initialAnimation() {
  // Target the links now for the animation
  const projectLinks = document.querySelectorAll(".project-item-link");

  projectLinks.forEach((link, index) => {
    link.style.opacity = "0";
    link.style.transform = "translateY(20px)";
    setTimeout(() => {
      link.style.transition = "opacity 0.8s ease, transform 0.8s ease";
      link.style.opacity = "1";
      link.style.transform = "translateY(0)";
    }, index * 60);
  });
}

function setupHoverEvents(backgroundImage, projectsContainer) {
  // We listen for hover on the inner .project-item div, not the link directly,
  // to maintain the existing hover logic structure.
  const projectItems = document.querySelectorAll(".project-item");
  let zoomTimeout = null;

  const preloadedImages = {};
  projects.forEach((project) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = project.image;
    preloadedImages[project.id] = img;
  });

  projectItems.forEach((item) => {
    item.addEventListener("mouseenter", function () {
      const imageUrl = this.dataset.image;
      if (zoomTimeout) clearTimeout(zoomTimeout);
      backgroundImage.style.transition = "none";
      backgroundImage.style.transform = "scale(1.2)";
      backgroundImage.src = imageUrl;
      backgroundImage.style.opacity = "1";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          backgroundImage.style.transition = "transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
          backgroundImage.style.transform = "scale(1.0)";
        });
      });
    });
  });

  projectsContainer.addEventListener("mouseleave", function () {
    backgroundImage.style.opacity = "0";
  });
}

function preloadImages() {
  projects.forEach((project) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = project.image;
  });
}
