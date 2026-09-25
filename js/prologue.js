/**
 * PROLOGUE â€” KINETIC TYPOGRAPHY CONTROLLER
 * Mercy - A Story Worth Celebrating
 *
 * Responsibilities, in order of importance:
 *   1. NEVER block the visitor. The Begin button works immediately; the
 *      animation is decoration layered on an already-usable page.
 *   2. Write per-element delays as CSS custom properties, so the stylesheet
 *      owns the motion and this file owns only the timing arithmetic.
 *   3. Cross-fade the photograph layers in step with the headline.
 *   4. Respect prefers-reduced-motion by jumping straight to the end state.
 *   5. Allow a tap to skip â€” a four-second intro must be dismissible.
 */
(function () {
  "use strict";

  var prologue = document.getElementById("prologue");
  if (!prologue) return;

  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var words = Array.prototype.slice.call(prologue.querySelectorAll("[data-kinetic-word]"));
  var name = prologue.querySelector("[data-kinetic-name]");
  var lede = prologue.querySelector("[data-kinetic-lede]");
  var action = prologue.querySelector("[data-kinetic-action]");
  var hint = prologue.querySelector("[data-kinetic-hint]");
  var headline = prologue.querySelector(".prologue__headline");
  var plates = Array.prototype.slice.call(prologue.querySelectorAll("[data-prologue-plate]"));
  var beginBtn = prologue.querySelector("[data-begin-journey]");

  /* Cadence. Deliberately brisk: a long intro is the fastest way to lose
     someone who has only just tapped a link in WhatsApp. */
  var FIRST_DELAY = 320;    // ms before the first masked line moves
  var LINE_STEP = 260;      // ms between consecutive lines
  var WORD_DURATION = 1050; // ms for one masked line
  var NAME_GAP = 300;       // ms after the last line before the name resolves
  var TAIL_GAP = 420;       // ms after the name before the lede
  var ACTION_GAP = 320;     // ms after the lede before the button
  var HERO_WAIT_CAP = 1200; // ms max pre-roll, however slow the connection

  var sequenceTimers = [];
  var plateTimer = null;
  var plateIndex = 0;
  var settled = false;
  var started = false;

  function setDelay(element, ms) {
    if (element) element.style.setProperty("--kinetic-delay", ms + "ms");
  }

  /**
   * Derive the timeline from the number of real lines and publish it.
   * Computing from content means the sequence stays correct if the copy is
   * edited later, with no numbers left to hand-tune.
   */
  function scheduleSequence() {
    var lastLineAt = FIRST_DELAY;
    words.forEach(function (word, index) {
      var at = FIRST_DELAY + index * LINE_STEP;
      setDelay(word, at);
      lastLineAt = at + WORD_DURATION;
    });

    var nameAt = lastLineAt + NAME_GAP;
    var ledeAt = nameAt + TAIL_GAP;
    var actionAt = ledeAt + ACTION_GAP;
    var hintAt = actionAt + 260;

    [name, headline].forEach(function (el) {
      if (el) el.style.setProperty("--kinetic-name-delay", nameAt + "ms");
    });
    if (lede) lede.style.setProperty("--kinetic-lede-delay", ledeAt + "ms");
    if (action) action.style.setProperty("--kinetic-action-delay", actionAt + "ms");
    if (hint) hint.style.setProperty("--kinetic-hint-delay", hintAt + "ms");

    return hintAt + 700;
  }

  /** Advance to the next photograph layer, wrapping around. */
  function showPlate(index) {
    if (!plates.length) return;
    plateIndex = ((index % plates.length) + plates.length) % plates.length;
    plates.forEach(function (plate, i) {
      plate.classList.toggle("is-active", i === plateIndex);
    });
  }

  function cyclePlates() {
    if (motionQuery.matches || plates.length < 2 || plateTimer) return;
    plateTimer = window.setInterval(function () {
      showPlate(plateIndex + 1);
    }, 3400);
  }

  function stopPlateCycle() {
    if (plateTimer) { window.clearInterval(plateTimer); plateTimer = null; }
  }

  /** Jump to the finished state: every word visible, nothing animating. */
  function settle() {
    if (settled) return;
    settled = true;
    sequenceTimers.forEach(window.clearTimeout);
    sequenceTimers = [];
    stopPlateCycle();
    prologue.classList.add("is-live", "is-settled");
  }

  function play() {
    if (settled) return;
    if (motionQuery.matches) { settle(); return; }

    var totalMs = scheduleSequence();
    // Two frames so the pre-roll state paints first; without them the first
    // masked line can be skipped entirely on a fast device.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        prologue.classList.add("is-live");
        cyclePlates();
      });
    });
    sequenceTimers.push(window.setTimeout(settle, totalMs + 400));
  }

  /* --- Start when the critical photograph has painted --------------------
     Waiting for the hero image is what makes the sequence feel intentional
     rather than random, but the wait is capped so a slow connection is never
     stuck behind a pre-roll. */
  var heroImage = prologue.querySelector(".prologue__photo");

  function start() {
    if (started) return;
    started = true;
    play();
  }

  if (motionQuery.matches) {
    // No motion requested: present the finished hook immediately.
    settle();
    start();
  } else if (heroImage && heroImage.complete && heroImage.naturalWidth > 0) {
    start();
  } else {
    var capTimer = window.setTimeout(start, HERO_WAIT_CAP);
    if (heroImage) {
      heroImage.addEventListener("load", function () {
        window.clearTimeout(capTimer);
        start();
      }, { once: true });
      heroImage.addEventListener("error", function () {
        window.clearTimeout(capTimer);
        start();
      }, { once: true });
    }
  }

  /* --- Skip on tap ------------------------------------------------------
     Tapping the background (not a control) finishes the sequence. */
  prologue.addEventListener("click", function (event) {
    if (event.target && event.target.closest && event.target.closest("button, a")) return;
    settle();
  });

  prologue.addEventListener("keydown", function (event) {
    if (event.key === "Escape" || event.key === "Enter" || event.key === " ") settle();
  });

  // Never leave an interval running behind a backgrounded tab.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stopPlateCycle();
    else if (!settled) cyclePlates();
  });

  /* Small hook so the main controller can stop the photo loop the moment the
     visitor starts the journey. */
  window.MERCY_PROLOGUE = {
    settle: settle,
    isSettled: function () { return settled; },
    beginButton: beginBtn
  };
})();
