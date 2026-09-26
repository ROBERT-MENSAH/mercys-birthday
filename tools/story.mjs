/**
 * Mercy's Birthday - story structure and page copy.
 *
 * The story pages are written in the first person (I / my / me) because they
 * represent Mercy speaking about her own life.
 *
 * "aphorism" blocks are universal reflective lines, not claims about specific
 * memories, which keeps the voice personal without inventing anything.
 *
 * Block types:
 *   aphorism  - large reflective pull-quote
 *   prose     - a paragraph of first-person narration
 *   figure    - one photo, sized wide | half | square
 *   pair      - two photos side by side
 *   trio      - three photos side by side
 *   video     - a poster-first video player
 *   wishBox   - WhatsApp wish launcher
 */

export const chapters = [
  {
    slug: "childhood",
    number: "01",
    title: "My Childhood",
    nav: "Childhood",
    intro: "This is where my story began.",
    cover: "my-childhood-picture",
    blurb: "The very first page.",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "Every long story has a first page." },
      {
        type: "figure",
        photo: "my-childhood-picture",
        size: "wide",
        caption: "Me, as a little girl.",
      },
      {
        type: "prose",
        text: "This is the earliest picture I have of myself. Small hands, a big book, and a studio backdrop that felt enormous at the time.",
      },
      { type: "pair", photos: ["when-was-at-jhs-some-years-back", "my-picture-at-school"] },
      {
        type: "prose",
        text: "Then school. Fields, uniforms, and friends who made every ordinary day feel like a story of its own.",
      },
    ],
  },
  {
    slug: "family",
    number: "02",
    title: "My Family",
    nav: "Family",
    intro: "My father. My mother. My younger siblings.",
    cover: "picture-with-my-younger-siblings",
    blurb: "The people I come from.",
    theme: "blue",
    blocks: [
      { type: "aphorism", text: "You can tell who raised you by looking at them." },
      {
        type: "pair",
        photos: ["me-and-my-lovely-father", "me-and-my-lovely-mother"],
        captions: ["Me and my lovely father.", "Me and my lovely mother."],
      },
      {
        type: "prose",
        text: "My father. My mother. Two photographs that say more than a paragraph ever could.",
      },
      { type: "video", video: "my-lovely-mom-video" },
      {
        type: "figure",
        photo: "picture-with-my-younger-siblings",
        size: "wide",
        caption: "With my younger siblings.",
      },
      {
        type: "trio",
        photos: ["sister-cece", "sister-elizabeth", "brother-samuel"],
        captions: ["Sister Cece", "Sister Elizabeth", "Brother Samuel"],
      },
      { type: "figure", photo: "brother-kofi", size: "half", caption: "Brother Kofi." },
    ],
  },
  {
    slug: "people",
    number: "03",
    title: "People in My Life",
    nav: "People",
    intro: "Some people arrive quietly and never leave.",
    cover: "i-and-my-lovely-friends",
    blurb: "The people who stayed.",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "Some people arrive quietly and never leave." },
      {
        type: "figure",
        photo: "my-best-friend-elisha-owusu-asante",
        size: "half",
        caption: "My best friend, Elisha Owusu Asante.",
      },
      { type: "pair", photos: ["my-friend-sandra", "my-friend-rachael"] },
      {
        type: "prose",
        text: "My friend, Sandra. My friend, Rachael. My fighting partner. My favourite person and I. Different people, all of them certain.",
      },
      {
        type: "figure",
        photo: "i-and-my-lovely-friends",
        size: "wide",
        caption: "I and my lovely friends.",
      },
      { type: "pair", photos: ["me-with-my-friends-2", "my-favorite-person-and-i"] },
      { type: "video", video: "happy-moment-with-friends" },
      { type: "video", video: "my-family-and-friends" },
    ],
  },
  {
    slug: "faith",
    number: "04",
    title: "My Faith",
    nav: "Faith",
    intro: "There are moments that words cannot carry.",
    cover: "me-worshiping-at-church",
    blurb: "Where the words stop.",
    theme: "blue",
    blocks: [
      { type: "aphorism", text: "There are moments that words cannot carry." },
      { type: "video", video: "me-worshiping-at-church" },
      {
        type: "prose",
        text: "This is me worshipping. No camera, no audience, no explanation needed.",
      },
      {
        type: "figure",
        photo: "pastor-paul-oteng-asamoah-and-mama-agartha-asamoah",
        size: "wide",
        caption: "Pastor Paul Oteng Asamoah and Mama Agartha Asamoah.",
      },
    ],
  },
  {
    slug: "music",
    number: "05",
    title: "My Music",
    nav: "Music",
    intro: "Some things only come out when you sing them.",
    cover: "my-studio-song",
    blurb: "Where my voice lives.",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "Some things only come out when you sing them." },
      {
        type: "figure",
        photo: "way-back-in-shs-when-i-contested-for-best-vocalist",
        size: "square",
        caption: "Way back in SHS, when I contested for Best Vocalist.",
      },
      {
        type: "prose",
        text: "A printed flyer, a category, and a photograph of me before I had the words for what I wanted to do.",
      },
      { type: "video", video: "my-studio-song" },
      { type: "figure", photo: "my-picture-at-school", size: "half", caption: "From the same season." },
    ],
  },
  {
    slug: "today",
    number: "06",
    title: "Who I Am Today",
    nav: "Today",
    intro: "This is me, right now.",
    cover: "me-currently",
    blurb: "Right now, exactly as I am.",
    theme: "blue",
    blocks: [
      { type: "aphorism", text: "A photograph cannot age on your behalf. This one is current." },
      { type: "figure", photo: "me-currently", size: "wide", caption: "Me currently." },
      { type: "pair", photos: ["my-favourate-picture", "my-picture-1"] },
      {
        type: "prose",
        text: "Some years back. And up to today. The distance between those two lines is the whole of my story so far.",
      },
      { type: "video", video: "some-years-back-and-up-to-today" },
      { type: "trio", photos: ["my-picture", "my-picture-2", "years-back"] },
      { type: "pair", photos: ["some-years-back-my-picture", "sister-elizabeth"] },
      { type: "video", video: "myself-now" },
    ],
  },
  {
    slug: "dreams",
    number: "07",
    title: "My Dreams",
    nav: "Dreams",
    intro: "The best chapters are the ones still being written.",
    cover: "my-picture-2",
    blurb: "The chapter still unwritten.",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "The best chapters are the ones still being written." },
      {
        type: "prose",
        text: "This is the one part of my story that has no photographs yet. I have not lived it, so I am not going to pretend otherwise. It is the part I am still making, and it is the part I am most excited about.",
      },
      { type: "pair", photos: ["my-picture-2", "me-currently"] },
      { type: "wishBox", prompt: "Tell Mercy a dream" },
    ],
  },
];

/* Wishes that can be sent straight to Mercy on WhatsApp. */
export const wishPrompts = [
  "Happy birthday Mercy! Wishing you a year full of joy, health and grace.",
  "Happy birthday Mercy! May this new year bring you everything you have been praying for.",
  "Mercy, happy birthday! Keep shining - you inspire us to be better.",
  "Happy birthday Mercy! Enjoy your day. You deserve every good thing that comes with it.",
  "Mercy, may your birthday be as beautiful and warm as your heart. Have fun today!",
  "Wishing you a wonderful birthday Mercy. Grateful for you.",
];

/* Page-level copy used by the Birthday and Wishes pages. */
export const celebration = {
  kicker: "Today is all about you",
  heading: "Happy Birthday,\nMercy",
  lead: "This page exists because today belongs to you. Take your time with it.",
  songTitle: "Happy Birthday to You",
  songNote: "A little tune, made for you. Press play.",
  candleLabel: "Blow out the candles",
  candleNote: "Tap the cake to make a wish.",
  confetti: "Celebrate",
};
