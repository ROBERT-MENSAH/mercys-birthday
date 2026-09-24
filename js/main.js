/**
 * MERCY — A STORY WORTH CELEBRATING
 * Core Interactive Controller & Audio Synthesizer Engine
 * Performance-optimized, Accessible, Zero External Dependencies
 */

(function () {
  "use strict";

  // --- DOM Elements ---
  const prologue = document.getElementById("prologue");
  const storyMain = document.getElementById("story-main");
  const beginJourneyBtn = document.querySelector("[data-begin-journey]");
  const galleryGrid = document.querySelector("[data-gallery-grid]");
  const filterButtons = document.querySelectorAll("[data-filter]");

  // Modal elements
  const mediaModal = document.getElementById("media-modal");
  const modalContainer = document.getElementById("modal-container");
  const modalCaption = document.getElementById("modal-caption");
  const modalCloseBtn = document.querySelector("[data-modal-close]");

  // Secret blessing elements
  const secretSealBtn = document.querySelector("[data-secret-seal]");
  const blessingModal = document.getElementById("blessing-modal");
  const blessingCloseBtn = document.querySelector("[data-blessing-close]");

  // Audio elements
  const audioController = document.querySelector(".audio-controller");
  const audioToggleBtn = document.querySelector("[data-audio-toggle]");
  const audioLabel = document.querySelector("[data-audio-label]");

  // Confetti canvas
  const confettiCanvas = document.getElementById("confetti-canvas");

  // Reduced motion preference
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==========================================================================
     WEB AUDIO API AMBIENT SOUND GENERATOR (Cinematic Gentle Piano Chords)
     ========================================================================== */
  class AmbientSoundtrack {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.intervalId = null;
      this.chords = [
        [174.61, 220.0, 261.63, 349.23], // Fmaj7
        [146.83, 220.0, 261.63, 329.63], // Dm9
        [196.0, 246.94, 293.66, 392.0],  // G7
        [130.81, 196.0, 246.94, 329.63]  // Cmaj7
      ];
      this.chordIndex = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }

    playTone(freq, time, duration = 3.5) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.exponentialRampToValueAtTime(0.045, time + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + duration);
    }

    playChord() {
      if (!this.ctx || !this.isPlaying) return;
      const now = this.ctx.currentTime;
      const chord = this.chords[this.chordIndex];
      chord.forEach((freq, idx) => {
        this.playTone(freq, now + idx * 0.12, 4.2);
      });
      this.chordIndex = (this.chordIndex + 1) % this.chords.length;
    }

    toggle() {
      this.init();
      if (!this.ctx) return false;

      this.isPlaying = !this.isPlaying;
      if (this.isPlaying) {
        this.playChord();
        this.intervalId = setInterval(() => this.playChord(), 4200);
      } else {
        clearInterval(this.intervalId);
      }
      return this.isPlaying;
    }
  }

  const soundtrack = new AmbientSoundtrack();

  function updateAudioUI(isPlaying) {
    if (isPlaying) {
      audioController.classList.add("is-playing");
      audioLabel.textContent = "Music Playing";
    } else {
      audioController.classList.remove("is-playing");
      audioLabel.textContent = "Play Music";
    }
  }

  audioToggleBtn.addEventListener("click", () => {
    const isPlaying = soundtrack.toggle();
    updateAudioUI(isPlaying);
  });


  /* ==========================================================================
     PROLOGUE UNLOCK & STORY NAVIGATION
     ========================================================================== */
  beginJourneyBtn.addEventListener("click", () => {
    // Optionally initiate gentle ambient sound upon user gesture
    if (!soundtrack.isPlaying) {
      const playing = soundtrack.toggle();
      updateAudioUI(playing);
    }

    prologue.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out";
    prologue.style.opacity = "0";
    prologue.style.transform = "scale(0.98)";

    setTimeout(() => {
      prologue.hidden = true;
      storyMain.hidden = false;
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    }, 750);
  });

  /* ==========================================================================
     SHARED MODAL VIEWER (PHOTOS & VIDEOS)
     Guarantees only ONE video plays at any time to preserve memory & bandwidth
     ========================================================================== */
  function openMediaModal(src, captionText, isVideo = false) {
    modalContainer.innerHTML = "";

    if (isVideo) {
      const video = document.createElement("video");
      video.src = src;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      modalContainer.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = src;
      img.alt = captionText || "Mercy's story photo";
      modalContainer.appendChild(img);
    }

    modalCaption.textContent = captionText || "";
    document.body.classList.add("modal-open");
    mediaModal.showModal();
  }

  function closeMediaModal() {
    if (mediaModal.open) {
      const activeVideo = modalContainer.querySelector("video");
      if (activeVideo) {
        activeVideo.pause();
        activeVideo.src = "";
      }
      modalContainer.innerHTML = "";
      mediaModal.close();
      document.body.classList.remove("modal-open");
    }
  }

  modalCloseBtn.addEventListener("click", closeMediaModal);

  mediaModal.addEventListener("click", (e) => {
    if (e.target === mediaModal) {
      closeMediaModal();
    }
  });

  mediaModal.addEventListener("cancel", closeMediaModal);

  // Delegated video trigger buttons throughout chapters
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-video-trigger]");
    if (trigger) {
      const videoSrc = trigger.getAttribute("data-video-trigger");
      const caption = trigger.getAttribute("data-caption");
      openMediaModal(videoSrc, caption, true);
    }
  });

  /* ==========================================================================
     CHAPTER 09: MEMORY VAULT RENDERING & FILTERING
     ========================================================================== */
  function renderGallery(filter = "all") {
    if (!galleryGrid || !window.MERCY_STORY || !window.MERCY_STORY.gallery) return;

    galleryGrid.innerHTML = "";
    const items = window.MERCY_STORY.gallery;

    const filtered = filter === "all"
      ? items
      : items.filter(item => item.category === filter);

    filtered.forEach(item => {
      const thumb = document.createElement("div");
      thumb.className = "memory-thumb";
      thumb.setAttribute("role", "button");
      thumb.setAttribute("tabindex", "0");
      thumb.setAttribute("aria-label", `View ${item.title}`);

      if (item.type === "video") {
        thumb.innerHTML = `
          <video preload="metadata" muted playsinline>
            <source src="${item.src}" type="video/mp4">
          </video>
          <div class="memory-thumb__caption">
            <span>▶ ${item.title}</span>
          </div>
        `;
      } else {
        thumb.innerHTML = `
          <img src="${item.src}" alt="${item.alt}" loading="lazy">
          <div class="memory-thumb__caption">
            <span>${item.title}</span>
          </div>
        `;
      }

      const openItem = () => {
        openMediaModal(item.src, item.caption || item.title, item.type === "video");
      };

      thumb.addEventListener("click", openItem);
      thumb.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openItem();
        }
      });

      galleryGrid.appendChild(thumb);
    });
  }

  // Filter tabs handling
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const category = btn.getAttribute("data-filter");
      renderGallery(category);
    });
  });

  /* ==========================================================================
     SECRET SEAL BLESSING MODAL
     ========================================================================== */
  if (secretSealBtn) {
    secretSealBtn.addEventListener("click", () => {
      blessingModal.showModal();
      document.body.classList.add("modal-open");
      startConfetti();
    });
  }

  if (blessingCloseBtn) {
    blessingCloseBtn.addEventListener("click", () => {
      blessingModal.close();
      document.body.classList.remove("modal-open");
    });
  }

  blessingModal.addEventListener("click", (e) => {
    if (e.target === blessingModal) {
      blessingModal.close();
      document.body.classList.remove("modal-open");
    }
  });

  /* ==========================================================================
     CANVAS CONFETTI CELEBRATION ENGINE
     High-performance requestAnimationFrame loop with physics & gravity
     ========================================================================== */
  let confettiAnimationId = null;

  function startConfetti() {
    if (prefersReducedMotion || !confettiCanvas) return;

    const ctx = confettiCanvas.getContext("2d");
    confettiCanvas.width = confettiCanvas.offsetWidth;
    confettiCanvas.height = confettiCanvas.offsetHeight;

    const colors = ["#D47A90", "#1E3A5F", "#5B8BAE", "#FDF1F4", "#E8A3B3", "#FFFFFF"];
    const particles = [];
    const count = 90;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 3 - 1.5,
        speedY: Math.random() * 4 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 6 - 3,
        opacity: 1
      });
    }

    let frames = 0;

    function renderConfetti() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      frames++;

      particles.forEach(p => {
        p.y += p.speedY;
        p.x += Math.sin(frames * 0.04) * 1.5 + p.speedX;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
        ctx.restore();
      });

      if (frames < 280) {
        confettiAnimationId = requestAnimationFrame(renderConfetti);
      } else {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      }
    }

    if (confettiAnimationId) cancelAnimationFrame(confettiAnimationId);
    renderConfetti();
  }

  // Trigger celebration on scroll into view of the birthday chapter
  const celebrationSection = document.getElementById("chapter-celebration");
  if (celebrationSection && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          startConfetti();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });

    observer.observe(celebrationSection);
  }

  // Initial gallery render
  renderGallery("all");

})();