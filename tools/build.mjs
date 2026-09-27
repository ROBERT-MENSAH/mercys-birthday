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

import { site, contact, creator, photos, photoGroups, videos, bibleVerses, momo } from "./content.mjs";
import { chapters, wishPrompts, celebration, personalMessage } from "./story.mjs";
import { media, cover, problems } from "./media.mjs";
import { icon } from "./iconsprite.mjs";
import { page, esc, picture, figure, strip, videoCard, wishBox, installCard, installBar, aphorism, prose, sectionHead, base, rel, setDepth, asset, NAV } from "./templates.mjs";
import { renderSong } from "./song-audio.mjs";

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
    { p: P("my-childhood-picture"), to: "story/childhood/", cap: "Where Her Story Began", num: "01" },
    { p: P("i-and-my-lovely-friends"), to: "story/people/", cap: "The People Who Shaped Her", num: "03" },
    { p: P("me-currently"), to: "story/today/", cap: "Who She Is Today", num: "06" },
  ];

  const body = `    <section class="section section--tight">
      ${installBar({ cls: "rv" })}
    </section>

    <section class="hero">
      <div class="hero__grid">
        <div>
          <p class="hero__eyebrow">${icon("sparkles", { size: 15 })} A birthday for Mercy</p>
          <h1 class="hero__title">Happy Birthday,<em>Mercy.</em></h1>
          <p class="hero__lead">${site.description}</p>
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
      ${sectionHead("The chapters", "Mercy's life, chapter by chapter")}
      <p class="prose rv">Seven chapters, told in order, from the very first photograph to the future she is still working towards.</p>
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
      ${strip(["me-currently", "my-favourate-picture", "my-picture-1", "years-back"], { cls: "rv", captions: ["Mercy, as she is today.", "One of Mercy's favourite pictures.", "Mercy out in the sunshine.", "Mercy some years back."] })}
      <div class="btnrow" style="margin-top:var(--s-5)">
        <a class="btn btn--primary" href="birthday/">${icon("cake", { size: 18 })}<span>Go to the celebration</span></a>
      </div>
    </section>

    <section class="section section--tight">
      ${sectionHead(bibleVerses.kicker, bibleVerses.title)}
      <p class="prose rv">${esc(bibleVerses.lead)}</p>

      <figure class="vmain rv">
        <p class="vmain__label">${icon("book", { size: 15 })} ${esc(bibleVerses.main.label)}</p>
        <blockquote class="vmain__text">${esc(bibleVerses.main.text)}</blockquote>
        <figcaption class="vmain__ref">${esc(bibleVerses.main.ref)}</figcaption>
      </figure>

      <div class="vmore rv">
        <p class="vmore__label" id="vmore-label">${esc(bibleVerses.moreLabel)}</p>
        <button class="vmore__toggle" type="button" data-vtoggle aria-pressed="false"
                aria-describedby="vmore-label">
          ${icon("pause", { size: 14 })}<span data-vtoggle-label>Pause</span>
        </button>
      </div>
      <div class="vrail" data-vrail>
        <ul class="vrail__track">
          ${bibleVerses.more
            .map(
              (v) => `<li class="vitem">
            <p class="vitem__text">${esc(v.text)}</p>
            <p class="vitem__ref">${esc(v.ref)}</p>
          </li>`,
            )
            .join("\n          ")}
        </ul>
        <ul class="vrail__track" aria-hidden="true">
          ${bibleVerses.more
            .map(
              (v) => `<li class="vitem">
            <p class="vitem__text">${esc(v.text)}</p>
            <p class="vitem__ref">${esc(v.ref)}</p>
          </li>`,
            )
            .join("\n          ")}
        </ul>
      </div>
      <p class="vnote rv">Bible text: ${esc(bibleVerses.translation)}.</p>
    </section>

    <section class="section section--tight">
      <div class="giftbox rv">
        <div class="giftbox__head">${icon("gift", { size: 20 })}<h3>Send a gift</h3></div>
        <p class="giftbox__note">The easiest way to send Mercy something is ${esc(momo.network)}.</p>
        <p class="giftbox__num">${esc(momo.numberDisplay)}</p>
        <div class="btnrow" style="margin-top:var(--s-4)">
          <a class="btn btn--primary" href="gifts/">${icon("gift", { size: 18 })}<span>See how to send it</span></a>
          <button class="btn" type="button" data-copy="${esc(momo.numberDial)}">
            ${icon("copy", { size: 18 })}<span data-copy-label>Copy number</span>
          </button>
        </div>
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
      ${sectionHead("The journey", "Mercy's life, chapter by chapter")}
      <p class="prose rv">Read them in order, or dip into whichever one you want. Every chapter is built from real photographs and real videos.</p>
    </section>

    <section class="section--tight">
      <div class="chgrid">
        ${cards}
      </div>
    </section>

    <section class="section">
      <div class="note rv">${icon("info", { size: 18 })}<p>Names here come from the photographs, and anything Robert was not sure about, he left out.</p></div>
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
          return `<div class="rv">${videoCard(b.video, { inline: true, ratio: b.ratio })}</div>`;
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
      <p class="prose rv">All ${photos.length} photographs, grouped by the part of her life they belong to. Tap any one to see it full size.</p>
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
        <button class="cake" type="button" data-cake data-label-on="${esc(celebration.candleLabel)}" data-label-off="${esc(celebration.candleLabelOut)}" aria-label="${esc(celebration.candleLabel)}">
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
        <p class="prose" data-cake-note data-note-on="${esc(celebration.candleNote)}" data-note-off="${esc(celebration.candleNoteOut)}" style="margin-top:var(--s-3);font-size:var(--t-sm)">${esc(celebration.candleNote)}</p>
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
      ${strip(["me-currently", "my-picture-1", "i-and-my-lovely-friends", "sister-elizabeth"], { cls: "rv", captions: ["Mercy, as she is today.", "Mercy out in the sunshine.", "Mercy with some of her friends.", "Mercy and her sister Elizabeth."] })}
    </section>

    <section class="section section--tight">
      ${sectionHead(personalMessage.kicker, personalMessage.title)}
      <div class="card rv" style="max-width:620px">
        ${personalMessage.paragraphs.map((t) => `<p style="font-size:var(--t-base);line-height:1.65;margin-bottom:1rem">${esc(t)}</p>`).join("\n        ")}
        <p style="font-size:var(--t-base);margin-top:1.2rem;color:var(--rose-300);font-weight:600">&mdash; ${esc(personalMessage.signoff)}</p>
      </div>
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
        <a class="row" href="../chat/">
          <span class="row__ico">${icon("quote", { size: 19 })}</span>
          <span class="row__t"><b>Leave it on the message wall</b><span>Say what she is honestly like</span></span>
          <span class="row__go">${icon("arrow-right", { size: 18 })}</span>
        </a>
      </div>
      <div class="note" style="margin-top:var(--s-4);max-width:460px;margin-inline:auto">${icon("info", { size: 18 })}<p>Wishes sent by WhatsApp are delivered by you, from your own phone. Nothing is stored on this site.</p></div>
    </section>`;

  return at(1, () => body, {
    title: "Wishes",
    description: "Send Mercy a birthday wish on WhatsApp.",
    current: "/wishes/",
  });
}

/* --- Gifts ------------------------------------------------------------
   Mobile money is the main, most practical way to send something, so it leads
   the page and is shown plainly: the network, the number in large type, and
   the short dial sequence. The number lives in content.mjs so it is changed in
   one place. No payment link is invented, and nothing here pretends to process
   a transaction - the money is sent by the visitor, from their own phone. */
function gifts() {
  setDepth(1);
  const body = `    <section class="section section--tight">
      ${sectionHead("Gifts", "Send something to Mercy")}
      <p class="prose rv">The easiest way to send Mercy a gift is Mobile Money. Copy the number below, or tap to call her if you would rather ask her first.</p>
    </section>

    <section class="section--tight">
      <div class="momo rv">
        <p class="momo__net"><span class="momo__badge">MTN MoMo</span></p>
        <p class="momo__label">Send to this number</p>
        <p class="momo__num">${esc(momo.numberDisplay)}</p>
        <div class="momo__acts">
          <button class="btn btn--primary" type="button" data-copy="${esc(momo.numberDial)}">
            ${icon("copy", { size: 18 })}<span data-copy-label>Copy number</span>
          </button>
          <a class="btn" href="${esc(momo.telHref)}">${icon("phone", { size: 18 })}<span>Call ${esc(momo.numberDisplay)}</span></a>
        </div>
        <p class="momo__net-note">Only send to ${esc(momo.network)}. Nothing on this page can take your money, so check the number before you confirm.</p>
      </div>
    </section>

    <section class="section--tight">
      <div class="momo__steps rv">
        <h2 class="momo__steps-h">How to send it</h2>
        <ol class="momo__list">
          ${momo.steps.map((s) => `<li class="momo__step">${esc(s)}</li>`).join("\n          ")}
        </ol>
      </div>
    </section>

    <section class="section section--tight">
      ${sectionHead("Other ways", "If mobile money is not for you")}
      <div class="rows">
        <a class="row" href="${waLink("Happy birthday Mercy! I have a gift idea for you: ")}" target="_blank" rel="noopener">
          <span class="row__ico">${icon("whatsapp", { size: 19 })}</span>
          <span class="row__t"><b>Send a gift directly on WhatsApp</b><span>Talk to Mercy about what she would love</span></span>
          <span class="row__go">${icon("arrow-up-right", { size: 18 })}</span>
        </a>
        <a class="row" href="tel:${contact.phoneHref}">
          <span class="row__ico">${icon("phone", { size: 19 })}</span>
          <span class="row__t"><b>Call Mercy</b><span>${esc(contact.phoneDisplay)}</span></span>
          <span class="row__go">${icon("arrow-up-right", { size: 18 })}</span>
        </a>
        <a class="row" href="../wishes/">
          <span class="row__ico">${icon("heart", { size: 19 })}</span>
          <span class="row__t"><b>Send a wish instead</b><span>It costs nothing and she will read it</span></span>
          <span class="row__go">${icon("arrow-right", { size: 18 })}</span>
        </a>
      </div>
    </section>`;

  return at(1, () => body, {
    title: "Gift Ideas",
    description: "Send Mercy a gift by MTN Mobile Money.",
    current: "/gifts/",
  });
}

/* --- Live chat ------------------------------------------------------------
   A message wall where visitors leave what Mercy is honestly like, and what
   they like most about her.

   The page is complete and interactive, but it is HONEST about its storage:
   there is no server behind this site, so messages are kept in the visitor's
   own browser. They are not visible to anyone else, and leaving one does not
   notify Mercy. The copy says so plainly rather than implying a shared feed.

   The store is an injectable driver (scripts/chat.js), so a real datastore can
   replace the local one without touching this page or the UI. */
function chat() {
  setDepth(1);
  const prompts = [
    "Happy birthday, Mercy! I hope you have a really good day.",
    "One thing I appreciate about Mercy is...",
    "One memory I have with Mercy is...",
    "I wish Mercy...",
    "May God bless Mercy with...",
    "Happy birthday, Mercy. Keep working towards your goals.",
  ];

  const body = `    <section class="section section--tight">
      ${sectionHead("Live chat", "Leave Mercy a message")}
      <p class="prose rv">Tell her what she is honestly like, and what you like most about her. Write it in your own words.</p>
    </section>

    <section class="section--tight">
      <form class="chatform rv" data-chat-form novalidate>
        <div class="chatform__row">
          <p class="field">
            <label class="field__lab" for="chat-name">Your name</label>
            <input class="field__in" id="chat-name" name="name" type="text"
                   data-chat-name maxlength="40" autocomplete="name" placeholder="e.g. Ama, or her cousin, or a friend">
          </p>
          <p class="field">
            <label class="field__lab" for="chat-relation">How you know her <span class="field__opt">(optional)</span></label>
            <input class="field__in" id="chat-relation" name="relation" type="text"
                   data-chat-relation maxlength="40" placeholder="e.g. schoolmate, sister, friend">
          </p>
        </div>
        <p class="field">
          <label class="field__lab" for="chat-text">Your message for Mercy</label>
          <textarea class="field__in field__in--area" id="chat-text" name="text" rows="5"
                    data-chat-text maxlength="600" required
                    placeholder="What she is really like, and what makes her the most likeable person you know."></textarea>
        </p>
        <p class="field__meta">
          <span class="field__count" data-chat-counter>0 / 600</span>
          <button class="btn btn--primary" type="submit" data-chat-submit>${icon("heart", { size: 18 })}<span>Post message</span></button>
        </p>
      </form>
    </section>

    <section class="section--tight">
      <div class="chathead">
        <h3 class="chathead__t">The wall</h3>
        <span class="chathead__n" data-chat-count>0 messages</span>
      </div>
      <p class="chatempty" data-chat-empty>${icon("quote", { size: 20 })}<span>No messages yet. Be the first to say something.</span></p>
      <ul class="chatwall" data-chat-wall aria-live="polite"></ul>
    </section>

    <section class="section--tight">
      ${sectionHead("Need a bigger reach", "Send it straight to her")}
      <p class="prose rv">These messages stay in your browser, so if you want Mercy to actually read yours, send it to her directly.</p>
      <div class="rows">
        <a class="row" href="${waLink("Happy birthday Mercy! ")}" target="_blank" rel="noopener">
          <span class="row__ico">${icon("whatsapp", { size: 19 })}</span>
          <span class="row__t"><b>Send your message on WhatsApp</b><span>WhatsApp &middot; ${esc(contact.whatsappDisplay)}</span></span>
          <span class="row__go">${icon("arrow-up-right", { size: 18 })}</span>
        </a>
        <a class="row" href="tel:${contact.phoneHref}">
          <span class="row__ico">${icon("phone", { size: 19 })}</span>
          <span class="row__t"><b>Call her</b><span>${esc(contact.phoneDisplay)}</span></span>
          <span class="row__go">${icon("arrow-up-right", { size: 18 })}</span>
        </a>
      </div>
      <div class="note" style="margin-top:var(--s-4);max-width:520px;margin-inline:auto">${icon("info", { size: 18 })}<p><b>How this works right now.</b> This site is a set of static pages with no server, so a message you post here is saved in this browser only. It is not sent to Mercy, and nobody else can see it. It will disappear if you clear your browser data. To make it a real shared wall, a database and a moderation step have to be added &mdash; that is the next stage, not something this page pretends to have.</p></div>
    </section>

    <section class="section">
      ${sectionHead("Stuck?", "Something honest to say")}
      <div class="lgrid">
        ${prompts
          .map(
            (t) => `<button class="card chatseed" type="button" data-chat-seed="${esc(t)}">
          <p style="font-size:var(--t-base);line-height:1.55;text-align:left">${esc(t)}</p>
        </button>`,
          )
          .join("\n        ")}
      </div>
      <p class="prose rv" style="text-align:center;margin-top:var(--s-4)">Tap one to start from, then make it your own.</p>
    </section>`;

  return at(1, () => body, {
    title: "Live Chat",
    description: "Leave Mercy an honest message - what she is really like, and what makes her the most likeable person you know.",
    current: "/chat/",
    /* Store first, then the UI that depends on MBChat. Both are defer, so
       order of execution follows document order. */
    scripts: ["chat.js", "chat-ui.js"],
  });
}

/* --- Creator ---------------------------------------------------------- */
function creatorPage() {
  setDepth(1);
  const body = `    <section class="section section--tight">
      ${sectionHead(creator.kicker, creator.subtitle)}
      <p class="prose rv">This site was built by hand for one person, using her own photographs and videos.</p>
    </section>

    <section class="section--tight">
      <div class="card rv" style="max-width:460px;margin-inline:auto;text-align:center">
        <img class="creator__photo" src="${asset(creator.photo)}" alt="Robert Mensah, who created this website for Mercy" width="176" height="176" loading="eager" decoding="async">
        <h2 style="font-size:var(--t-lg)">${esc(creator.name)}</h2>
        <p style="color:var(--rose-300);font-size:var(--t-sm);margin-top:.2rem">${esc(creator.role)}</p>
      </div>
    </section>

    <section class="section section--tight">
      <p class="prose rv creator__invite">This birthday website was put together by Robert Mensah, a friend of Mercy's.</p>
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
write("chat/index.html", chat());
write("gifts/index.html", gifts());
write("creator/index.html", creatorPage());
write("404.html", notFound());

/* assets -------------------------------------------------------------- */
cpSync(path.join(ROOT, "img"), path.join(OUT, "img"), { recursive: true });
cpSync(path.join(ROOT, "videos"), path.join(OUT, "videos"), { recursive: true });
cpSync(path.join(ROOT, "styles"), path.join(OUT, "styles"), { recursive: true });
cpSync(path.join(ROOT, "scripts"), path.join(OUT, "scripts"), { recursive: true });
cpSync(path.join(ROOT, "icons"), path.join(OUT, "icons"), { recursive: true });

/* birthday song --------------------------------------------------------- */
/* Rendered here rather than committed: it keeps a ~870 KB binary out of the
   repository and makes the file byte-for-byte reproducible on every build. */
const songWav = renderSong();
mkdirSync(path.join(OUT, "audio"), { recursive: true });
writeFileSync(path.join(OUT, "audio/happy-birthday.wav"), songWav);

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
    { name: "Live chat", url: "./chat/", icons: [{ src: "icons/app-icon-192.png", sizes: "192x192" }] },
  ],
};
write("manifest.webmanifest", JSON.stringify(manifest, null, 2));

/* service worker ------------------------------------------------------
   Shell only. Media is intentionally left to the browser cache so a
   first visit never pulls down 30 MB of photographs and video. */
const sw = `/* Generated by tools/build.mjs - do not edit by hand. */
const CACHE = "mercy-birthday-v16";
const SHELL = [
  "./", "./index.html",
  "./journey/index.html",
${chapters.map((c) => `  "./story/${c.slug}/index.html",`).join("\n")}
  "./memories/index.html",
  "./birthday/index.html",
  "./wishes/index.html",
  "./chat/index.html",
  "./gifts/index.html",
  "./creator/index.html",
  "./manifest.webmanifest",
  "./styles/app.css",
  "./scripts/app.js",
  // Only the chat page needs these, but they are tiny and it must work
  // offline like every other page does.
  "./scripts/chat.js",
  "./scripts/chat-ui.js",
  // The small icons are in the shell because the browser asks for them on the
  // very first paint. The two 512px icons are deliberately NOT here: together
  // they are 675 KB, and they are only ever read at install time, which is a
  // deliberate action on a connection that is by definition online. Precaching
  // them made every first visit pay for an app most visitors never install.
  "./icons/favicon-32.png",
  "./icons/apple-touch-icon.png",
  "./icons/app-icon-192.png",
  "./icons/app-icon-maskable-192.png"
];

/* addAll() is all-or-nothing: one 404 and the worker never installs, so the
   site silently loses offline support. Each entry is cached on its own and a
   missing icon is reported rather than fatal. */
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(SHELL.map((url) =>
        c.add(new Request(url, { cache: "reload" })).catch((err) => {
          console.warn("[sw] could not precache", url, err);
        })
      )))
      .then(() => self.skipWaiting())
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

