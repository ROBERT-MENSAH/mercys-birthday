/* Temporary smoke test: executes data.js + main.js and asserts the interactions. */
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const shim = require("./dom-shim.js");

const root = path.resolve(__dirname, "..");

/* ---- fake timers -------------------------------------------------------- */
const timerQueue = [];
let timerSeq = 0;
function fakeSetTimeout(fn, delay) {
  const id = ++timerSeq;
  timerQueue.push({ id: id, fn: fn, delay: delay || 0 });
  return id;
}
function flushTimers() {
  timerQueue.sort(function (a, b) { return a.delay - b.delay; });
  while (timerQueue.length) {
    const t = timerQueue.shift();
    t.fn();
  }
}

/* ---- fake rAF ----------------------------------------------------------- */
const rafQueue = [];
function fakeRaf(fn) { rafQueue.push(fn); return rafQueue.length; }
function flushRaf() {
  while (rafQueue.length) {
    const fn = rafQueue.shift();
    fn(0);
  }
}

/* ---- IntersectionObserver ---------------------------------------------- */
const observers = [];
class IntersectionObserver {
  constructor(cb, opts) { this.cb = cb; this.opts = opts; this.observed = []; observers.push(this); }
  observe(el) { this.observed.push(el); }
  unobserve(el) { this.observed = this.observed.filter(function (x) { return x !== el; }); }
  disconnect() { this.observed = []; }
  trigger(entries) { this.cb(entries, this); }
}

const docListeners = {};
const documentStub = {
  body: shim.makeEl("body"),
  getElementById: function (id) { return shim.els[id] || null; },
  querySelector: function (sel) { return shim.lookup[sel] || null; },
  querySelectorAll: function (sel) {
    const hit = shim.lookup[sel];
    if (!hit) return [];
    return Array.isArray(hit) ? hit : [hit];
  },
  createElement: shim.makeEl,
  addEventListener: function (t, fn) {
    (docListeners[t] = docListeners[t] || []).push(fn);
  }
};

const windowStub = {
  document: documentStub,
  navigator: { userAgent: "test", standalone: false },
  matchMedia: function () { return { matches: false }; },
  addEventListener: function () {},
  scrollTo: function () {},
  innerWidth: 1200,
  innerHeight: 800,
  IntersectionObserver: IntersectionObserver,
  requestAnimationFrame: fakeRaf,
  cancelAnimationFrame: function () {},
  setTimeout: fakeSetTimeout
};
windowStub.window = windowStub;

const sandbox = {
  window: windowStub,
  document: documentStub,
  IntersectionObserver: IntersectionObserver,
  requestAnimationFrame: fakeRaf,
  cancelAnimationFrame: function () {},
  setTimeout: fakeSetTimeout,
  console: console,
  Math: Math,
  Date: Date,
  Array: Array,
  Object: Object,
  String: String,
  Promise: Promise,
  Set: Set,
  WeakSet: WeakSet,
  JSON: JSON
};
sandbox.globalThis = sandbox;
sandbox.self = sandbox;

vm.createContext(sandbox);

/* ---- run the real scripts ---------------------------------------------- */
vm.runInContext(fs.readFileSync(path.join(root, "js", "data.js"), "utf8"), sandbox, { filename: "data.js" });
vm.runInContext(fs.readFileSync(path.join(root, "js", "main.js"), "utf8"), sandbox, { filename: "main.js" });

/* ---- assertions --------------------------------------------------------- */
const failures = [];
function check(label, cond, detail) {
  const stamp = cond ? "  PASS  " : "  FAIL  ";
  if (!cond) failures.push(label);
  console.log(stamp + label + (detail ? "  [" + detail + "]" : ""));
}

const GAL = sandbox.window.MERCY_STORY.gallery.length;

console.log("\n== BOOT ==");
check("window.MERCY_STORY exposed", !!sandbox.window.MERCY_STORY);
check("gallery rendered from data registry", shim.galleryGrid.children.length === GAL,
  shim.galleryGrid.children.length + " of " + GAL + " cards");
check("waveform built (visual only)", shim.waveformHost.children.length === 34,
  shim.waveformHost.children.length + " bars");
check("music starts paused - no autoplay",
  shim.studioVideo.paused === true && !shim.waveformHost.classList.contains("is-playing"));
check("studio soundtrack is explicitly unmuted",
  shim.studioVideo.muted === false && shim.studioVideo.defaultMuted === false);
shim.musicPlayBtn.emit("click");
check("music play button starts the real studio video", shim.studioVideo.paused === false);
shim.musicPlayBtn.emit("click");
check("music play button pauses the studio video", shim.studioVideo.paused === true);
check("story main still hidden pre-click", shim.els["story-main"].hidden === true);
check("chapter indicator + rail hidden pre-click",
  shim.els["chapter-indicator"].hidden === true && shim.els["journey-rail"].hidden === true);

const chapterObs = observers[0];
const revealObs = observers[1];
check("chapter observer watches all 10 chapters", chapterObs.observed.length === 10);
check("reveal observer skips chapter 01 reveals (handled by the transition)",
  revealObs.observed.length === shim.revealEls.length - 6,
  revealObs.observed.length + " observed / " + shim.revealEls.length + " total");

console.log("\n== OPENING TRANSITION (the reported blank-screen bug) ==");
shim.beginBtn.emit("click");
check("story main revealed immediately on click", shim.els["story-main"].hidden === false);
check("chapter 01 reveals already visible - no empty first viewport",
  shim.revealEls.slice(0, 6).every(function (el) { return el.classList.contains("is-revealed"); }));
check("cinematic curtain active", shim.els["chapter-transition"].classList.contains("is-active"));
check("curtain reads 01 / Where It Began",
  shim.transitionNum.textContent === "01" && shim.transitionTitle.textContent === "Where It Began");
check("prologue still mounted while curtain covers it", shim.els["prologue"].hidden === false);

flushTimers();
check("prologue removed once the curtain settles", shim.els["prologue"].hidden === true);
check("curtain lifted", !shim.els["chapter-transition"].classList.contains("is-active"));
check("indicator + rail visible after the journey begins",
  shim.els["chapter-indicator"].hidden === false && shim.els["journey-rail"].hidden === false);

console.log("\n== CHAPTER TRACKING ==");
chapterObs.trigger([{ isIntersecting: true, intersectionRatio: 0.9, target: shim.chapterSections[4] }]);
check("indicator follows the scroll position",
  shim.indicatorNum.textContent === "05" && shim.indicatorName.textContent === "faith",
  shim.indicatorNum.textContent + " / " + shim.indicatorName.textContent);
check("progress rail marks the active dot",
  shim.railDots[4].classList.contains("is-active") && !shim.railDots[0].classList.contains("is-active"));

console.log("\n== GALLERY FILTERS ==");
shim.filterButtons[1].setAttribute("data-filter", "family");
shim.filterButtons[1].emit("click");
const familyCount = sandbox.window.MERCY_STORY.gallery.filter(function (i) {
  return i.category === "family";
}).length;
check("family filter renders only family memories", shim.galleryGrid.children.length === familyCount,
  shim.galleryGrid.children.length + " cards, expected " + familyCount);
shim.filterButtons[0].setAttribute("data-filter", "all");
shim.filterButtons[0].emit("click");
check("all filter restores every memory", shim.galleryGrid.children.length === GAL);

console.log("\n== FINALE (anticipation first, then celebration) ==");
check("birthday letter stays hidden until asked", shim.letterCard.hidden === true);
shim.celebrateBtn.emit("click");
flushRaf();
check("letter opens on request", shim.letterCard.hidden === false && shim.letterCard.classList.contains("is-open"));
check("celebrate button becomes a confirmation", shim.celebrateBtn.disabled === true);

console.log("\n== RESULT ==");
console.log(failures.length ? failures.length + " FAILURE(S): " + failures.join(" | ") : "ALL CHECKS PASSED");
process.exit(failures.length ? 1 : 0);

