/**
 * Static site generator.
 *
 *   node tools/build.mjs        build into dist/
 *
 * There are no dependencies: everything here is Node built-ins.
 */
import { mkdirSync, writeFileSync, cpSync, rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { site, contact, creator, photos, photoGroups, videos } from "./content.mjs";
import { chapters, wishPrompts, celebration } from "./story.mjs";
import { media, cover, problems } from "./media.mjs";
import { icon } from "./iconsprite.mjs";
import { page, esc, picture, figure, strip, videoCard, wishBox, installCard, aphorism, prose, sectionHead, base, rel, setDepth, asset, NAV } from "./templates.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "dist");

if (problems.length) {
  console.error("\nMedia problems:\n" + problems.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}

/* A chapter cover that resolves to nothing renders a blank frame, which is
   easy to miss. Fail the build instead. */
for (const ch of chapters) {
  if (!cover(ch.cover)) {
    console.error(
      `\nChapter "${ch.slug}" has an unresolvable cover: "${ch.cover}".\n` +
        "It must be a photo id or a video id that has a poster frame.\n",
    );
    process.exit(1);
  }
}

const written = [];
const write = (relPath, html) => {
  const file = path.join(OUT, relPath);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, html, "utf8");
  written.push({ rel: relPath, size: Buffer.byteLength(html) });
};

const P = (id) => media.photos[id];
const V = (id) => media.videos[id];
/* Chapter covers may be a photo or a video poster - see cover() in media.mjs. */
const C = (id) => cover(id);
const waLink = (text) =>
  `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(text)}`;

/** Build a page body at a given folder depth and wrap it in the shell. */
const at = (depth, fn, opts) => {
  setDepth(depth);
  const html = fn();
  return page({ ...opts, depth, body: html });
};

/* ------------------------------------------------------------------ pages */

/* --- Home ------------------------------------------------------------- */
function home() {
  setDepth(0);
  const hero = P("me-currently");
  const highlights = [
    { p: P("my-childhood-picture"), to: "story/childhood/", cap: "My Childhood", num: "01" },
    { p: P("i-and-my-lovely-friends"), to: "story/people/", cap: "People in My Life", num: "03" },
    { p: P("me-currently"), to: "story/today/", cap: "Who I Am Today", num: "06" },
  ];

  const body = `    <section class="hero">
      <div class="hero__grid">
        <div>
          <p class="hero__eyebrow">${icon("sparkles", { size: 15 })} A birthday for Mercy</p>
          <h1 class="hero__title">Happy Birthday,<em>Mercy.</em></h1>
          <p class="hero__lead">${site.description} Every photograph and every video on these pages is real, and every word is written from the inside.</p>
          <div class="btnrow hero__cta">
            <a class="btn btn--primary" href="journey/">${icon("compass", { size: 18 })}<span>Start the journey</span></a>
            <a class="btn btn--ghost" href="memories/">${icon("images", { size: 18 })}<span>Memory room</span></a>
          </div>
        </div>
        <div class="hero__media">
          <div class="hero__frame">${picture(hero, { ratio: "4/5", eager: true, lightbox: false, sizes: "(max-width: 860px) 92vw, 44vw" })}</div>
          <p class="hero__badge"><span class="hero__dot"></span><b>${photos.length}</b> photographs &middot; <b>${videos.length}</b> videos</p>
        </div>
      </div>
    </section>

    <section class="section">
      ${sectionHead("The chapters", "A life in moments")}
      <p class="prose rv">Seven chapters, told in order, from the very first photograph to the one I am still writing.</p>
      <div class="chgrid" style="margin-top:var(--s-5)">
        ${highlights
          .map(
            (h) => `<a class="chcard rv" href="${h.to}">
          <div class="chcard__media">${picture(h.p, { ratio: "3/4", sizes: "(max-width: 600px) 92vw, 30vw", lightbox: false })}
            <span class="chcard__num">${h.num}</span>
          </div>
          <div class="chcard__body">
            <h3 class="chcard__title">${esc(h.cap)}</h3>
            <span class="chcard__go">Read ${icon("arrow-right", { size: 14 })}</span>
          </div>
        </a>`,
          )
          .join("\n        ")}
      </div>
      <div class="btnrow" style="margin-top:var(--s-5)">
        <a class="btn" href="journey/">See all seven chapters ${icon("arrow-right", { size: 16 })}</a>
      </div>
    </section>

    <section class="section section--tight">
      ${sectionHead("Now", "Mercy, right now")}
      ${strip(["me-currently", "my-favourate-picture", "my-picture-1", "years-back"], { cls: "rv", captions: ["Me currently", "My favourite picture", "In a white dress", "Years back"] })}
      <div class="btnrow" style="margin-top:var(--s-5)">
        <a class="btn btn--primary" href="birthday/">${icon("cake", { size: 18 })}<span>Go to the celebration</span></a>
      </div>
    </section>

    <section class="section section--tight">
      <div class="wishbox rv">
        <div class="wishbox__head">${icon("whatsapp", { size: 20 })}<h3>Send a wish</h3></div>
        <p class="wishbox__note">Wishes open in WhatsApp so they land straight on Mercy's phone.</p>
        <a class="btn btn--wa" href="${waLink(wishPrompts[0])}" target="_blank" rel="noopener">${icon("whatsapp", { size: 18 })}<span>Write a wish</span></a>
      </div>
    </section>

    <section class="section section--tight">
      ${installCard({ cls: "rv" })}
    </section>`;

  return at(0, () => body, {
    title: site.name,
    description: site.description,
    current: "/",
    bodyClass: "p-home",
    ogImage: "img/me-currently-852.jpg",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: site.name,
      description: site.description,
      image: "img/me-currently-852.jpg",
      author: { "@type": "Person", name: creator.name },
    },
  });
}

/* --- Journey ---------------------------------------------------------- */
function journey() {
  setDepth(1);
  const cards = chapters
    .map(
      (ch) => `<a class="chcard rv" href="../story/${ch.slug}/">
        <div class="chcard__media">${picture(C(ch.cover), { ratio: "3/4", sizes: "(max-width: 600px) 92vw, 30vw", lightbox: false })}
          <span class="chcard__num">${ch.number}</span>
        </div>
        <div class="chcard__body">
          <h3 class="chcard__title">${esc(ch.title)}</h3>
          <p class="chcard__blurb">${esc(ch.blurb)}</p>
          <span class="chcard__go">Read ${icon("arrow-right", { size: 14 })}</span>
        </div>
      </a>`,
    )
    .join("\n        ");

  const body = `    <section class="section section--tight">
      ${sectionHead("The journey", "My life, chapter by chapter")}
      <p class="prose rv">Read them in order, or dip into whichever one you want. Every chapter is built from real photographs and real videos.</p>
    </section>

    <section class="section--tight">
      <div class="chgrid">
        ${cards}
      </div>
    </section>

    <section class="section">
      <div class="note rv">${icon("info", { size: 18 })}<p>Nothing on these pages is invented. Names come from the photographs, and every claim traces back to something in the album.</p></div>
    </section>`;

  return at(1, () => body, {
    title: "The Journey",
    description: "Seven chapters from Mercy's life, told with real photographs and real videos.",
    current: "/journey/",
  });
}

/* --- Story chapter ---------------------------------------------------- */
function chapter(ch) {
  setDepth(2);
  const i = chapters.findIndex((c) => c.slug === ch.slug);
  const prev = chapters[i - 1];
  const next = chapters[i + 1];

  const blocks = ch.blocks
    .map((b) => {
      switch (b.type) {
        case "aphorism":
          return `<div class="rv">${aphorism(b.text)}</div>`;
        case "prose":
          return `<div class="rv">${prose(b.text)}</div>`;
        case "figure":
          return `<div class="rv">${figure(P(b.photo), { caption: b.caption || "", ratio: b.size === "square" ? "1/1" : b.size === "half" ? "4/5" : "3/2", sizes: b.size === "wide" ? "(max-width: 720px) 92vw, 700px" : "(max-width: 720px) 60vw, 340px" })}</div>`;
        case "pair":
        case "trio":
          return `<div class="rv">${strip(b.photos, { captions: b.captions })}</div>`;
        case "video":
          return `<div class="rv">${videoCard(b.video, { inline: true })}</div>`;
        case "wishBox":
          return `<div class="rv">${wishBox(b.prompt, { text: wishPrompts[5] })}</div>`;
        default:
          return "";
      }
    })
    .join("\n        ");

  const nav = `<nav class="chap__nav" aria-label="Chapter">
        ${
          prev
            ? `<a class="chap__navlink" href="../${prev.slug}/"><span>${icon("arrow-left", { size: 15 })} Previous</span><b>${esc(prev.nav)}</b></a>`
            : `<a class="chap__navlink" href="../../journey/"><span>${icon("arrow-left", { size: 15 })} All chapters</span><b>The Journey</b></a>`
        }
        ${
          next
            ? `<a class="chap__navlink chap__navlink--next" href="../${next.slug}/"><span>Next ${icon("arrow-right", { size: 15 })}</span><b>${esc(next.nav)}</b></a>`
            : `<a class="chap__navlink chap__navlink--next" href="../../birthday/"><span>Next ${icon("arrow-right", { size: 15 })}</span><b>Birthday</b></a>`
        }
      </nav>`;

  const body = `    <section class="section section--tight">
      <div class="chap__hero">
        <div class="chap__media">${picture(C(ch.cover), { ratio: "4/3", eager: true, lightbox: false, sizes: "(max-width: 860px) 92vw, 44vw" })}</div>
        <div class="chap__head">
          <p class="chap__num">Chapter ${ch.number}</p>
          <h1 class="chap__title">${esc(ch.title)}</h1>
          <p class="chap__intro">${esc(ch.intro)}</p>
        </div>
      </div>

      <div class="chap__body">
        ${blocks}
      </div>

      ${nav}
    </section>`;

  return at(2, () => body, {
    title: ch.title,
    description: `${ch.title} - ${ch.intro} Chapter ${ch.number} of Mercy's life story.`,
    current: "/journey/",
  });
}

/* --- Memory room ------------------------------------------------------ */
function memories() {
  setDepth(1);
  const counts = {};
  photos.forEach((p) => { counts[p.group] = (counts[p.group] || 0) + 1; });

  const grid = photos
    .map(
      (p) => `<figure class="shot mitem rv" data-group="${p.group}">
        ${picture(P(p.id), { ratio: "3/4", sizes: "(max-width: 600px) 46vw, (max-width: 860px) 30vw, 22vw" })}
        <figcaption class="shot__cap">${esc(p.caption)}</figcaption>
      </figure>`,
    )
    .join("\n        ");

  const chips = photoGroups
    .map(
      (g) => `<button class="chip" type="button" data-filter="${g.id}" aria-pressed="${g.id === "all"}">${esc(g.label)}${g.id !== "all" ? `<span class="chip__n">${counts[g.id] || 0}</span>` : ""}</button>`,
    )
    .join("\n          ");

  const vids = videos.map((v) => `<div class="rv">${videoCard(v.id)}</div>`).join("\n        ");

  const body = `    <section class="section section--tight">
      ${sectionHead("Memory room", "Every photograph")}
      <p class="prose rv">All ${photos.length} photographs, grouped by the part of the story they belong to. Tap any one to see it full size.</p>
    </section>

    <div class="filters">
        <div class="filters__row" role="group" aria-label="Filter photographs">
          ${chips}
        </div>
      </div>

    <section class="section--tight">
      <div class="mgrid">
        ${grid}
      </div>
      <p class="mempty" data-empty>No photographs in this group.</p>
      <p class="mcount" data-count>Showing <b>${photos.length}</b> of ${photos.length} photographs</p>
    </section>

    <section class="section">
      ${sectionHead("Videos", "Moving moments")}
      <p class="prose rv">Nothing downloads until you press play. Each video starts from its poster frame.</p>
      <div class="stack" style="margin-top:var(--s-5)">
        ${vids}
      </div>
    </section>`;

  return at(1, () => body, {
    title: "Memory Room",
    description: `All ${photos.length} photographs and ${videos.length} videos from Mercy's life, in one room.`,
    current: "/memories/",
  });
}

/* --- Birthday --------------------------------------------------------- */
function birthday() {
  setDepth(1);
  const body = `    <section class="section bday">
      <p class="hero__eyebrow" style="justify-content:center">${icon("balloon", { size: 15 })} ${esc(celebration.kicker)}</p>
      <h1 class="hero__title" style="text-align:center;margin-top:var(--s-4)">
        Happy Birthday,<em>Mercy.</em>
      </h1>
      <p class="prose" style="margin-top:var(--s-4)">${esc(celebration.lead)}</p>

      <div style="margin-top:var(--s-6)">
        <button class="cake" type="button" data-cake aria-label="${esc(celebration.candleLabel)}">
          <svg viewBox="0 0 240 200" role="img" aria-label="A birthday cake with lit candles">
            <ellipse cx="120" cy="182" rx="78" ry="10" fill="rgba(0,0,0,.35)"/>
            <rect x="42" y="112" width="156" height="62" rx="12" fill="#F75FA5"/>
            <path d="M42 138c14 10 30 10 44 0s28-10 42 0 28 10 42 0 28-10 28-10v14c-14 10-30 10-42 0s-28-10-42 0-30 10-44 0-28-10-28-10z" fill="#FFC2DD" opacity=".85"/>
            <rect x="52" y="82" width="136" height="34" rx="10" fill="#FFE1EF"/>
            <path d="M52 100c12 8 26 8 38 0s24-8 36 0 24 8 36 0 26-8 26-8v6c-12 8-26 8-38 0s-24-8-36 0-26 8-38 0-26-8-24-6z" fill="#E83E8C" opacity=".55"/>
            <g class="cake__flame">
              <g transform="translate(84 78)"><rect x="-3" y="-16" width="6" height="18" rx="3" fill="#6FA8FF"/><ellipse cx="0" cy="-24" rx="7" ry="12" fill="#F8DDB0"/><ellipse cx="0" cy="-21" rx="3.4" ry="6" fill="#FFF"/></g>
              <g transform="translate(120 78)"><rect x="-3" y="-16" width="6" height="18" rx="3" fill="#6FA8FF"/><ellipse cx="0" cy="-24" rx="7" ry="12" fill="#F8DDB0"/><ellipse cx="0" cy="-21" rx="3.4" ry="6" fill="#FFF"/></g>
              <g transform="translate(156 78)"><rect x="-3" y="-16" width="6" height="18" rx="3" fill="#6FA8FF"/><ellipse cx="0" cy="-24" rx="7" ry="12" fill="#F8DDB0"/><ellipse cx="0" cy="-21" rx="3.4" ry="6" fill="#FFF"/></g>
            </g>
          </svg>
        </button>
        <p class="prose" style="margin-top:var(--s-3);font-size:var(--t-sm)">${esc(celebration.candleNote)}</p>
      </div>

      <div class="songbox" style="margin-top:var(--s-6)">
        <span class="songbox__meta">
          <span class="songbox__t">${esc(celebration.songTitle)}</span>
          <span class="songbox__n">${esc(celebration.songNote)}</span>
        </span>
        <button class="btn btn--primary" type="button" data-song aria-pressed="false">
          ${icon("music", { size: 18 })}<span data-song-label>Play the birthday song</span>
        </button>
      </div>

      <div class="btnrow" style="margin-top:var(--s-5)">
        <button class="btn" type="button" data-confetti>${icon("sparkles", { size: 18 })}<span>${esc(celebration.confetti)}</span></button>
        <button class="btn" type="button" data-share>${icon("share", { size: 18 })}<span>Share the surprise</span></button>
      </div>
    </section>

    <section class="section section--tight">
      ${sectionHead("A few more", "Today, in pictures")}
      ${strip(["me-currently", "my-picture-1", "i-and-my-lovely-friends", "sister-elizabeth"], { cls: "rv" })}
    </section>

    <section class="section section--tight">
      <div class="ribbon rv">
        <span>Joy</span><span>Peace</span><span>Health</span><span>Grace</span><span>Love</span>
      </div>
      <div class="btnrow" style="margin-top:var(--s-5)">
        <a class="btn btn--wa" href="${waLink(wishPrompts[0])}" target="_blank" rel="noopener">${icon("whatsapp", { size: 18 })}<span>Send a wish</span></a>
        <a class="btn" href="../gifts/">${icon("gift", { size: 18 })}<span>Gift ideas</span></a>
      </div>
    </section>`;

  return at(1, () => body, {
    title: "Happy Birthday",
    description: "A birthday celebration page for Mercy, with a birthday song and wishes.",
    current: "/birthday/",
    ogImage: "img/me-currently-852.jpg",
  });
}

/* --- Wishes ----------------------------------------------------------- */
function wishes() {
  setDepth(1);
  const cards = wishPrompts
    .map(
      (w) => `<a class="card rv" href="${waLink(w)}" target="_blank" rel="noopener">
        <p style="font-size:var(--t-base);line-height:1.55">${esc(w)}</p>
        <span class="chcard__go" style="margin-top:.7rem">Send on WhatsApp ${icon("arrow-up-right", { size: 14 })}</span>
      </a>`,
    )
    .join("\n        ");

  const body = `    <section class="section section--tight">
      ${sectionHead("Wishes", "Say something to Mercy")}
      <p class="prose rv">Pick a wish and it opens in WhatsApp, ready to send. Or write your own from scratch.</p>
    </section>

    <section class="section--tight">
      <div class="lgrid">
        ${cards}
      </div>
    </section>

    <section class="section">
      ${sectionHead("Write your own", "Start from blank")}
      <div class="rows">
        <a class="row" href="${waLink("Happy birthday Mercy! ")}" target="_blank" rel="noopener">
          <span class="row__ico">${icon("whatsapp", { size: 19 })}</span>
          <span class="row__t"><b>Open a blank message</b><span>WhatsApp &middot; ${esc(contact.whatsappDisplay)}</span></span>
          <span class="row__go">${icon("arrow-up-right", { size: 18 })}</span>
        </a>
        <a class="row" href="tel:${contact.phoneHref}">
          <span class="row__ico">${icon("phone", { size: 19 })}</span>
          <span class="row__t"><b>Call Mercy</b><span>${esc(contact.phoneDisplay)}</span></span>
          <span class="row__go">${icon("arrow-up-right", { size: 18 })}</span>
        </a>
      </div>
      <div class="note" style="margin-top:var(--s-4);max-width:460px;margin-inline:auto">${icon("info", { size: 18 })}<p>Wishes are delivered by you, from your own WhatsApp. Nothing is stored on this site.</p></div>
    </section>`;

  return at(1, () => body, {
    title: "Wishes",
    description: "Send Mercy a birthday wish on WhatsApp.",
    current: "/wishes/",
  });
}

/* --- Gifts ------------------------------------------------------------
   No payment or delivery details exist for this project, so none are
   invented here. The page offers only real, actionable options. */
function gifts() {
  setDepth(1);
  const body = `    <section class="section section--tight">
      ${sectionHead("Gifts", "Ways to celebrate")}
      <p class="prose rv">There is no payment link or delivery address for this gift, so this page does not pretend there is one. Here is what genuinely helps.</p>
    </section>

    <section class="section--tight">
      <div class="rows">
        <a class="row" href="${waLink("Happy birthday Mercy! I have a gift idea for you: ")}" target="_blank" rel="noopener">
          <span class="row__ico">${icon("whatsapp", { size: 19 })}</span>
          <span class="row__t"><b>Send a gift directly on WhatsApp</b><span>Talk to Mercy about what she would love</span></span>
          <span class="row__go">${icon("arrow-up-right", { size: 18 })}</span>
        </a>
        <a class="row" href="${waLink("Happy birthday Mercy! Here is a little something for you: ")}" target="_blank" rel="noopener">
          <span class="row__ico">${icon("gift", { size: 19 })}</span>
          <span class="row__t"><b>Send a mobile top-up</b><span>A simple, instant gift via Mobile Money</span></span>
          <span class="row__go">${icon("arrow-up-right", { size: 18 })}</span>
        </a>
        <a class="row" href="tel:${contact.phoneHref}">
          <span class="row__ico">${icon("phone", { size: 19 })}</span>
          <span class="row__t"><b>Call Mercy</b><span>${esc(contact.phoneDisplay)}</span></span>
          <span class="row__go">${icon("arrow-up-right", { size: 18 })}</span>
        </a>
        <a class="row" href="../wishes/">
          <span class="row__ico">${icon("heart", { size: 19 })}</span>
          <span class="row__t"><b>A wish costs nothing</b><span>And sometimes means the most</span></span>
          <span class="row__go">${icon("arrow-right", { size: 18 })}</span>
        </a>
      </div>

      <div class="note" style="margin-top:var(--s-5);max-width:460px;margin-inline:auto">${icon("info", { size: 18 })}<p>If a payment or delivery detail is added later, it belongs in <code>tools/content.mjs</code> so it stays accurate and in one place.</p></div>
    </section>`;

  return at(1, () => body, {
    title: "Gift Ideas",
    description: "Ways to celebrate Mercy's birthday.",
    current: "/gifts/",
  });
}

/* --- Creator ---------------------------------------------------------- */
function creatorPage() {
  setDepth(1);
  const body = `    <section class="section section--tight">
      ${sectionHead(creator.kicker, creator.subtitle)}
      <p class="prose rv">This site was built by hand for one person, using only her own photographs and videos.</p>
    </section>

    <section class="section--tight">
      <div class="card rv" style="max-width:460px;margin-inline:auto;text-align:center">
        <img class="creator__photo" src="${asset(creator.photo)}" alt="Robert the Web Creator, who created this website for Mercy" width="176" height="176" loading="eager" decoding="async">
        <h2 style="font-size:var(--t-lg)">${esc(creator.name)}</h2>
        <p style="color:var(--rose-300);font-size:var(--t-sm);margin-top:.2rem">${esc(creator.role)}</p>
      </div>
    </section>

    <section class="section section--tight">
      <p class="prose rv creator__invite">Need a website like this? Chat with Robert on WhatsApp or call to discuss your project.</p>
      <div class="rows">
        <a class="row" href="https://wa.me/${creator.whatsappNumber}" target="_blank" rel="noopener">
          <span class="row__ico">${icon("whatsapp", { size: 19 })}</span>
          <span class="row__t"><b>WhatsApp the creator</b><span>${esc(creator.whatsappDisplay)}</span></span>
          <span class="row__go">${icon("arrow-up-right", { size: 18 })}</span>
        </a>
        <a class="row" href="tel:+${creator.whatsappNumber}">
          <span class="row__ico">${icon("phone", { size: 19 })}</span>
          <span class="row__t"><b>Call the creator</b><span>${esc(creator.whatsappDisplay)}</span></span>
          <span class="row__go">${icon("arrow-up-right", { size: 18 })}</span>
        </a>
        <a class="row" href="../wishes/">
          <span class="row__ico">${icon("heart", { size: 19 })}</span>
          <span class="row__t"><b>Send a wish to Mercy</b><span>${esc(contact.whatsappDisplay)}</span></span>
          <span class="row__go">${icon("arrow-right", { size: 18 })}</span>
        </a>
      </div>
    </section>

    <section class="section">
      ${sectionHead("How it was made", "Under the hood")}
      <div class="note rv">${icon("info", { size: 18 })}<p>A dependency-free static site. Photographs are served as responsive WebP, videos load only on request, and everything works offline once opened. No accounts, no tracking, no data collection.</p></div>
    </section>`;

  return at(1, () => body, {
    title: "Creator",
    description: `${creator.name} - ${creator.role}. ${creator.kicker}.`,
    current: "/creator/",
  });
}

/* --- 404 -------------------------------------------------------------- */
function notFound() {
  setDepth(0);
  const body = `    <section class="section bday">
      <p class="hero__eyebrow" style="justify-content:center">${icon("compass", { size: 15 })} Page not found</p>
      <h1 class="hero__title" style="text-align:center;margin-top:var(--s-4)">This page<br><em>does not exist.</em></h1>
      <p class="prose" style="margin-top:var(--s-4)">But the story is still here.</p>
      <div class="btnrow" style="margin-top:var(--s-5)">
        <a class="btn btn--primary" href="./">${icon("home", { size: 18 })}<span>Back home</span></a>
        <a class="btn" href="./journey/">${icon("compass", { size: 18 })}<span>The journey</span></a>
      </div>
    </section>`;

  return at(0, () => body, {
    title: "Page not found",
    description: "This page does not exist, but the story is still here.",
    current: "",
  });
}

/* ------------------------------------------------------------------ build */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

write("index.html", home());
write("journey/index.html", journey());
chapters.forEach((ch) => write(`story/${ch.slug}/index.html`, chapter(ch)));
write("memories/index.html", memories());
write("birthday/index.html", birthday());
write("wishes/index.html", wishes());
write("gifts/index.html", gifts());
write("creator/index.html", creatorPage());
write("404.html", notFound());

/* assets -------------------------------------------------------------- */
cpSync(path.join(ROOT, "img"), path.join(OUT, "img"), { recursive: true });
cpSync(path.join(ROOT, "videos"), path.join(OUT, "videos"), { recursive: true });
cpSync(path.join(ROOT, "styles"), path.join(OUT, "styles"), { recursive: true });
cpSync(path.join(ROOT, "scripts"), path.join(OUT, "scripts"), { recursive: true });
cpSync(path.join(ROOT, "icons"), path.join(OUT, "icons"), { recursive: true });

/* manifest ------------------------------------------------------------ */
const manifest = {
  name: site.name,
  short_name: site.shortName,
  description: site.description,
  start_url: "./",
  scope: "./",
  display: "standalone",
  orientation: "portrait",
  background_color: site.backgroundColor,
  theme_color: site.themeColor,
  lang: "en",
  dir: "ltr",
  categories: ["lifestyle", "photo"],
  icons: [
    { src: "icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    { src: "icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    { src: "icons/app-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icons/app-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "icons/app-icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: "icons/app-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
  shortcuts: [
    { name: "Memory Room", url: "./memories/", icons: [{ src: "icons/app-icon-192.png", sizes: "192x192" }] },
    { name: "Birthday", url: "./birthday/", icons: [{ src: "icons/app-icon-192.png", sizes: "192x192" }] },
    { name: "Send a wish", url: "./wishes/", icons: [{ src: "icons/app-icon-192.png", sizes: "192x192" }] },
  ],
};
write("manifest.webmanifest", JSON.stringify(manifest, null, 2));

/* service worker ------------------------------------------------------
   Shell only. Media is intentionally left to the browser cache so a
   first visit never pulls down 30 MB of photographs and video. */
const sw = `/* Generated by tools/build.mjs - do not edit by hand. */
const CACHE = "mercy-birthday-v9";
const SHELL = [
  "./", "./index.html",
  "./journey/index.html",
${chapters.map((c) => `  "./story/${c.slug}/index.html",`).join("\n")}
  "./memories/index.html",
  "./birthday/index.html",
  "./wishes/index.html",
  "./gifts/index.html",
  "./creator/index.html",
  "./manifest.webmanifest",
  "./styles/app.css",
  "./scripts/app.js",
  "./icons/favicon-32.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network-first for pages and code assets so edits show up after refresh. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const isCode = /\\.(css|js)$/i.test(url.pathname);
  if (isCode) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  const isAsset = /\\.(png|webp|jpg|svg|woff2?)$/i.test(url.pathname);

  /* Videos are deliberately never cached: they are 33MB in total and would
     blow up a phone's storage quota on the first visit. They are also never
     requested until the visitor presses play, so this is only a safety net. */
  if (/\\.(mp4|webm|mov|m4v)$/i.test(url.pathname)) return;

  if (isAsset) {
    e.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
      )
    );
    return;
  }

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
`;
write("sw.js", sw);

/* robots -------------------------------------------------------------- */
write("robots.txt", "User-agent: *\nAllow: /\n");

/* report -------------------------------------------------------------- */
const total = written.reduce((n, w) => n + w.size, 0);
console.log("\nBuilt " + written.length + " files (" + Math.round(total / 1024) + " KB of HTML/JS/CSS/JSON)");
written.forEach((w) => console.log("  " + w.rel.padEnd(34) + String(Math.round(w.size / 1024)).padStart(5) + " KB"));
console.log("\nMedia: " + photos.length + " photographs, " + videos.length + " videos, " + chapters.length + " chapters");
console.log("Output: " + OUT + "\n");

