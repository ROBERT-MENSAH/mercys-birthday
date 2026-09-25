/**
 * BIRTHDAY CHIME — SYNTHESISED, NOT DOWNLOADED
 * Mercy - A Story Worth Celebrating
 *
 * The brief asked for a short birthday-themed celebration SOUND, explicitly not
 * a song. There is no suitable audio file in the project and downloading
 * licensed music is not an option, so the chime is synthesised at runtime with
 * the Web Audio API: zero bytes of download, and an original tone rather than a
 * copyrighted sample.
 *
 * RULES HONOURED HERE
 *   - It NEVER autoplays. The AudioContext is only created inside a gesture.
 *   - It is short (~1.4s), plays at most once per moment, and never loops.
 *   - A visible on/off control exists, and the whole site works in silence.
 *   - If Web Audio is missing or blocked, every call is a silent no-op.
 *
 * The sound is a soft major arpeggio (C6 - E6 - G6 - C7) with a bell-like decay
 * and a short noise sparkle on the attack: a celebration, not a jingle.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "mercy-celebration-sound";
  var context = null;
  var lastPlayedAt = 0;
  var enabled = true;

  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "off") enabled = false;
  } catch (error) {
    /* Private mode: stay enabled for this session and simply not persist. */
  }

  function isSupported() {
    return Boolean(window.AudioContext || window.webkitAudioContext);
  }

  /**
   * Create the AudioContext lazily. Browsers refuse to start audio outside a
   * user gesture, so this may only ever be called from inside a click.
   */
  function ensureContext() {
    if (context) return context;
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      context = new Ctor();
    } catch (error) {
      return null;
    }
    return context;
  }

  /** One bell voice: a sine partial with an exponential decay. */
  function playBell(ctx, destination, frequency, startAt, duration, peakGain) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, startAt);

    // A short attack avoids the click a hard start makes on phone speakers.
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.05);
  }

  /** A brief filtered-noise sparkle layered over the arpeggio. */
  function playSparkle(ctx, destination, startAt) {
    var frames = Math.floor(ctx.sampleRate * 0.22);
    var buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }

    var source = ctx.createBufferSource();
    source.buffer = buffer;

    var filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3200;

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.09, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.22);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start(startAt);
    source.stop(startAt + 0.25);
  }

  /**
   * Play the celebration chime.
   * @param {object} [options]
   * @param {boolean} [options.force] Play even if it played very recently.
   * @returns {boolean} true if a sound was actually scheduled.
   */
  function playCelebration(options) {
    var opts = options || {};
    if (!enabled && !opts.force) return false;
    if (!isSupported()) return false;

    // Guard against rapid double-taps stacking several chimes.
    var now = Date.now();
    if (now - lastPlayedAt < 1200) return false;

    var ctx = ensureContext();
    if (!ctx) return false;

    // iOS keeps the context suspended until a gesture resumes it.
    if (ctx.state === "suspended" && typeof ctx.resume === "function") ctx.resume();

    var master = ctx.createGain();
    // Deliberately modest: this plays out of a phone speaker in a room.
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.02);
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
    master.connect(ctx.destination);

    var t0 = ctx.currentTime + 0.02;
    playSparkle(ctx, master, t0);
    playBell(ctx, master, 1046.5, t0, 1.1, 0.28);          // C6
    playBell(ctx, master, 1318.5, t0 + 0.13, 1.05, 0.24);  // E6
    playBell(ctx, master, 1568.0, t0 + 0.26, 1.0, 0.2);    // G6
    playBell(ctx, master, 2093.0, t0 + 0.39, 1.05, 0.16);  // C7

    lastPlayedAt = now;
    return true;
  }

  function syncToggleLabels() {
    var controls = document.querySelectorAll("[data-sound-toggle]");
    Array.prototype.forEach.call(controls, function (button) {
      button.setAttribute("aria-pressed", enabled ? "true" : "false");
      var label = button.querySelector("[data-sound-label]");
      if (label) {
        label.textContent = enabled ? "Celebration sound on" : "Celebration sound off";
      }
    });
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch (error) {
      /* Not persisting is acceptable; the toggle still works this session. */
    }
    syncToggleLabels();
  }

  /* Wire every control, keeping them in sync with the persisted choice. */
  document.addEventListener("click", function (event) {
    var trigger = event.target && event.target.closest
      ? event.target.closest("[data-sound-toggle]")
      : null;
    if (!trigger) return;
    setEnabled(!enabled);
    // Turning sound on is itself a user gesture, so preview it immediately.
    if (enabled) playCelebration({ force: true });
  });

  syncToggleLabels();

  window.MERCY_SOUND = {
    play: playCelebration,
    isEnabled: function () { return enabled; },
    setEnabled: setEnabled,
    isSupported: isSupported
  };
})();

