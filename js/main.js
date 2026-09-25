/**
 * MERCY — A STORY WORTH CELEBRATING
 * Accessible, dependency-free story controller.
 */
(function () {
  "use strict";

  const story = window.MERCY_STORY || null;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const prologue = document.getElementById("prologue");
  const storyMain = document.getElementById("story-main");
  const beginBtn = document.querySelector("[data-begin-journey]");
  const beginLabel = document.querySelector("[data-begin-label]");
  const transition = document.getElementById("chapter-transition");
  const transitionNum = transition ? transition.querySelector("[data-transition-num]") : null;
  const transitionTitle = transition ? transition.querySelector("[data-transition-title]") : null;
  const chapterIndicator = document.getElementById("chapter-indicator");
  const indicatorNum = chapterIndicator ? chapterIndicator.querySelector("[data-indicator-num]") : null;
  const indicatorName = chapterIndicator ? chapterIndicator.querySelector("[data-indicator-name]") : null;
  const journeyRail = document.getElementById("journey-rail");
  const railDots = journeyRail ? Array.prototype.slice.call(journeyRail.querySelectorAll(".journey-rail__dot")) : [];
  const mobileChapterNav = document.querySelector("[data-mobile-chapter-nav]");
  const mobileNavLinks = Array.prototype.slice.call(document.querySelectorAll("[data-mobile-nav]"));
  const chapterSections = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));
  const rootsSection = document.getElementById("chapter-roots");
  const galleryGrid = document.querySelector("[data-gallery-grid]");
  const galleryStatus = document.querySelector("[data-gallery-status]");
  const filterButtons = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));

  const mediaModal = document.getElementById("media-modal");
  const modalContainer = document.getElementById("modal-container");
  const modalCaption = document.getElementById("modal-caption");
  const modalCount = document.querySelector("[data-modal-count]");
  const modalCloseBtn = document.querySelector("[data-modal-close]");
  const modalPrevBtn = document.querySelector("[data-modal-prev]");
  const modalNextBtn = document.querySelector("[data-modal-next]");
  const fullscreenBtn = document.querySelector("[data-media-fullscreen]");
  const secretSealBtn = document.querySelector("[data-secret-seal]");
  const blessingModal = document.getElementById("blessing-modal");
  const blessingCloseBtn = document.querySelector("[data-blessing-close]");
  const confettiCanvas = document.getElementById("confetti-canvas");
  const celebrateBtn = document.querySelector("[data-celebrate]");
  const letterCard = document.querySelector("[data-letter-card]");
  const studioVideo = document.querySelector("[data-studio-video]");
  const birthdaySongVideo = document.querySelector("[data-birthday-song-video]");
  const musicPlayBtn = document.querySelector("[data-music-play]");
  const musicLabel = document.querySelector("[data-music-label]");
  const musicStatus = document.querySelector("[data-music-status]");
  const waveformHost = document.querySelector("[data-waveform]");
  const installBtn = document.querySelector("[data-install-app]");
  const installHelp = document.querySelector("[data-install-help]");
  const appToast = document.querySelector("[data-app-toast]");
  const backToTopBtn = document.querySelector("[data-back-to-top]");
  const readingProgress = document.getElementById("reading-progress");
  const readingProgressBar = document.getElementById("reading-progress-bar");
  let toastTimer = null;
  let deferredInstallPrompt = null;

  function showToast(message, duration) {
    if (!appToast) return;
    appToast.textContent = message;
    appToast.hidden = false;
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { appToast.hidden = true; }, duration || 3600);
  }

  function showInstallHelp(message) {
    if (installHelp) {
      installHelp.textContent = message;
      installHelp.hidden = false;
    }
    showToast(message, 5200);
  }

  function shareStory() {
    const shareData = { title: "Mercy — A Story Worth Celebrating", text: "A birthday story for Mercy", url: window.location.href };
    if (window.navigator.share) {
      window.navigator.share(shareData).catch(function (error) {
        if (!error || error.name !== "AbortError") showToast("Sharing was cancelled. You can copy the page address instead.");
      });
    } else if (window.navigator.clipboard && window.navigator.clipboard.writeText) {
      window.navigator.clipboard.writeText(window.location.href).then(function () {
        showToast("The app link was copied.");
      }).catch(function () { showToast("Copy the page address from your browser to share it."); });
    } else {
      showToast("Open your browser menu and choose Share.");
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-share-app]"), function (button) {
    button.addEventListener("click", shareStory);
  });

  if (installBtn) {
    installBtn.addEventListener("click", function () {
      if (!deferredInstallPrompt) {
        showInstallHelp(window.navigator.standalone ? "Mercy is already installed on this device." : "Open your browser menu and choose Add to Home Screen.");
        return;
      }
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function () { deferredInstallPrompt = null; });
      installBtn.hidden = true;
    });
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installBtn) installBtn.hidden = false;
  });

  function setActiveMobileChapter(key) {
    mobileNavLinks.forEach(function (link) {
      const active = link.getAttribute("data-mobile-nav") === key;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  function setActiveChapter(section) {
    if (!section) return;
    if (indicatorNum) indicatorNum.textContent = section.getAttribute("data-chapter-num") || "";
    if (indicatorName) indicatorName.textContent = section.getAttribute("data-chapter-name") || "";
    const key = section.getAttribute("data-chapter");
    setActiveMobileChapter(key);
    railDots.forEach(function (dot) { dot.classList.toggle("is-active", dot.getAttribute("data-rail") === key); });
  }

  function revealNow(element) { if (element) element.classList.add("is-revealed"); }
  function revealAllWithin(root) {
    if (root) Array.prototype.forEach.call(root.querySelectorAll(".reveal"), revealNow);
  }

  function showJourneyChrome() {
    if (chapterIndicator) chapterIndicator.hidden = false;
    if (journeyRail) journeyRail.hidden = false;
    if (mobileChapterNav) mobileChapterNav.hidden = false;
    if (readingProgress) readingProgress.classList.add("is-active");
    setActiveChapter(rootsSection);
  }

  function runOpeningTransition() {
    if (!prologue || !storyMain) return;
    storyMain.hidden = false;
    window.scrollTo(0, 0);
    revealAllWithin(rootsSection);
    if (beginLabel) beginLabel.textContent = "Journey begun";
    if (prefersReducedMotion || !transition) {
      prologue.hidden = true;
      showJourneyChrome();
      return;
    }
    if (transitionNum) transitionNum.textContent = "01";
    if (transitionTitle) transitionTitle.textContent = "Where It Began";
    transition.classList.add("is-active");
    window.setTimeout(function () {
      prologue.hidden = true;
      prologue.setAttribute("aria-hidden", "true");
    }, 420);
    window.setTimeout(function () {
      transition.classList.remove("is-active");
      showJourneyChrome();
    }, 2000);
    window.setTimeout(function () { transition.setAttribute("aria-hidden", "true"); }, 2650);
  }

  if (beginBtn) beginBtn.addEventListener("click", runOpeningTransition, { once: true });

  if (chapterSections.length && "IntersectionObserver" in window) {
    const chapterObserver = new IntersectionObserver(function (entries) {
      let best = null;
      entries.forEach(function (entry) {
        if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) best = entry;
      });
      if (best) setActiveChapter(best.target);
    }, { rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.15, 0.35, 0.6, 0.85] });
    chapterSections.forEach(function (section) { chapterObserver.observe(section); });
  }

  function initRevealObserver() {
    const targets = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (!targets.length) return;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach(revealNow);
      return;
    }
    const revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revealNow(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    targets.forEach(function (target) {
      if (!rootsSection || !rootsSection.contains(target)) revealObserver.observe(target);
    });
  }


  function restoreFocus(element) {
    if (element && typeof element.focus === "function") element.focus();
  }

  function syncPageLock() {
    const open = Boolean((mediaModal && mediaModal.open) || (blessingModal && blessingModal.open));
    document.body.classList.toggle("modal-open", open);
  }

  let modalItems = [];
  let modalIndex = -1;
  let mediaReturnFocus = null;

  function releaseModalMedia() {
    if (!modalContainer) return;
    Array.prototype.forEach.call(modalContainer.children, function (child) {
      if (String(child.tagName).toLowerCase() !== "video") return;
      child.pause();
      child.removeAttribute("src");
      if (typeof child.load === "function") child.load();
    });
    modalContainer.innerHTML = "";
  }

  function showModalItem(index) {
    if (!modalItems.length || !modalContainer) return;
    modalIndex = (index + modalItems.length) % modalItems.length;
    const item = modalItems[modalIndex];
    releaseModalMedia();
    if (item.type === "video") {
      const video = document.createElement("video");
      video.src = item.src;
      video.controls = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.muted = false;
      video.defaultMuted = false;
      video.volume = 1;
      video.preload = "metadata";
      modalContainer.appendChild(video);
      const attempt = video.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(function () { showToast("Tap the video Play button to start this memory."); });
      if (fullscreenBtn) fullscreenBtn.hidden = false;
    } else {
      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.alt || item.title || "A photograph from my story";
      modalContainer.appendChild(image);
      if (fullscreenBtn) fullscreenBtn.hidden = true;
    }
    if (modalCaption) modalCaption.textContent = item.caption || item.title || "";
    if (modalCount) {
      modalCount.textContent = modalIndex + 1 + " / " + modalItems.length;
      modalCount.hidden = modalItems.length < 2;
    }
    if (modalPrevBtn) modalPrevBtn.hidden = modalItems.length < 2;
    if (modalNextBtn) modalNextBtn.hidden = modalItems.length < 2;
  }

  function openMediaModal(items, startIndex) {
    if (!mediaModal || !modalContainer) return;
    modalItems = Array.isArray(items) ? items.slice() : (story && story.gallery ? story.gallery.slice() : []);
    modalIndex = Number.isFinite(startIndex) ? startIndex : 0;
    mediaReturnFocus = document.activeElement;
    showModalItem(modalIndex);
    if (!mediaModal.open && typeof mediaModal.showModal === "function") mediaModal.showModal();
    syncPageLock();
    if (modalCloseBtn && typeof modalCloseBtn.focus === "function") modalCloseBtn.focus();
  }

  function closeMediaModal() {
    if (!mediaModal || !mediaModal.open) return;
    releaseModalMedia();
    mediaModal.close();
    syncPageLock();
    restoreFocus(mediaReturnFocus);
    mediaReturnFocus = null;
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeMediaModal);
  if (modalPrevBtn) modalPrevBtn.addEventListener("click", function () { showModalItem(modalIndex - 1); });
  if (modalNextBtn) modalNextBtn.addEventListener("click", function () { showModalItem(modalIndex + 1); });
  if (mediaModal) {
    mediaModal.addEventListener("click", function (event) { if (event.target === mediaModal) closeMediaModal(); });
    mediaModal.addEventListener("cancel", function (event) { event.preventDefault(); closeMediaModal(); });
    mediaModal.addEventListener("close", function () { releaseModalMedia(); syncPageLock(); });
  }
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", function () {
      const video = modalContainer && modalContainer.querySelector("video");
      if (!video) return;
      const request = video.requestFullscreen || video.webkitRequestFullscreen || video.webkitEnterFullscreen;
      if (typeof request === "function") request.call(video);
    });
  }


  const galleryPosters = {
    music: "assets/images/ME CURRENTLY.jpg",
    faith: "assets/images/PASTOR PAUL OTENG ASAMOAH AND MAMA AGARTHA ASAMOAH.jpg",
    friends: "assets/images/I AND MY LOVELY FRIENDS.jpg",
    family: "assets/images/PICTURE WITH MY YOUNGER SIBLINGS.jpg",
    present: "assets/images/ME CURRENTLY.jpg"
  };

  function renderGallery(filter) {
    if (!galleryGrid || !story || !story.gallery) return;
    const active = filter || "all";
    const items = active === "all" ? story.gallery : story.gallery.filter(function (item) { return item.category === active; });
    const imageCount = items.filter(function (item) { return item.type !== "video"; }).length;
    const videoCount = items.length - imageCount;
    if (galleryStatus) {
      const parts = [];
      if (imageCount) parts.push(imageCount + (imageCount === 1 ? " photograph" : " photographs"));
      if (videoCount) parts.push(videoCount + (videoCount === 1 ? " video" : " videos"));
      galleryStatus.textContent = parts.join(" · ");
    }
    galleryGrid.innerHTML = "";
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "vault-empty";
      empty.textContent = "No memories in this collection yet.";
      galleryGrid.appendChild(empty);
      return;
    }
    items.forEach(function (item, index) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "vault-card-item";
      if (index === 0 && items.length > 4) card.classList.add("vault-card-item--feature");
      if ((index === 4 || index === 12) && items.length > 8) card.classList.add("vault-card-item--landscape");
      card.setAttribute("aria-label", "Open " + (item.title || "memory"));
      const media = document.createElement(item.type === "video" ? "video" : "img");
      if (item.type === "video") {
        media.src = item.src;
        media.preload = "none";
        media.playsInline = true;
        media.muted = true;
        media.poster = galleryPosters[item.category] || "assets/images/ME CURRENTLY.jpg";
        media.setAttribute("playsinline", "");
        media.setAttribute("aria-label", item.title || "Video memory");
      } else {
        media.src = item.src;
        media.alt = item.alt || item.title || "A photograph from my story";
        media.loading = "lazy";
        media.decoding = "async";
      }
      const badge = document.createElement("span");
      badge.className = "badge badge--glass vault-card-item__badge";
      badge.textContent = item.type === "video" ? "Video Memory" : "Photograph";
      const overlay = document.createElement("span");
      overlay.className = "vault-card-item__overlay";
      const title = document.createElement("strong");
      title.textContent = item.title || "A memory";
      const caption = document.createElement("small");
      caption.textContent = item.caption || "";
      overlay.appendChild(title);
      overlay.appendChild(caption);
      card.appendChild(media);
      card.appendChild(badge);
      card.appendChild(overlay);
      galleryGrid.appendChild(card);
      card.addEventListener("click", function () { openMediaModal(items, index); });
    });
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const filter = button.getAttribute("data-filter") || "all";
      filterButtons.forEach(function (other) {
        const active = other === button;
        other.classList.toggle("active", active);
        if (other.setAttribute) other.setAttribute("aria-selected", active ? "true" : "false");
      });
      renderGallery(filter);
    });
  });

  document.addEventListener("click", function (event) {
    const trigger = event.target && event.target.closest ? event.target.closest("[data-video-trigger]") : null;
    if (!trigger || !story) return;
    const src = trigger.getAttribute("data-video-trigger") || trigger.getAttribute("data-src");
    const index = story.gallery.findIndex(function (item) { return item.src === src; });
    if (index >= 0) openMediaModal(story.gallery, index);
  });

  function buildWaveform() {
    if (!waveformHost) return;
    waveformHost.innerHTML = "";
    for (let i = 0; i < 34; i++) {
      const bar = document.createElement("span");
      bar.style.height = Math.round(28 + Math.abs(Math.sin(i * 0.7)) * 62) + "%";
      waveformHost.appendChild(bar);
    }
  }

  function setMusicState(isPlaying) {
    if (waveformHost) waveformHost.classList.toggle("is-playing", isPlaying);
    if (musicLabel) musicLabel.textContent = isPlaying ? "Pause My Studio Song" : "Play My Studio Song";
    if (musicPlayBtn) musicPlayBtn.setAttribute("aria-pressed", isPlaying ? "true" : "false");
    if (musicStatus) musicStatus.textContent = isPlaying ? "Playing my studio recording" : "Tap play to hear my studio recording";
  }

  function toggleMusic() {
    if (!studioVideo) return;
    if (studioVideo.paused) {
      studioVideo.muted = false;
      const attempt = studioVideo.play();
      if (attempt && typeof attempt.catch === "function") attempt.catch(function () {
        setMusicState(false);
        setMusicStatus("Tap the video Play button once if your phone paused playback");
      });
    } else {
      studioVideo.pause();
    }
  }

  if (musicPlayBtn) musicPlayBtn.addEventListener("click", toggleMusic);
  if (studioVideo) {
    studioVideo.addEventListener("play", function () {
      if (birthdaySongVideo && !birthdaySongVideo.paused) birthdaySongVideo.pause();
      setMusicState(true);
    });
    studioVideo.addEventListener("pause", function () { setMusicState(false); });
    studioVideo.addEventListener("ended", function () { setMusicState(false); });
  }
  if (birthdaySongVideo) {
    birthdaySongVideo.addEventListener("play", function () {
      if (studioVideo && !studioVideo.paused) {
        studioVideo.pause();
        setMusicState(false);
      }
    });
  }


  function setMusicStatus(message) { if (musicStatus) musicStatus.textContent = message; }

  let confettiFrame = null;
  function burstConfetti() {
    if (!confettiCanvas || prefersReducedMotion) return;
    const context = confettiCanvas.getContext("2d");
    const stage = confettiCanvas.parentElement;
    confettiCanvas.width = stage ? stage.offsetWidth : window.innerWidth;
    confettiCanvas.height = stage ? stage.offsetHeight : window.innerHeight;
    const colors = ["#D47A90", "#F4BAC7", "#5B8BAE", "#1E3A5F", "#FFFFFF", "#FCE7EC"];
    const particles = [];
    for (let i = 0; i < 110; i++) {
      particles.push({
        x: Math.random() * confettiCanvas.width,
        y: -Math.random() * confettiCanvas.height * 0.6,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        drift: Math.random() * 2 - 1,
        speed: Math.random() * 3.5 + 1.8,
        rotation: Math.random() * 360,
        spin: Math.random() * 6 - 3,
        opacity: 1
      });
    }
    let frame = 0;
    function paint() {
      context.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      frame++;
      particles.forEach(function (particle) {
        particle.y += particle.speed;
        particle.x += Math.sin(frame * 0.03) * 1.4 + particle.drift;
        particle.rotation += particle.spin;
        if (frame > 150) particle.opacity = Math.max(0, particle.opacity - 0.012);
        context.save();
        context.globalAlpha = particle.opacity;
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation * Math.PI / 180);
        context.fillStyle = particle.color;
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 1.5);
        context.restore();
      });
      if (frame < 260) confettiFrame = requestAnimationFrame(paint);
      else context.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
    if (confettiFrame) cancelAnimationFrame(confettiFrame);
    paint();
  }

  if (celebrateBtn) {
    celebrateBtn.addEventListener("click", function () {
      if (letterCard) {
        letterCard.hidden = false;
        requestAnimationFrame(function () { letterCard.classList.add("is-open"); });
      }
      celebrateBtn.disabled = true;
      celebrateBtn.textContent = "Happy Birthday, Mercy";
      burstConfetti();
    });
  }

  let blessingReturnFocus = null;
  function closeBlessingModal() {
    if (!blessingModal || !blessingModal.open) return;
    blessingModal.close();
    syncPageLock();
    restoreFocus(blessingReturnFocus);
    blessingReturnFocus = null;
  }

  if (secretSealBtn && blessingModal) {
    secretSealBtn.addEventListener("click", function () {
      if (blessingModal.open) return;
      blessingReturnFocus = document.activeElement;
      if (typeof blessingModal.showModal === "function") blessingModal.showModal();
      syncPageLock();
      if (blessingCloseBtn && typeof blessingCloseBtn.focus === "function") blessingCloseBtn.focus();
      burstConfetti();
    });
  }
  if (blessingCloseBtn) blessingCloseBtn.addEventListener("click", closeBlessingModal);
  if (blessingModal) {
    blessingModal.addEventListener("click", function (event) { if (event.target === blessingModal) closeBlessingModal(); });
    blessingModal.addEventListener("cancel", function (event) { event.preventDefault(); closeBlessingModal(); });
    blessingModal.addEventListener("close", function () { syncPageLock(); });
  }

  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  function updateReadingProgress() {
    if (!readingProgressBar) return;
    const max = document.documentElement ? document.documentElement.scrollHeight - window.innerHeight : 0;
    const value = max > 0 ? Math.min(1, Math.max(0, window.pageYOffset / max)) : 0;
    const percent = Math.round(value * 100);
    readingProgressBar.style.transform = "scaleX(" + value.toFixed(4) + ")";
    if (readingProgress) {
      readingProgress.classList.toggle("is-active", value > 0);
      readingProgress.setAttribute("aria-valuenow", String(percent));
    }
    if (backToTopBtn) backToTopBtn.classList.toggle("is-visible", percent >= 12);
  }
  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  window.addEventListener("resize", updateReadingProgress);
  updateReadingProgress();

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) return;
    if (studioVideo && !studioVideo.paused) studioVideo.pause();
    if (modalContainer) Array.prototype.forEach.call(modalContainer.querySelectorAll("video"), function (video) { video.pause(); });
  });
  window.addEventListener("offline", function () { showToast("You are offline — the saved story remains available."); });
  window.addEventListener("online", function () { showToast("Back online — your story is synced."); });

  mobileNavLinks.forEach(function (link) {
    link.addEventListener("click", function () { setActiveMobileChapter(link.getAttribute("data-mobile-nav")); });
  });

  if (window.navigator.serviceWorker && window.location.protocol !== "file:") {
    window.addEventListener("load", function () {
      window.navigator.serviceWorker.register("sw.js").catch(function () { /* Online use remains available. */ });
    });
  }

  buildWaveform();
  initRevealObserver();
  renderGallery("all");
  if (studioVideo) {
    studioVideo.muted = false;
    studioVideo.defaultMuted = false;
  }
  setMusicState(false);
})();
