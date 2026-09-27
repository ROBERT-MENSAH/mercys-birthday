/**
 * Mercy's Birthday - story structure and page copy.
 *
 * NARRATION: third person. Robert is the narrator, Mercy is the subject.
 * First-person references to Robert appear sparingly, as connective tissue
 * between chapters ("As I put these moments together..."). Mercy never
 * narrates her own life here.
 *
 * FACTUAL RULE: nothing below may assert a date, achievement, relationship or
 * memory that is not already evidenced by the project assets or supplied by
 * the site owner. Where information is missing, the writing goes around it
 * rather than filling the gap.
 *
 * Block types:
 *   aphorism  - large reflective pull-quote
 *   prose     - a paragraph of narration
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
    title: "Childhood and school",
    nav: "Childhood",
    intro: "Her childhood and her school years.",
    cover: "my-childhood-picture",
    blurb: "Childhood and school",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "She grew up with her parents and her siblings, and the house was full of faith." },
      {
        type: "prose",
        text: "Mercy grew up in a Christian home with her parents and her siblings. This is one of the earliest pictures of her, taken when she was a young girl.",
      },
      {
        type: "figure",
        photo: "my-childhood-picture",
        size: "wide",
        caption: "Mercy as a young girl.",
      },
      {
        type: "prose",
        text: "Then came school. She went to junior high, and then to Konongo Odumase Senior High School, where she contested for Best Vocalist.",
      },
      {
        type: "pair",
        photos: ["when-was-at-jhs-some-years-back", "my-picture-at-school"],
        captions: ["Mercy during her junior high years, with classmates.", "Mercy during her school years."],
      },
      {
        type: "prose",
        text: "These are the years before she started teaching, and before she began working on her music.",
      },
    ],
  },
  {
    slug: "family",
    number: "02",
    title: "Her family",
    nav: "Family",
    intro: "Her parents, her siblings, and the home she grew up in.",
    cover: "picture-with-my-younger-siblings",
    blurb: "The family she grew up in",
    theme: "blue",
    blocks: [
      { type: "aphorism", text: "Her parents have cared for her since birth." },
      {
        type: "prose",
        text: "Her parents cared for her from birth and guided her as she grew up. They were strict about doing the right thing, and they are among the most important people in her life. Mercy grew up in a Christian home.",
      },
      {
        type: "pair",
        photos: ["me-and-my-lovely-father", "me-and-my-lovely-mother"],
        captions: ["Mercy and her father.", "Mercy and her mother."],
      },
      {
        type: "prose",
        text: "These are Mercy's parents. She has talked about them more than almost anyone else.",
      },
      { type: "video", video: "my-lovely-mom-video" },
      {
        type: "prose",
        text: "Mercy also has siblings. She appreciates having them around when she needs them.",
      },
      {
        type: "figure",
        photo: "picture-with-my-younger-siblings",
        size: "wide",
        caption: "Mercy with her younger siblings.",
      },
      {
        type: "trio",
        photos: ["sister-cece", "sister-elizabeth", "brother-samuel"],
        captions: ["Mercy and her sister Cece.", "Mercy and her sister Elizabeth.", "Mercy and her brother Samuel."],
      },
      { type: "figure", photo: "brother-kofi", size: "half", caption: "Mercy and her brother Kofi." },
    ],
  },
  {
    slug: "people",
    number: "03",
    title: "Her friends",
    nav: "People",
    intro: "The friends Mercy talks about.",
    cover: "i-and-my-lovely-friends",
    blurb: "The people in her life",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "Elijah Owusu Asante is her best friend." },
      {
        type: "prose",
        text: "He has been with her through thick and thin, and she values his advice, his love and the way he cares for her.",
      },
      {
        type: "figure",
        photo: "my-best-friend-elisha-owusu-asante",
        size: "half",
        caption: "Elijah Owusu Asante, Mercy's best friend.",
      },
      {
        type: "prose",
        text: "They have had their disagreements too. Mercy admits she can be stubborn, and she values that Elijah does not get tired of her. Their friendship has grown stronger because of it.",
      },
      {
        type: "pair",
        photos: ["my-friend-sandra", "my-friend-rachael"],
        captions: ["Mercy and her friend Sandra.", "Mercy and her friend Rachael."],
      },
      {
        type: "prose",
        text: "Sandra and Rachael are two of the others Mercy spends her time with.",
      },
      {
        type: "figure",
        photo: "i-and-my-lovely-friends",
        size: "wide",
        caption: "Mercy with some of her friends.",
      },
      { type: "pair", photos: ["me-with-my-friends-2", "my-favorite-person-and-i"] },
      { type: "video", video: "happy-moment-with-friends" },
      { type: "video", video: "my-family-and-friends" },
    ],
  },
  {
    slug: "faith",
    number: "04",
    title: "Her faith",
    nav: "Faith",
    intro: "Being a Christian comes first for Mercy.",
    cover: "me-worshiping-at-church",
    blurb: "Her faith",
    theme: "blue",
    blocks: [
      { type: "aphorism", text: "She does not build her life around what other people expected of her." },
      {
        type: "prose",
        text: "Mercy is straightforward about her priorities. She wants to live a whole and balanced life, to minister unto the Lord, and to be a gospel singer.",
      },
      { type: "video", video: "mercy-deep-worship", ratio: "16/9" },
      {
        type: "prose",
        text: "Church has always been part of her life, and worship is something she takes part in. This clip is the one she picked out herself.",
      },
      { type: "video", video: "me-worshiping-at-church" },
      {
        type: "prose",
        text: "Mercy describes Pastor Paul Oteng Asamoah as someone who never gave up on her, who fought for her dreams, and who wanted her to be happy. She also describes him as a father figure, and as a blessing in her life.",
      },
      {
        type: "figure",
        photo: "pastor-paul-oteng-asamoah-and-mama-agartha-asamoah",
        size: "wide",
        caption: "Pastor Paul Oteng Asamoah and Mama Agartha Asamoah.",
      },
      {
        type: "prose",
        text: "Philippians 4:6 is the Bible verse Mercy chose.",
      },
      { type: "aphorism", text: "Be anxious for nothing, but in everything, by prayer and petition with thanksgiving." },
      {
        type: "prose",
        text: "She has said her memories taught her how to live without depending on anyone else but God, and that she does not build her life around what other people expected of her. She chooses her own way instead.",
      },
    ],
  },
  {
    slug: "music",
    number: "05",
    title: "Her music",
    nav: "Music",
    intro: "Singing is something Mercy works at seriously.",
    cover: "my-studio-song",
    blurb: "Singing and music",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "Mercy wants to become a good gospel musician." },
      {
        type: "prose",
        text: "Mercy likes singing, she likes listening to music, and she works at it. For her, the singing and the faith are connected.",
      },
      {
        type: "figure",
        photo: "way-back-in-shs-when-i-contested-for-best-vocalist",
        size: "square",
        caption: "Back at Konongo Odumase Senior High School, when she contested for Best Vocalist.",
      },
      {
        type: "prose",
        text: "This is the flyer from that time. Music was already becoming an important part of her life.",
      },
      {
        type: "prose",
        text: "Melody Singers has been part of her Christian and music journey. One of the artists she listens to is Mama Esther. Two lines she has mentioned are my soul says yes to your ways, and may the meditation of my heart be accepted to you.",
      },
      { type: "video", video: "my-studio-song" },
      {
        type: "prose",
        text: "This is her working on the music she wants to keep improving.",
      },
      { type: "figure", photo: "my-picture-at-school", size: "half", caption: "Mercy from her school years." },
    ],
  },
  {
    slug: "today",
    number: "06",
    title: "Mercy today",
    nav: "Today",
    intro: "Mercy today.",
    cover: "me-currently",
    blurb: "Where she is now",
    theme: "blue",
    blocks: [
      { type: "aphorism", text: "Away from work and school: good food, films, pink and blue." },
      {
        type: "prose",
        text: "Mercy is currently a teacher, and she is working towards further education at university.",
      },
      { type: "figure", photo: "me-currently", size: "wide", caption: "Mercy, as she is today." },
      { type: "pair", photos: ["my-favourate-picture", "my-picture-1"] },
      {
        type: "prose",
        text: "Away from work and school, some of the simple things she enjoys are good food, like banku with okra stew and meat, and watching films. She has mentioned Treasure in the Sky and Best Friends in the World. Her favourite colours are pink and blue.",
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
    title: "What she is working towards",
    nav: "Dreams",
    intro: "What she is aiming for.",
    cover: "my-picture-2",
    blurb: "Her goals",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "She wants to make heaven proud." },
      {
        type: "prose",
        text: "She wants to become an Agric Officer. She wants to become a good gospel musician. She wants to make her parents proud.",
      },
      {
        type: "prose",
        text: "She has not got there yet. These are the things she is still working on.",
      },
      { type: "pair", photos: ["my-picture-2", "me-currently"] },
      { type: "wishBox", prompt: "Tell Mercy what she is working towards" },
    ],
  },
];

/* Robert's personal message to Mercy. This is deliberately the one place the
   voice switches out of third person and speaks to her directly. Keep it
   sincere and specific - no invented memories, no claim to a relationship
   that has not been established. */
export const personalMessage = {
  kicker: "A message from Robert",
  title: "Happy birthday, Mercy ❤️",
  paragraphs: [
    "You are a very good friend, and honestly, knowing you has been something I really appreciate. Knowing you and sharing different moments with you over the years has been amazing.",
    "Today, I just want to celebrate you and wish you a very happy birthday.",
    "I pray that God blesses you, keeps you and guides you in whatever you are doing. I pray He blesses the work of your hands this year.",
    "Keep going. You are closer than you think.",
    "I hope you eat well, enjoy your day, and make beautiful memories.",
    "Happy birthday once again, Mercy. ❤️",
  ],
  signoff: "Robert",
};

/* Wishes that can be sent straight to Mercy on WhatsApp. */
export const wishPrompts = [
  "Happy birthday Mercy! I pray God blesses you and gives you a peaceful year ahead.",
  "Happy birthday Mercy! Enjoy your day, and may God guide you in everything you are working towards.",
  "Happy birthday Mercy! Wishing you good health, and a year full of small good things.",
  "Happy birthday Mercy! May the Lord bless the work of your hands this year.",
  "Happy birthday Mercy! Thank you for the good times. Have a lovely day.",
  "Happy birthday Mercy! May God continue to guide you and keep you safe. Have fun today!",
];

/* Page-level copy used by the Birthday and Wishes pages. */
export const celebration = {
  kicker: "Today is all about her",
  heading: "Happy Birthday,\nMercy",
  lead: "This page is for you, Mercy. Press the cake, play the song, and read the wishes people have left for you.",
  songTitle: "Happy Birthday to You",
  songNote: "A little tune, made for you. Press play.",
  candleLabel: "Blow out the candles",
  candleLabelOut: "Relight the candles",
  candleNote: "Tap the cake to blow out the candles and make a wish.",
  candleNoteOut: "Wish made! Tap the cake to relight them.",
  confetti: "Celebrate",
};
