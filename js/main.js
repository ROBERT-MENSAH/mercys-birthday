const opening = document.querySelector(".opening");
const storyShell = document.querySelector(".story-shell");
const beginJourneyButton = document.querySelector("[data-begin-journey]");
const siteHeader = document.querySelector("[data-site-header]");
const mediaDialog = document.querySelector("[data-media-dialog]");
const dialogContent = document.querySelector("[data-dialog-content]");
const dialogCaption = document.querySelector("[data-dialog-caption]");
const confettiLayer = document.querySelector("[data-confetti-layer]");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function createImageCard(item) {
  const figure = document.createElement("figure");
  figure.className = "person-card";
  figure.innerHTML = `<img src="${item.src}" alt="${item.alt}" loading="lazy"><figcaption>${item.label}</figcaption>`;
  return figure;
}

function createMediaCard(item) {
  const card = document.createElement("article");
  card.className = "media-card";

  if (item.type === "video") {
    card.innerHTML = `<video preload="metadata" muted playsinline><source src="${item.src}" type="video/mp4"></video><button type="button" aria-label="Open ${item.label}"><span class="media-card__label">${item.label}</span></button>`;
  } else {
    card.innerHTML = `<img src="${item.src}" alt="${item.alt}" loading="lazy"><button type="button" aria-label="Open ${item.label}"><span class="media-card__label">${item.label}</span></button>`;
  }

  card.querySelector("button").addEventListener("click", () => openMedia(item));
  return card;
}

function renderContent() {
  const schoolGallery = document.querySelector("[data-school-gallery]");
  const familyGrid = document.querySelector("[data-family-grid]");
  const peopleGrid = document.querySelector("[data-people-grid]");
  const musicGrid = document.querySelector("[data-music-grid]");
  const memoryGrid = document.querySelector("[data-memory-grid]");

  MERCY_STORY_DATA.school.forEach((item) => schoolGallery.append(createMediaCard(item)));
  MERCY_STORY_DATA.family.forEach((item) => familyGrid.append(createImageCard(item)));
  MERCY_STORY_DATA.people.forEach((item) => peopleGrid.append(createImageCard(item)));
  MERCY_STORY_DATA.music.forEach((item) => {
    const video = document.createElement("video");
    video.controls = true;
    video.preload = "metadata";
    video.setAttribute("playsinline", "");
    video.innerHTML = `<source src="${item.src}" type="video/mp4">Your browser does not support embedded video.`;
    video.setAttribute("aria-label", item.label);
    musicGrid.append(video);
  });
  MERCY_STORY_DATA.gallery.forEach((item) => memoryGrid.append(createMediaCard(item)));
}

function showStory() {
  opening.hidden = true;
  storyShell.hidden = false;
  siteHeader.hidden = false;
  document.body.classList.add("story-active");
  document.querySelector("#story").scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
}

function openMedia(item) {
  dialogContent.replaceChildren();
  const media = document.createElement(item.type === "video" ? "video" : "img");
  media.src = item.src;
  media.alt = item.alt || item.label;
  if (item.type === "video") {
    media.controls = true;
    media.autoplay = true;
    media.setAttribute("playsinline", "");
  }
  dialogContent.append(media);
  dialogCaption.textContent = item.label;
  mediaDialog.showModal();
  document.body.classList.add("dialog-open");
}

function closeMedia() {
  if (!mediaDialog.open) return;
  mediaDialog.close();
  dialogContent.replaceChildren();
  document.body.classList.remove("dialog-open");
}

function celebrate() {
  if (prefersReducedMotion) return;
  const colors = ["#c9798e", "#729bbd", "#ffffff", "#17263a"];
  for (let index = 0; index < 38; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[index % colors.length];
    piece.style.setProperty("--drift", `${(Math.random() - 0.5) * 18}rem`);
    piece.style.animationDelay = `${Math.random() * 0.45}s`;
    confettiLayer.append(piece);
    piece.addEventListener("animationend", () => piece.remove(), { once: true });
  }
}

renderContent();
beginJourneyButton.addEventListener("click", showStory);
document.querySelector("[data-celebrate]").addEventListener("click", celebrate);
document.querySelector("[data-secret]").addEventListener("click", () => {
  document.querySelector("[data-secret-message]").hidden = false;
});
document.querySelector("[data-close-dialog]").addEventListener("click", closeMedia);
mediaDialog.addEventListener("click", (event) => {
  if (event.target === mediaDialog) closeMedia();
});
mediaDialog.addEventListener("cancel", closeMedia);