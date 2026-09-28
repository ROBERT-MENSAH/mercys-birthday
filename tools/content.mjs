/**
 * Mercy's Birthday - content source of truth.
 *
 * Every word of copy, caption, alt-text and contact detail lives here.
 * `npm run build` reads this file and regenerates the static site.
 *
 * RULE: nothing here may describe a memory, relationship, quote, date or
 * feeling that is not directly evidenced by the project assets. Real names
 * come from the asset filenames and visible image content.
 */

export const site = {
  name: "Mercy's Birthday",
  shortName: "Mercy",
  subject: "Mercy",
  tagline: "This is Mercy",
  description:
    "Her photographs, her videos, and a few things she has said about herself. Made by hand for her birthday.",
  themeColor: "#101A3A",
  backgroundColor: "#101A3A",
  accentColor: "#E83E8C",
  locale: "en_GH",
  startUrl: "/",
};

/* Real numbers supplied by the project owner. Never invent numbers. */
export const contact = {
  whatsappDisplay: "059 626 9758",
  whatsappNumber: "233596269758", // international, digits only - for wa.me
  phoneDisplay: "059 626 9758",
  phoneHref: "+233596269758",
};

export const creator = {
  name: "Robert Mensah",
  role: "Friend • Web Creator",
  photo: "img/robert-the-web-creator.png",
  kicker: "Created for Mercy",
  subtitle: "Made by one friend",
  whatsappNumber: "233533874270",
  whatsappDisplay: "053 387 4270",
};

/* --------------------------------------------------------------------------
   Bible verses for the home page.

   ONLY Philippians 4:6 is Mercy's own choice - she named it herself, so it is
   the featured verse. Everything in `more` was chosen by the site owner to fit
   a birthday blessing, and is labelled that way on the page. Never present the
   `more` list as verses Mercy picked.

   Text is New International Version (NIV), 2011 revision, as printed by
   Bible Gateway. Do not mix in wording from another translation.

   NIV is (c) 1973, 1978, 1984, 2011 Biblica. Used by permission.
   -------------------------------------------------------------------------- */
export const bibleVerses = {
  translation: "New International Version (NIV)",
  kicker: "Words she holds close",
  title: "A verse close to her heart",
  lead: "Philippians 4:6 is the verse Mercy chose herself. The others are here as a birthday blessing for her.",
  main: {
    label: "Mercy's favourite Bible verse",
    ref: "Philippians 4:6",
    text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
  },
  moreLabel: "More words for her birthday",
  more: [
    {
      ref: "Numbers 6:24-26",
      text: "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you; the Lord turn his face toward you and give you peace.",
    },
    {
      ref: "Proverbs 3:5-6",
      text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    },
    {
      ref: "Jeremiah 29:11",
      text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    },
    {
      ref: "Psalm 37:4",
      text: "Take delight in the Lord, and he will give you the desires of your heart.",
    },
    {
      ref: "Isaiah 41:10",
      text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.",
    },
  ],
};

/* Mobile Money details. The number Mercy wants gifts sent to. Kept here so it
   is changed in one place only. `network` is shown to visitors so they send to
   the right wallet. */
export const momo = {
  network: "MTN Mobile Money",
  /* shown on the gifts page, and copied straight to the clipboard */
  numberDisplay: "059 626 9758",
  numberDial: "059 626 9758",
  /* Ghanaian mobile money wallets are dialled locally, no country code */
  telHref: "tel:0596269758",
  steps: [
    "Open your MTN Mobile Money app or dial *170# on your phone.",
    "Choose Mobile Money Transfer and select MTN Mobile Money.",
    "Enter the number above as the recipient.",
    "Enter the amount, confirm, and enter your PIN.",
  ],
};

/* -------------------------------------------------------------------------- 
   Photographs
   group   -> chapter / memory-room filter
   caption -> editorial caption in the Memory Room
   alt     -> descriptive alt text for screen readers
   -------------------------------------------------------------------------- */
export const photos = [
  // Childhood
  {
    id: "my-childhood-picture",
    group: "childhood",
    caption: "A childhood memory.",
    alt: "Mercy as a young girl, one of the earliest memories she has",
  },
  {
    id: "when-was-at-jhs-some-years-back",
    group: "childhood",
    caption: "From my junior high years.",
    alt: "From Mercy's junior high years",
  },
  {
    id: "years-back",
    group: "childhood",
    caption: "Also from my school days.",
    alt: "Mercy with a schoolmate, from her school days",
  },
  {
    id: "some-years-back-my-picture",
    group: "childhood",
    caption: "Me some years back.",
    alt: "Mercy some years back",
  },

  // School
  {
    id: "my-picture-at-school",
    group: "school",
    caption: "From my school years.",
    alt: "From Mercy's school years",
  },

  // Family
  {
    id: "me-and-my-lovely-father",
    group: "family",
    caption: "With my father.",
    alt: "Mercy with her father",
  },
  {
    id: "me-and-my-lovely-mother",
    group: "family",
    caption: "With my mother.",
    alt: "Mercy with her mother",
  },
  {
    id: "picture-with-my-younger-siblings",
    group: "family",
    caption: "With my younger siblings.",
    alt: "Mercy with her younger siblings",
  },
  {
    id: "sister-cece",
    group: "family",
    caption: "My sister, Cece.",
    alt: "Mercy's sister, Cece",
  },
  {
    id: "sister-elizabeth",
    group: "family",
    caption: "My sister, Elizabeth.",
    alt: "Mercy's sister, Elizabeth",
  },
  {
    id: "brother-kofi",
    group: "family",
    caption: "My brother, Kofi.",
    alt: "Mercy's brother, Kofi",
  },
  {
    id: "brother-samuel",
    group: "family",
    caption: "My brother, Samuel.",
    alt: "Mercy's brother, Samuel",
  },

  // People
  {
    id: "my-best-friend-elisha-owusu-asante",
    group: "people",
    caption: "My best friend, Elijah.",
    alt: "Elijah Owusu Asante, Mercy's best friend",
  },
  {
    id: "my-friend-sandra",
    group: "people",
    caption: "With Sandra.",
    alt: "Mercy with her friend Sandra",
  },
  {
    id: "my-friend-rachael",
    group: "people",
    caption: "With Rachael.",
    alt: "Mercy with her friend Rachael",
  },
  {
    id: "my-fighting-patner",
    group: "people",
    caption: "With a friend.",
    alt: "Mercy with a friend",
  },
  {
    id: "my-favorite-person-and-i",
    group: "people",
    caption: "With someone close to me.",
    alt: "Mercy with someone close to her",
  },
  {
    id: "me-with-my-friends-2",
    group: "people",
    caption: "Time with my friends.",
    alt: "Mercy with her friends",
  },
  {
    id: "i-and-my-lovely-friends",
    group: "people",
    caption: "With my friends.",
    alt: "Mercy with her friends",
  },

  // Faith
  {
    id: "pastor-paul-oteng-asamoah-and-mama-agartha-asamoah",
    group: "faith",
    caption: "With Pastor Paul and Mama Agartha.",
    alt: "Pastor Paul Oteng Asamoah with Mama Agartha Asamoah",
  },

  // Music
  {
    id: "way-back-in-shs-when-i-contested-for-best-vocalist",
    group: "music",
    caption: "The flyer from when I contested for Best Vocalist at Konongo Odumase Senior High School.",
    alt: "The flyer from when Mercy contested for Best Vocalist at Konongo Odumase Senior High School",
  },

  // Today
  {
    id: "me-currently",
    group: "today",
    caption: "Me, today.",
    alt: "Mercy today",
  },
  {
    id: "my-picture",
    group: "today",
    caption: "A happy memory.",
    alt: "A happy memory of Mercy",
  },
  {
    id: "my-favourate-picture",
    group: "today",
    caption: "One of my favourite pictures.",
    alt: "One of Mercy's favourite pictures",
  },
  {
    id: "my-picture-1",
    group: "today",
    caption: "A moment worth remembering.",
    alt: "A moment worth remembering",
  },
  {
    id: "my-picture-2",
    group: "today",
    caption: "One of the moments that makes me smile.",
    alt: "One of Mercy's favourite moments",
  },
];

/* --------------------------------------------------------------------------
   Videos - every one loads only on user interaction, never on page load.
   poster: optional override when the automatic <slug>-poster.webp is absent.
   -------------------------------------------------------------------------- */
export const videos = [
  {
    id: "my-lovely-mom-video",
    file: "MY LOVELY MOM VIDEO.mp4",
    title: "For my mum",
    caption: "I made this for my mother.",
    group: "family",
    why: "I have talked about my mother more than almost anyone else.",
    alt: "Mercy made this video for her mother",
  },
  {
    id: "happy-moment-with-friends",
    file: "HAPPY MOMENT WITH FRIENDS.mp4",
    title: "A moment with Rachael",
    caption: "Me with my friend Rachael.",
    group: "people",
    alt: "A moment Mercy shared with her friend Rachael",
  },
  {
    id: "my-family-and-friends",
    file: "MY FAMILY AND FRIENDS.mp4",
    title: "Family and friends",
    caption: "Me with the people closest to me.",
    group: "people",
    alt: "Mercy with the people closest to her",
  },
  /* Mercy picked this worship clip herself and asked for it to be seen, so it
     leads the faith videos. The poster is a real frame captured from this file,
     not reused from the older worship video. */
  {
    id: "mercy-deep-worship",
    file: "MERCY'S DEEP WORSHIP.mp4",
    title: "Worshipping",
    caption: "This is the video I asked to be shown.",
    group: "faith",
    poster: "mercy-s-deep-worship-poster.webp",
    why: "I chose this clip myself, and asked for it to be seen.",
    alt: "Mercy worshipping, in the clip she chose herself",
  },
  {
    id: "me-worshiping-at-church",
    file: "ME WORSHIPING AT CHURCH.mp4",
    title: "Worshipping at church",
    caption: "A moment of worship at church.",
    group: "faith",
    why: "Church has always been part of my life, and worship is something I take part in.",
    alt: "A moment of Mercy worshipping at church",
  },
  {
    id: "my-studio-song",
    file: "MY STUDIO SONG.mp4",
    title: "In the studio",
    caption: "Me in the studio, working on my music.",
    group: "music",
    why: "Singing is something I work at seriously, and this is me working on it.",
    alt: "Mercy working on her music in the studio",
  },
  {
    id: "some-years-back-and-up-to-today",
    file: "SOME YEARS BACK AND UP TO TODAY.mp4",
    title: "Then, and now",
    caption: "Me some years back, and up to today.",
    group: "today",
    alt: "Mercy some years back, and up to today",
  },
  {
    id: "myself-now",
    file: "MYSELF NOW.mp4",
    title: "Me now",
    caption: "Me, as I am now.",
    group: "today",
    alt: "Mercy today, in her own words",
  },
  {
    id: "my-video-3",
    file: "MY VIDEO 3.mp4",
    title: "Me on camera",
    caption: "Me speaking to the camera.",
    group: "today",
    poster: "my-video-3-poster.webp",
    alt: "Mercy speaking to the camera",
  },
  {
    id: "me-currently-flexing",
    file: "ME CURRENTLY FLEXING.mp4",
    title: "Me filming",
    caption: "Me on my phone.",
    group: "today",
    alt: "Mercy filming on her phone",
  },
  {
    id: "my-video-1",
    file: "MY VIDEO 1.mp4",
    title: "Me at home",
    caption: "A moment at home.",
    group: "today",
    alt: "A moment of Mercy at home",
  },
  {
    id: "my-video-2",
    file: "MY VIDEO  2.mp4",
    title: "A selfie moment",
    caption: "A selfie I took.",
    group: "today",
    alt: "A selfie Mercy took",
  },
  {
    id: "my-video-in-smilling-mood",
    file: "MY VIDEO IN SMILLING MOOD.mp4",
    title: "In a smiling mood",
    caption: "In a good mood.",
    group: "today",
    alt: "Mercy in a good mood",
  },
];

export const photoGroups = [
  { id: "all", label: "All" },
  { id: "childhood", label: "Childhood" },
  { id: "school", label: "School" },
  { id: "family", label: "Family" },
  { id: "people", label: "People" },
  { id: "faith", label: "Faith" },
  { id: "music", label: "Music" },
  { id: "today", label: "Today" },
];
