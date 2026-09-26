/**
 * One consistent icon family, authored on a 24x24 grid with a 1.75px stroke,
 * round caps and round joins. Used everywhere - nav, buttons, cards, labels.
 * No emoji, no mixed icon libraries, no icon font.
 *
 * icon()   -> standalone inline <svg>
 * sprite() -> hidden symbol sheet injected once per page
 */
const s = (body) => body;

export const icons = {
  /* --- navigation --- */
  home: s('<path d="M3.2 10.4 12 3.2l8.8 7.2"/><path d="M5.4 9.3V19a1.6 1.6 0 0 0 1.6 1.6h3.4v-5.2a1.6 1.6 0 0 1 1.6-1.6h1.9a1.6 1.6 0 0 1 1.6 1.6v5.2H17a1.6 1.6 0 0 0 1.6-1.6V9.3"/>'),
  compass: s('<circle cx="12" cy="12" r="8.8"/><path d="m15.4 8.6-2 4.8-4.8 2 2-4.8z"/>'),
  images: s('<rect x="3.2" y="4.4" width="17.6" height="15.2" rx="2.4"/><circle cx="8.6" cy="9.6" r="1.7"/><path d="m20.8 15.4-4.2-4.1a1.8 1.8 0 0 0-2.5 0L4.6 19.6"/>'),
  cake: s('<path d="M4 13.4h16"/><path d="M4.6 13.4v5.2a1.8 1.8 0 0 0 1.8 1.8h11.2a1.8 1.8 0 0 0 1.8-1.8v-5.2"/><path d="M3 10.2h18"/><path d="M7 10.2V7.6M12 10.2V7.6M17 10.2V7.6"/><path d="M7 5.6c.9-.7.9-1.5 0-2.2-.9.7-.9 1.5 0 2.2ZM12 5.6c.9-.7.9-1.5 0-2.2-.9.7-.9 1.5 0 2.2ZM17 5.6c.9-.7.9-1.5 0-2.2-.9.7-.9 1.5 0 2.2Z"/>'),
  menu: s('<path d="M4 7h16M4 12h16M4 17h10"/>'),
  close: s('<path d="m6 6 12 12M18 6 6 18"/>'),
  "arrow-left": s('<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>'),
  "arrow-right": s('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
  "chevron-left": s('<path d="m14.5 5-7 7 7 7"/>'),
  "chevron-right": s('<path d="m9.5 5 7 7-7 7"/>'),
  "chevron-down": s('<path d="m5 9 7 7 7-7"/>'),
  "arrow-up-right": s('<path d="M7 17 17 7"/><path d="M8.4 7H17v8.6"/>'),
  "arrow-up": s('<path d="M12 20V4"/><path d="m6 10 6-6 6 6"/>'),

  /* --- media --- */
  play: s('<path d="M7.5 4.9 19 12 7.5 19.1z"/>'),
  pause: s('<path d="M9 5v14M15 5v14"/>'),
  music: s('<path d="M9 18V5.6l10-2v12"/><circle cx="6.4" cy="18" r="2.6"/><circle cx="16.4" cy="15.6" r="2.6"/>'),
  image: s('<rect x="3.2" y="4.4" width="17.6" height="15.2" rx="2.4"/><circle cx="8.8" cy="9.8" r="1.7"/><path d="m4 16.4 4.4-4.2a1.8 1.8 0 0 1 2.5 0l4.2 4.1 2-1.9a1.8 1.8 0 0 1 2.5 0l1.6 1.5"/>'),
  video: s('<rect x="2.6" y="5.4" width="13" height="13.2" rx="2.4"/><path d="m15.6 10.4 4.2-2.7a1 1 0 0 1 1.6.8v6.9a1 1 0 0 1-1.6.8l-4.2-2.7z"/>'),
  camera: s('<path d="M3.2 8.6h3l1.8-2.8h8l1.8 2.8h3a1 1 0 0 1 1 1v8.4a1 1 0 0 1-1 1H3.2a1 1 0 0 1-1-1V9.6a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.4" r="3.4"/>'),

  /* --- actions --- */
  share: s('<circle cx="17.6" cy="5.8" r="2.6"/><circle cx="6.4" cy="12" r="2.6"/><circle cx="17.6" cy="18.2" r="2.6"/><path d="m8.7 10.7 6.6-3.6M8.7 13.3l6.6 3.6"/>'),
  whatsapp: s('<path d="M3.6 20.4 5 16.2A8 8 0 1 1 8 19.1z"/><path d="M9 9.2c.3 2.4 3.2 5.3 5.6 5.6l1-1.3 1.9.9c-.2.9-.9 1.4-1.7 1.4-3 0-6.9-3.9-6.9-6.9 0-.8.5-1.5 1.4-1.7l.9 1.9z" fill="currentColor" stroke="none"/>'),
  phone: s('<path d="M6.4 3.6h3l1.6 4-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 4 1.6v3a1.8 1.8 0 0 1-2 1.8A16.4 16.4 0 0 1 4.6 5.6a1.8 1.8 0 0 1 1.8-2Z"/>'),
  gift: s('<path d="M3.4 10.4h17.2v3.2H3.4z"/><path d="M4.8 13.6h14.4v6a1.4 1.4 0 0 1-1.4 1.4H6.2a1.4 1.4 0 0 1-1.4-1.4z"/><path d="M12 10.4v10.6"/><path d="M12 10.4S10.8 5.4 8.4 5.4a2.1 2.1 0 0 0 0 5ZM12 10.4s1.2-5 3.6-5a2.1 2.1 0 0 1 0 5Z"/>'),
  heart: s('<path d="M12 20s-7.6-4.4-7.6-9.4A4.2 4.2 0 0 1 12 8.2a4.2 4.2 0 0 1 7.6 2.4C19.6 15.6 12 20 12 20Z"/>'),
  copy: s('<rect x="8.6" y="8.6" width="11.8" height="11.8" rx="2.2"/><path d="M15.4 5.6H6.2a2.2 2.2 0 0 0-2.2 2.2v9.2"/>'),
  check: s('<path d="m4.8 12.6 4.6 4.6L19.2 7.4"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>'),
  user: s('<circle cx="12" cy="8.4" r="3.9"/><path d="M4.8 20.4a7.2 7.2 0 0 1 14.4 0"/>'),
  mail: s('<rect x="2.8" y="5" width="18.4" height="14" rx="2.4"/><path d="m3.4 7 8.6 6 8.6-6"/>'),

  /* --- story + decoration --- */
  sparkle: s('<path d="M12 3.2 13.7 9l5.8 1.7-5.8 1.7L12 18.2l-1.7-5.8L4.5 10.7 10.3 9z"/><path d="M18.6 3.4 19.3 5.6l2.2.7-2.2.7-.7 2.2-.7-2.2-2.2-.7 2.2-.7z"/>'),
  star: s('<path d="m12 3.6 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 10l6-.9z"/>'),
  quote: s('<path d="M9.4 6.4C6.6 7.8 5 10.2 5 13.4v4.2h4.6v-4.6H7.4c0-2 .8-3.4 2.6-4.2z"/><path d="M18.4 6.4c-2.8 1.4-4.4 3.8-4.4 7v4.2h4.6v-4.6h-2.2c0-2 .8-3.4 2.6-4.2z"/>'),
  book: s('<path d="M4 4.6h5.6A2.8 2.8 0 0 1 12 7v13a2.2 2.2 0 0 0-2.2-1.6H4z"/><path d="M20 4.6h-5.6A2.8 2.8 0 0 0 12 7v13a2.2 2.2 0 0 1 2.2-1.6H20z"/>'),
  target: s('<circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2"/>'),
  sun: s('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.8v2.2M12 19v2.2M4.5 4.5l1.6 1.6M17.9 17.9l1.6 1.6M2.8 12H5M19 12h2.2M4.5 19.5l1.6-1.6M17.9 6.1l1.6-1.6"/>'),
  balloon: s('<path d="M12 3.4c3 0 5.4 2.5 5.4 5.6 0 3.3-2.6 5.4-4.3 6.6h-2.2C9.2 14.4 6.6 12.3 6.6 9c0-3.1 2.4-5.6 5.4-5.6Z"/><path d="M10.6 15.6h2.8l-1.4 2.2z"/><path d="M12 17.8v3"/>'),
  sparkles: s('<path d="M9 4 10.2 8 14 9.2 10.2 10.4 9 14.4 7.8 10.4 4 9.2 7.8 8z"/><path d="M17 12.6 17.9 15.4l2.8.9-2.8.9-.9 2.8-.9-2.8-2.8-.9 2.8-.9z"/>'),
  external: s('<path d="M14 4.6h5.4V10"/><path d="M19.4 4.6 11 13"/><path d="M18.4 14v4.8a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 18.8V7.2A1.6 1.6 0 0 1 5.6 5.6h4.8"/>'),
  info: s('<circle cx="12" cy="12" r="8.8"/><path d="M12 11v5.4"/><path d="M12 7.8h.01"/>'),
};

/** Standalone inline SVG for a single icon. */
export const icon = (name, { size = 20, cls = "" } = {}) =>
  `<svg class="ic${cls ? " " + cls : ""}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name] || ""}</svg>`;

/** Hidden symbol sheet injected once per page. */
export const sprite = () =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="sprite" aria-hidden="true" focusable="false"><defs>${Object.entries(
    icons,
  )
    .map(
      ([name, body]) =>
        `<symbol id="i-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</symbol>`,
    )
    .join("")}</defs></svg>`;
