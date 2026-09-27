/**
 * Shared HTML shell and reusable components.
 *
 * Every URL is emitted relative to the page depth so the site works when
 * opened from a sub-folder or a local file path, not just a domain root.
 */
import { site, contact, creator } from "./content.mjs";
import { icon, sprite } from "./iconsprite.mjs";
import { media } from "./media.mjs";

/* Phone tabs (thumb reach) + desktop links (top bar). One source, no drift. */
export const NAV = [
  { href: "/", label: "Home", icon: "home", short: "Home" },
  { href: "/journey/", label: "Journey", icon: "compass", short: "Journey" },
  { href: "/memories/", label: "Memories", icon: "images", short: "Memories" },
  { href: "/birthday/", label: "Birthday", icon: "cake", hero: true, short: "Party" },
  { href: "/wishes/", label: "Wishes", icon: "heart", short: "Wishes" },
  /* Gifts is here so it is one tap away on a phone. The top bar is hidden on
     small screens, so anything not in this list is hard to reach on mobile. */
  { href: "/gifts/", label: "Gifts", icon: "gift", short: "Gifts" },
];

export const DESK = [
  ...NAV,
  { href: "/chat/", label: "Chat", icon: "quote", short: "Chat" },
  { href: "/creator/", label: "Creator", icon: "user", short: "Creator" },
];

export const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "../" repeated `depth` times - keeps every link portable. */
export const base = (depth = 0) => (depth ? "../".repeat(depth) : "./");

/**
 * Prefix a site-root-relative path with the page's base so it resolves
 * correctly from any folder depth. Use for assets and cross-page links.
 */
export const rel = (depth, p = "") => base(depth) + String(p).replace(/^\/+/, "");

/* The folder depth of the page currently being rendered. Components read
   this so every emitted asset URL resolves from wherever the page lives.
   `node tools/build.mjs` calls setDepth() before each page is built. */
let ASSET_BASE = "./";
export const setDepth = (d) => { ASSET_BASE = base(d); };
export const asset = (p) => ASSET_BASE + String(p).replace(/^\/+/, "");

const wa = (text) =>
  `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(text)}`;

/* -------------------------------------------------------------------------- */
/* Components                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A responsive photo inside a fixed-ratio frame.
 * The frame reserves space so nothing shifts while the image loads.
 */
export function picture(p, { ratio = "4/5", sizes = "(max-width: 720px) 92vw, 44vw", eager = false, cls = "", lightbox = true } = {}) {
  if (!p) return "";
  const srcset = p.srcset
    ? p.srcset
        .split(", ")
        .map((c) => {
          const [file, w] = c.split(" ");
          return `${asset(file)} ${w}`;
        })
        .join(", ")
    : "";
  const tag = `<img class="ph__img" src="${asset(p.src)}"${srcset ? ` srcset="${srcset}"` : ""} sizes="${sizes}" alt="${esc(p.alt)}" loading="${eager ? "eager" : "lazy"}"${eager ? ' fetchpriority="high"' : ""} decoding="async">`;
  const frame = `<figure class="ph ${cls}" style="--ar:${ratio}">`;

  /* No lightbox: render the image on its own. This is what covers, heroes and
     anything already wrapped in a link must use - a <button> inside an <a> is
     invalid HTML and fires both the zoom and the navigation. */
  if (!lightbox) return `${frame}${tag}</figure>`;

  const capAttr = p.caption ? ` data-caption="${esc(p.caption)}"` : "";
  return `${frame}<button class="ph__btn" type="button" data-zoom="${p.id}"${capAttr} aria-label="View larger: ${esc(p.caption || p.alt)}">${tag}<span class="ph__zoom" aria-hidden="true">${icon("plus", { size: 16 })}</span></button></figure>`;
}

/** A captioned photo. */
export function figure(p, { caption = "", ratio = "4/5", cls = "", eager = false, sizes } = {}) {
  if (!p) return "";
  return `<figure class="shot ${cls}">
    ${picture(p, { ratio, eager, sizes })}
    ${caption ? `<figcaption class="shot__cap">${esc(caption)}</figcaption>` : ""}
  </figure>`;
}

/** A row of photos. n = 2 or 3. */
export function strip(ids, { ratio, captions, cls = "", eagerFirst = false } = {}) {
  const list = ids.map((id) => media.photos[id]).filter(Boolean);
  if (!list.length) return "";
  const r = ratio || (list.length === 3 ? "1/1" : "3/4");
  const cells = list
    .map((p, i) => {
      const cap = captions?.[i] || p.caption;
      return `<figure class="shot shot--strip">
        ${picture(p, {
          ratio: r,
          eager: eagerFirst && i === 0,
          sizes: list.length === 3 ? "(max-width: 720px) 30vw, 20vw" : "(max-width: 720px) 45vw, 22vw",
        })}
        ${cap ? `<figcaption class="shot__cap">${esc(cap)}</figcaption>` : ""}
      </figure>`;
    })
    .join("\n      ");
  return `<div class="strip strip--${list.length} ${cls}">\n      ${cells}\n    </div>`;
}

/**
 * Poster-first video. No <video> element and no network request for the mp4
 * until the visitor presses play.
 *
 * Structure supports everything a finished card needs: title, description,
 * poster, play button, duration, and a "Why I included this" note. `why` is
 * deliberately optional - until Robert writes the real reason, the block is
 * not rendered at all, so no placeholder text ships to visitors.
 */
export function videoCard(id, { ratio = "16/10", cls = "", inline = false } = {}) {
  const v = media.videos[id];
  if (!v) return "";
  const ar = ratio || "16/10";
  return `<figure class="vcard ${cls}" data-video="${v.id}" data-src="${asset(v.src)}" data-title="${esc(v.title)}"${v.poster ? ` data-poster="${asset(v.poster)}"` : ""}>
        <div class="vcard__frame" style="--ar:${ar}">
          ${v.poster ? `<img class="vcard__poster" src="${asset(v.poster)}" alt="${esc(v.alt)}" width="960" height="600" loading="lazy" decoding="async">` : `<span class="vcard__poster vcard__poster--none"></span>`}
          <button class="vcard__play" type="button" data-play aria-label="Play video: ${esc(v.title)}">
            <span class="vcard__ring">${icon("play", { size: inline ? 26 : 22 })}</span>
            <span class="vcard__playlabel">Play</span>
          </button>
          <span class="vcard__title">${esc(v.title)}</span>
          <span class="vcard__state" data-vstate aria-live="polite"></span>
        </div>
        <figcaption class="vcard__cap">
          <span class="vcard__sub">${esc(v.caption)}</span>
          ${v.why ? `<span class="vcard__why"><b>Why I included this</b><span>${esc(v.why)}</span></span>` : ""}
        </figcaption>
      </figure>`;
}

/**
 * Fixed bottom tab bar for phones. Built from the same NAV source as the top
 * bar, so the two can never disagree about labels, icons or ordering.
 *
 * Only five destinations fit a thumb reach; the rest of the site stays
 * reachable through the menu button. `aria-current` marks the active tab, the
 * bar reserves the safe-area inset, and body padding (see .tabs-safe in CSS)
 * keeps the last line of every page clear of it.
 */
export const tabBar = (b, current = "") =>
  `<nav class="tabs" data-tabs aria-label="Main">
      <ul class="tabs__list">
        ${NAV.map((n) => {
          const on = n.href === current;
          return `<li><a class="tab${on ? " is-on" : ""}" href="${b}${n.href.slice(1)}"${on ? ' aria-current="page"' : ""} data-tab>
            <span class="tab__ico">${icon(n.icon, { size: 21 })}<span class="tab__dot" aria-hidden="true"></span></span>
            <span class="tab__label">${esc(n.short || n.label)}</span>
          </a></li>`;
        }).join("\n        ")}
      </ul>
    </nav>`;

/**
 * Opening gate. A short, word-by-word hook that sits in front of the real
 * page for a few seconds and then lifts away. It is not a loading screen:
 * the page behind it is already built and interactive, and the gate is
 * removed from the DOM (not merely hidden) so it can never trap scroll,
 * focus, or the back button.
 *
 * Skipped for reduced-motion visitors and for anyone who has already seen it
 * this session, so repeat visits go straight to the content.
 */
export function openingGate() {
  return `<div class="gate" data-gate hidden>
      <div class="gate__in">
        <p class="gate__line" data-gate-line>For a moment...</p>
        <p class="gate__line gate__line--big" data-gate-line>Pause.</p>
        <p class="gate__line gate__line--big" data-gate-line>This one is for <em>Mercy</em>.</p>
      </div>
      <button class="gate__skip" type="button" data-gate-skip>Skip</button>
    </div>`;
}

/**
 * Install card. Progressive enhancement: the markup is always present and
 * always useful, but the exact action is decided by scripts/app.js from what
 * the browser actually supports -
 *   native prompt  -> [ Install App ] triggers beforeinstallprompt
 *   iOS Safari     -> "Share -> Add to Home Screen" instructions
 *   already in app -> swapped for a confirmation state
 *   unsupported    -> a short, honest note (never a button that does nothing)
 */
export function installCard({ cls = "" } = {}) {
  return `<section class="installcard ${cls}" data-install aria-labelledby="installcard-h">
        <div class="installcard__glow" aria-hidden="true"></div>
        <p class="installcard__eyebrow">Make it yours</p>
        <h2 class="installcard__title" id="installcard-h">Keep this on your<br>home screen</h2>
        <p class="installcard__body" data-install-body>Install Mercy's Birthday and it opens full screen, like an app.</p>
        <div class="installcard__act">
          <button class="btn btn--primary installcard__btn" type="button" data-install-btn hidden>
            ${icon("download", { size: 18 })}<span data-install-label>Install App</span>
          </button>
          <ol class="installcard__steps" data-install-steps hidden>
            <li><span class="installcard__stepico">${icon("share", { size: 15 })}</span>Tap <b>Share</b></li>
            <li><span class="installcard__stepico">${icon("plus", { size: 15 })}</span>Choose <b>Add to Home Screen</b></li>
            <li><span class="installcard__stepico">${icon("check", { size: 15 })}</span>Tap <b>Add</b></li>
          </ol>
        </div>
        <p class="installcard__note" data-install-note hidden>${icon("info", { size: 14 })}<span data-install-note-text></span></p>
      </section>`;
}

/**
 * A compact install prompt for the top of the home page.
 *
 * The full install card lives at the very bottom of the home page, which is
 * exactly where nobody looks. This is the same state machine in a smaller
 * package, placed where it is actually seen, so a visitor never has to scroll
 * to the end of the page to find the one button that makes the whole thing
 * live on their home screen.
 *
 * It reuses the data-install hooks so it can never disagree with the card
 * below it or the button in the menu - scripts/app.js drives all of them from
 * one piece of state.
 *
 * Starts hidden. It is revealed by app.js only once a real state is known, so
 * it never flashes an empty prompt while the browser decides.
 */
export function installBar({ cls = "" } = {}) {
  return `<aside class="installbar ${cls}" data-install-bar data-install hidden aria-label="Add this to your home screen">
        <span class="installbar__icon" aria-hidden="true">${icon("download", { size: 18 })}</span>
        <div class="installbar__text">
          <p class="installbar__title">Keep this on your home screen</p>
          <p class="installbar__body" data-install-body>Install it and it opens full screen, like an app.</p>
        </div>
        <div class="installbar__act">
          <button class="btn btn--primary btn--sm installbar__btn" type="button" data-install-btn hidden>
            ${icon("download", { size: 15 })}<span data-install-label>Add to home screen</span>
          </button>
          <ol class="installbar__steps" data-install-steps hidden>
            <li>${icon("share", { size: 14 })}<b>Share</b></li>
            <li>${icon("plus", { size: 14 })}<b>Add to Home Screen</b></li>
            <li>${icon("check", { size: 14 })}<b>Add</b></li>
          </ol>
          <p class="installbar__note" data-install-note hidden>${icon("info", { size: 13 })}<span data-install-note-text></span></p>
        </div>
        <button class="installbar__x" type="button" data-install-dismiss aria-label="Dismiss the install prompt">${icon("close", { size: 15 })}</button>
      </aside>`;
}
/** WhatsApp wish launcher. */
export function wishBox(prompt, { text, label = "Send a wish", cls = "" } = {}) {
  return `<div class="wishbox ${cls}">
        <div class="wishbox__head">${icon("whatsapp", { size: 20 })}<h3>${esc(prompt)}</h3></div>
        <p class="wishbox__note">Wishes open in WhatsApp so they arrive straight on Mercy's phone.</p>
        <a class="btn btn--wa" href="${wa(text)}" target="_blank" rel="noopener">${icon("whatsapp", { size: 18 })}<span>${esc(label)}</span></a>
      </div>`;
}

/** Large editorial pull-quote. */
export const aphorism = (text) =>
  `<blockquote class="aph"><p>${esc(text)}</p></blockquote>`;

export const prose = (text) => `<p class="prose">${esc(text)}</p>`;

/** Section heading used on every page for consistent rhythm. */
export const sectionHead = (kicker, title, { center = false } = {}) =>
  `<header class="shead ${center ? "shead--center" : ""}">
        ${kicker ? `<p class="shead__kick">${esc(kicker)}</p>` : ""}
        <h2 class="shead__title">${esc(title)}</h2>
        <span class="shead__rule" aria-hidden="true"></span>
      </header>`;

/* -------------------------------------------------------------------------- */
/* Page shell — EPIC STRUCTURE                                                */
/*                                                                            */
/* Every page uses the same landmark order, mobile-first:                    */
/*   1. skip link        — keyboard / screen-reader fast path                 */
/*   2. ambient bg       — decorative only, outside landmarks                 */
/*   3. header.top       — brand + desktop nav + quick actions                */
/*   4. main#main.wrap   — the one unique content region per page             */
/*   5. footer.foot      — sitemap + credit                                   */
/*   6. lightbox + toast — app-level overlays                                 */
/*                                                                            */
/* Breakpoints: base = phone (360px), ≥600px = large phone,                  */
/* ≥860px = laptop, ≥1100px = wide. Base never depends on queries.           */
/* -------------------------------------------------------------------------- */

export const DESK_LINKS = DESK;

const headHtml = (current, b) =>
  `<a class="skip" href="#main">Skip to content</a>
    <div class="bg" aria-hidden="true">
      <span class="bg__orb bg__orb--a"></span><span class="bg__orb bg__orb--b"></span>
      <span class="bg__balloon bg__balloon--a"></span><span class="bg__balloon bg__balloon--b"></span>
      <span class="bg__flower bg__flower--a"></span><span class="bg__flower bg__flower--b"></span>
    </div>
    <header class="top" data-top>
      <span class="top__progress" data-scroll-progress aria-hidden="true"></span>
      <div class="top__in">
        <a class="brand" href="${b}" aria-label="${esc(site.name)} — home">
          <span class="brand__mark" aria-hidden="true">M</span>
          <span class="brand__txt"><b>${site.shortName}</b><i>${site.tagline}</i></span>
        </a>
        <nav class="top__nav" aria-label="Sections">
          <span class="top__pill" data-nav-pill aria-hidden="true"></span>
          <ul>
            ${DESK_LINKS.map(
              (n) =>
                `<li><a class="top__link${n.hero ? " top__link--hero" : ""} ${n.href === current ? "is-on" : ""}" href="${b}${n.href.slice(1)}"${n.href === current ? ' aria-current="page"' : ""} data-nav-link><span class="top__linkico">${icon(n.icon, { size: 18 })}</span><span>${n.label}</span></a></li>`,
            ).join("")}
          </ul>
        </nav>
        <div class="top__act">
          <button class="ibtn" type="button" data-share aria-label="Share this page" title="Share this page">${icon("share", { size: 19 })}</button>
          <a class="btn btn--primary btn--sm top__cta" href="${b}birthday/" aria-label="Go to the birthday celebration">${icon("cake", { size: 16 })}<span>Celebrate</span></a>
          <button class="ibtn top__menu" type="button" data-menu-btn aria-label="Open menu" aria-expanded="false" aria-controls="site-menu">${icon("menu", { size: 19 })}<span class="top__menutext">Menu</span></button>
        </div>
      </div>
      <dialog class="top__drawer" id="site-menu" data-menu aria-label="Site navigation">
        <div class="drawer__panel">
          <div class="drawer__head">
            <span class="drawer__title">Explore</span>
            <button class="ibtn drawer__close" type="button" data-menu-close aria-label="Close navigation">${icon("close", { size: 19 })}</button>
          </div>
          <nav aria-label="All sections">
            <ul>
              ${DESK_LINKS.map(
                (n) =>
                  `<li><a class="drawer__link ${n.href === current ? "is-on" : ""}" href="${b}${n.href.slice(1)}"${n.href === current ? ' aria-current="page"' : ""}><span class="drawer__ico">${icon(n.icon, { size: 19 })}</span><span>${n.label}</span>${icon("arrow-right", { size: 15 })}</a></li>`,
              ).join("\n              ")}
            </ul>
          </nav>
          <div class="drawer__foot">
            <button class="btn btn--sm" type="button" data-share>${icon("share", { size: 16 })}<span>Share</span></button>
            <a class="btn btn--sm btn--wa" href="https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent("Happy birthday Mercy!")}" target="_blank" rel="noopener">${icon("whatsapp", { size: 16 })}<span>Wish</span></a>
          </div>
          <div class="drawer__install" data-install-drawer>
            <button class="btn btn--sm btn--block" type="button" data-install-btn>
              ${icon("download", { size: 16 })}<span data-install-label>Install App</span>
            </button>
            <p class="drawer__installnote" data-install-note hidden>${icon("info", { size: 13 })}<span data-install-note-text></span></p>
          </div>
        </div>
      </dialog>
    </header>`;

const footHtml = (b, current = "") =>
  `<footer class="foot">
    <span class="foot__glow" aria-hidden="true"></span>
    <div class="foot__in">
      <div class="foot__main">
        <div class="foot__idn">
          <a class="brand brand--foot" href="${b}" aria-label="${esc(site.name)} — home">
            <span class="brand__mark" aria-hidden="true">M</span>
            <span class="brand__txt"><b>${esc(site.name)}</b><i>${esc(site.tagline)}</i></span>
          </a>
          <p class="foot__line">Made with real photographs and real memories.</p>
          <div class="foot__social">
            <button class="ibtn" type="button" data-share aria-label="Share this celebration" title="Share">${icon("share", { size: 18 })}</button>
            <a class="ibtn" href="https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent("Happy birthday Mercy!")}" target="_blank" rel="noopener" aria-label="Send a birthday wish on WhatsApp" title="WhatsApp">${icon("whatsapp", { size: 18 })}</a>
            <a class="ibtn" href="${b}creator/" aria-label="Meet the creator" title="Creator">${icon("user", { size: 18 })}</a>
          </div>
        </div>
        <nav class="foot__nav" aria-label="Footer">
          <div class="foot__grp">
            <h3 class="foot__h">Explore</h3>
            <ul class="foot__links">
              ${NAV.map((n) => `<li><a class="${n.href === current ? "is-on" : ""}" href="${b}${n.href.slice(1)}"${n.href === current ? ' aria-current="page"' : ""}>${n.label}</a></li>`).join("")}
            </ul>
          </div>
          <div class="foot__grp">
            <h3 class="foot__h">Celebrate</h3>
            <ul class="foot__links">
              <li><a class="${current === "/birthday/" ? "is-on" : ""}" href="${b}birthday/"${current === "/birthday/" ? ' aria-current="page"' : ""}>Birthday party</a></li>
              <li><a class="${current === "/wishes/" ? "is-on" : ""}" href="${b}wishes/"${current === "/wishes/" ? ' aria-current="page"' : ""}>Send a wish</a></li>
              <li><a class="${current === "/chat/" ? "is-on" : ""}" href="${b}chat/"${current === "/chat/" ? ' aria-current="page"' : ""}>Live chat wall</a></li>
              <li><a class="${current === "/gifts/" ? "is-on" : ""}" href="${b}gifts/"${current === "/gifts/" ? ' aria-current="page"' : ""}>Gifts</a></li>
              <li><a class="${current === "/memories/" ? "is-on" : ""}" href="${b}memories/"${current === "/memories/" ? ' aria-current="page"' : ""}>Memory room</a></li>
            </ul>
          </div>
        </nav>
        <div class="foot__acts">
          <p class="foot__eyebrow">${icon("cake", { size: 14 })} Make a wish for Mercy.</p>
          <div class="foot__cta-act">
            <a class="btn btn--primary btn--sm" href="${b}birthday/">${icon("cake", { size: 16 })}<span>Celebrate</span></a>
            <a class="btn btn--sm" href="${b}wishes/">${icon("heart", { size: 16 })}<span>Send a wish</span></a>
            <button class="btn btn--sm" type="button" data-share>${icon("share", { size: 16 })}<span>Share</span></button>
          </div>
        </div>
      </div>
      <div class="foot__bottom">
        <div class="foot__copy">
          <p>&copy; ${new Date().getFullYear()} ${esc(site.name)} &middot; ${esc(site.tagline)}</p>
          <p class="foot__by">Created with love &middot; ${esc(creator.name)} &middot; ${esc(creator.role)}</p>
        </div>
        <div class="foot__bar-act">
          <a class="foot__creator" href="${b}creator/">Meet the creator ${icon("arrow-right", { size: 14 })}</a>
          <a class="foot__top" href="#top">${icon("arrow-up", { size: 14 })}<span>Back to top</span></a>
        </div>
      </div>
    </div>
  </footer>`;

const lightboxHtml = () =>
  `<div class="lb" data-lightbox hidden>
      <div class="lb__scrim" data-lb-close></div>
      <figure class="lb__fig" role="dialog" aria-modal="true" aria-label="Enlarged photograph">
        <img class="lb__img" alt="">
        <figcaption class="lb__cap"><b class="lb__title"></b><span class="lb__desc"></span><span class="lb__count"></span></figcaption>
        <button class="lb__x" type="button" data-lb-close aria-label="Close">${icon("close", { size: 20 })}</button>
        <button class="lb__nav lb__nav--p" type="button" data-lb-prev aria-label="Previous">${icon("chevron-left", { size: 22 })}</button>
        <button class="lb__nav lb__nav--n" type="button" data-lb-next aria-label="Next">${icon("chevron-right", { size: 22 })}</button>
      </figure>
    </div>`;

/**
 * Full HTML document — the epic, best structure.
 * `current` is the NAV href of the active tab, or "" for pages off-nav.
 *
 * <head> order is deliberate:
 *   charset → viewport → title → description → theme → PWA icons →
 *   social cards → preload hero → stylesheet → page JSON-LD.
 * <body> order is deliberate:
 *   sprite → skip → bg → header → main → footer → overlays → JS.
 */
export function page({
  title,
  description = site.description,
  current = "",
  depth = 0,
  body,
  bodyClass = "",
  ogImage = "img/my-picture-1-960.jpg",
  jsonLd = null,
  preloadHero = null,
  /* Extra per-page scripts, loaded after app.js. Kept opt-in so the 14 other
     pages do not download a chat bundle they never use. */
  scripts = null,
}) {
  const b = base(depth);
  const full = title === site.name ? title : `${title} - ${site.name}`;
  const canonical = `${b}${current ? current.slice(1) : ""}`;
  const foot = footHtml(b, current);
  return `<!doctype html>
<html lang="en" dir="ltr" id="top">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(full)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta name="theme-color" content="${site.themeColor}" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="${site.themeColor}" media="(prefers-color-scheme: light)">
  <meta name="color-scheme" content="dark light">
  <link rel="manifest" href="${b}manifest.webmanifest">
  <link rel="icon" href="${b}icons/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="${b}icons/apple-touch-icon.png">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="${site.shortName}">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="format-detection" content="telephone=no">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(site.name)}">
  <meta property="og:title" content="${esc(full)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(full)}">
  <meta name="twitter:description" content="${esc(description)}">
  ${preloadHero ? `<link rel="preload" as="image" href="${asset(preloadHero.src)}"${preloadHero.srcset ? ` imagesrcset="${preloadHero.srcset.split(", ").map((c) => { const [f, w] = c.split(" "); return `${asset(f)} ${w}`; }).join(", ")}" imagesizes="(max-width: 860px) 92vw, 44vw"` : ""} fetchpriority="high">` : ""}
  <link rel="stylesheet" href="${b}styles/app.css">
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ""}
</head>
<body class="${bodyClass}">
  ${sprite()}
  ${openingGate()}
  ${headHtml(current, b)}
  <main id="main" class="wrap" tabindex="-1">
    <p class="netbar" data-net role="status" aria-live="polite" hidden></p>
${body}
  </main>
  ${foot}
  ${tabBar(b, current)}
  ${lightboxHtml()}
  <div class="toast" data-toast role="status" aria-live="polite"></div>
  <script src="${b}scripts/app.js" defer></script>
  ${scripts ? scripts.map((s) => `<script src="${b}scripts/${s}" defer></script>`).join("\n  ") : ""}
  <noscript><p class="note" style="text-align:center;padding:1rem">This celebration works best with JavaScript on — photos and wishes still work without it.</p></noscript>
</body>
</html>`;
}

