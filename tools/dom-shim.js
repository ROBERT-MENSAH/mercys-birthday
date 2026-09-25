/* Temporary smoke-test harness — minimal DOM shim for data.js + main.js. */
function makeClassList() {
  const set = new Set();
  return {
    add: function () { Array.prototype.forEach.call(arguments, (x) => set.add(x)); },
    remove: function () { Array.prototype.forEach.call(arguments, (x) => set.delete(x)); },
    toggle: function (c, force) {
      if (force === undefined) { set.has(c) ? set.delete(c) : set.add(c); }
      else if (force) set.add(c);
      else set.delete(c);
    },
    contains: function (c) { return set.has(c); }
  };
}

function makeEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    children: [],
    style: {},
    dataset: {},
    attributes: {},
    classList: makeClassList(),
    _innerHTML: "",
    textContent: "",
    hidden: false,
    disabled: false,
    open: false,
    paused: true,
    src: "",
    alt: "",
    loading: "",
    offsetWidth: 1200,
    offsetHeight: 800,
    parentElement: null
  };
  Object.defineProperty(el, "innerHTML", {
    get: function () { return el._innerHTML; },
    set: function (v) { el._innerHTML = v; if (v === "") el.children = []; }
  });
  el.appendChild = function (c) { el.children.push(c); c.parentElement = el; return c; };
  el.setAttribute = function (k, v) { el.attributes[k] = String(v); if (k === "hidden") el.hidden = true; };
  el.getAttribute = function (k) { return k in el.attributes ? el.attributes[k] : null; };
  el.removeAttribute = function (k) { delete el.attributes[k]; if (k === "hidden") el.hidden = false; };
  el.addEventListener = function (t, fn) {
    el._listeners = el._listeners || {};
    (el._listeners[t] = el._listeners[t] || []).push(fn);
  };
  el.removeEventListener = function () {};
  el.emit = function (t, evt) {
    const list = (el._listeners && el._listeners[t]) || [];
    list.slice().forEach(function (fn) { fn(evt || {}); });
  };
  el.once = function (t, fn) { el.addEventListener(t, fn); };
  el.querySelector = function () { return null; };
  el.querySelectorAll = function () { return []; };
  el.contains = function (n) { return n === el; };
  el.closest = function () { return null; };
  el.getContext = function () {
    return {
      clearRect: function () {}, save: function () {}, restore: function () {},
      translate: function () {}, rotate: function () {}, fillRect: function () {},
      fillStyle: "", globalAlpha: 1
    };
  };
  el.showModal = function () { el.open = true; };
  el.close = function () { el.open = false; };
  el.load = function () {};
  el.play = function () { el.paused = false; el.emit("play"); return Promise.resolve(); };
  el.pause = function () { el.paused = true; el.emit("pause"); };
  return el;
}

const CHAPTER_KEYS = ["roots", "school", "family", "friendship", "faith", "music", "present", "future", "gallery", "celebration"];

const ids = [
  "chapter-transition", "chapter-indicator", "journey-rail", "prologue", "story-main",
  "chapter-roots", "media-modal", "modal-container", "modal-caption", "blessing-modal",
  "confetti-canvas", "chapter-celebration"
];

const els = {};
ids.forEach(function (id) { els[id] = makeEl("div"); });

// Mirror the `hidden` attribute exactly as written in index.html.
["story-main", "chapter-indicator", "journey-rail"].forEach(function (id) {
  els[id].hidden = true;
});

function collection(n, tag) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(makeEl(tag));
  return arr;
}

const railDots = collection(10, "a");
railDots.forEach(function (d, i) { d.setAttribute("data-rail", CHAPTER_KEYS[i]); });

const chapterSections = collection(10, "section");
chapterSections.forEach(function (s, i) {
  s.setAttribute("data-chapter", CHAPTER_KEYS[i]);
  s.setAttribute("data-chapter-num", String(i + 1).padStart(2, "0"));
  s.setAttribute("data-chapter-name", CHAPTER_KEYS[i]);
});

const filterButtons = collection(7, "button");
const revealEls = collection(30, "div");
const galleryGrid = makeEl("div");
const galleryStatus = makeEl("p");
const beginBtn = makeEl("button");
const modalCloseBtn = makeEl("button");
const secretSealBtn = makeEl("button");
const blessingCloseBtn = makeEl("button");
const celebrateBtn = makeEl("button");
const letterCard = makeEl("article");
letterCard.hidden = true; // <article ... hidden> in index.html
const studioVideo = makeEl("video");
const musicPlayBtn = makeEl("button");
const musicLabel = makeEl("span");
const musicStatus = makeEl("p");
const waveformHost = makeEl("div");

const transitionNum = makeEl("span");
const transitionTitle = makeEl("h2");
els["chapter-transition"].querySelector = function (sel) {
  return sel === "[data-transition-num]" ? transitionNum : transitionTitle;
};

const indicatorNum = makeEl("span");
const indicatorName = makeEl("span");
els["chapter-indicator"].querySelector = function (sel) {
  return sel === "[data-indicator-num]" ? indicatorNum : indicatorName;
};

els["journey-rail"].querySelectorAll = function () { return railDots; };
els["confetti-canvas"].parentElement = els["chapter-celebration"];
// Only the first six reveal elements live inside Chapter 01 (matches the real markup).
els["chapter-roots"].contains = function (n) { return revealEls.slice(0, 6).indexOf(n) > -1; };
els["chapter-roots"].querySelectorAll = function (sel) {
  return sel === ".reveal" ? revealEls.slice(0, 6) : [];
};

const lookup = {
  "[data-begin-journey]": beginBtn,
  "[data-gallery-grid]": galleryGrid,
  "[data-gallery-status]": galleryStatus,
  "[data-filter]": filterButtons,
  "[data-modal-close]": modalCloseBtn,
  "[data-secret-seal]": secretSealBtn,
  "[data-blessing-close]": blessingCloseBtn,
  "[data-celebrate]": celebrateBtn,
  "[data-letter-card]": letterCard,
  "[data-studio-video]": studioVideo,
  "[data-music-play]": musicPlayBtn,
  "[data-music-label]": musicLabel,
  "[data-music-status]": musicStatus,
  "[data-waveform]": waveformHost,
  "[data-chapter]": chapterSections,
  ".journey-rail__dot": railDots,
  ".reveal": revealEls
};

module.exports = {
  makeEl: makeEl,
  els: els,
  lookup: lookup,
  railDots: railDots,
  chapterSections: chapterSections,
  filterButtons: filterButtons,
  revealEls: revealEls,
  galleryGrid: galleryGrid,
  galleryStatus: galleryStatus,
  beginBtn: beginBtn,
  modalCloseBtn: modalCloseBtn,
  secretSealBtn: secretSealBtn,
  blessingCloseBtn: blessingCloseBtn,
  celebrateBtn: celebrateBtn,
  letterCard: letterCard,
  studioVideo: studioVideo,
  musicPlayBtn: musicPlayBtn,
  musicLabel: musicLabel,
  musicStatus: musicStatus,
  waveformHost: waveformHost,
  transitionNum: transitionNum,
  transitionTitle: transitionTitle,
  indicatorNum: indicatorNum,
  indicatorName: indicatorName,
  CHAPTER_KEYS: CHAPTER_KEYS
};
