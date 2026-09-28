/**
 * Mercy's Birthday - story structure and page copy.
 *
 * NARRATION: first person. Mercy narrates her own life here, in the words she
 * has actually used. The writing is hers, so it stays plain - a friend talking,
 * not a novelist. Robert's personal message further down is the one place a
 * second voice appears, and it addresses her directly.
 *
 * FACTUAL RULE: nothing below may assert a date, achievement, relationship or
 * memory that is not already evidenced by the project assets or supplied by
 * the site owner. First person does not license invention. Switching "she" to
 * "I" must not add a single new fact. Where information is missing, the writing
 * goes around it rather than filling the gap.
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
    intro: "Where I started, and my school years.",
    cover: "my-childhood-picture",
    blurb: "Childhood and school",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "Where it started" },
      {
        type: "prose",
        text: "Looking at these old memories reminds me of where I came from. So much has changed since then, but I am grateful for the life God has given me, and for the people who were there from the beginning.",
      },
      {
        type: "figure",
        photo: "my-childhood-picture",
        size: "wide",
        caption: "A childhood memory.",
      },
      {
        type: "prose",
        text: "I grew up in a Christian home with my parents and my siblings. Then came school. I went to junior high, and then to Konongo Odumase Senior High School.",
      },
      {
        type: "pair",
        photos: ["when-was-at-jhs-some-years-back", "my-picture-at-school"],
        captions: ["From my junior high years.", "From my school years."],
      },
      {
        type: "prose",
        text: "These are the years before I started teaching, and before I began working seriously on my music.",
      },
    ],
  },
  {
    slug: "family",
    number: "02",
    title: "My family",
    nav: "Family",
    intro: "My parents, my siblings, and the home I grew up in.",
    cover: "picture-with-my-younger-siblings",
    blurb: "My family",
    theme: "blue",
    blocks: [
      { type: "aphorism", text: "MY FAMILY ❤️" },
      {
        type: "prose",
        text: "My parents have been there for me from the beginning. They have cared for me, guided me and taught me to make the right decisions. I know there are many things they have done for me that I may not always say thank you for, but I appreciate them. Thank you for standing by me and wanting the best for me. May God continue to bless and protect you.",
      },
      {
        type: "pair",
        photos: ["me-and-my-lovely-father", "me-and-my-lovely-mother"],
        captions: ["With my father.", "With my mother."],
      },
      { type: "video", video: "my-lovely-mom-video" },
      {
        type: "prose",
        text: "To my siblings - thank you for always being there whenever I need you. Having people I can turn to means a lot to me. I appreciate every moment, every conversation, and every way you have been part of my life.",
      },
      {
        type: "figure",
        photo: "picture-with-my-younger-siblings",
        size: "wide",
        caption: "With my younger siblings.",
      },
      {
        type: "prose",
        text: "To my sisters - thank you for the care, support and kindness you have shown me. Having people who genuinely care about me is something I do not take for granted. I appreciate every moment we have shared, and I pray that God continues to bless each one of you.",
      },
      {
        type: "pair",
        photos: ["sister-cece", "sister-elizabeth"],
        captions: ["My sister, Cece ❤️", "My sister, Elizabeth."],
      },
      {
        type: "prose",
        text: "To my brothers - thank you for always being there for me, and for the way you have stood with me as I have grown. Having brothers I can turn to means a lot to me. I appreciate you, and I pray that God continues to bless each one of you.",
      },
      {
        type: "figure",
        photo: "brother-kofi",
        size: "half",
        caption: "My brother, Kofi.",
      },
      {
        type: "figure",
        photo: "brother-samuel",
        size: "half",
        caption: "My brother, Samuel.",
      },
    ],
  },
  {
    slug: "people",
    number: "03",
    title: "My friends",
    nav: "People",
    intro: "The people who have been beside me.",
    cover: "i-and-my-lovely-friends",
    blurb: "The people in my life",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "MY BEST FRIEND, ELIJAH ❤️" },
      {
        type: "prose",
        text: "Elijah, thank you for being my best friend and for being there through thick and thin. I really appreciate your advice, your love and your care.",
      },
      {
        type: "figure",
        photo: "my-best-friend-elisha-owusu-asante",
        size: "half",
        caption: "My best friend, Elijah.",
      },
      {
        type: "prose",
        text: "We have had our disagreements too, but our friendship has continued to grow. I know I can be stubborn sometimes, but you have continued to be there. Thank you for being my best friend. I truly appreciate you.",
      },
      {
        type: "pair",
        photos: ["my-friend-sandra", "my-friend-rachael"],
        captions: ["With Sandra.", "With Rachael."],
      },
      {
        type: "prose",
        text: "To my friends - knowing you has been something I truly appreciate. Thank you for the moments we have shared, the laughter, the care, and simply being someone I can have in my life. Some people become part of your memories without even realising how much their presence means. I am grateful to God for allowing our paths to cross.",
      },
      {
        type: "figure",
        photo: "i-and-my-lovely-friends",
        size: "wide",
        caption: "With my friends.",
      },
      {
        type: "trio",
        photos: ["me-with-my-friends-2", "my-fighting-patner", "my-favorite-person-and-i"],
        captions: ["Time with my friends.", "With a friend.", "With someone close to me."],
      },
      { type: "video", video: "happy-moment-with-friends" },
      { type: "video", video: "my-family-and-friends" },
    ],
  },
  {
    slug: "faith",
    number: "04",
    title: "My faith",
    nav: "Faith",
    intro: "What I hold on to.",
    cover: "pastor-paul-oteng-asamoah-and-mama-agartha-asamoah",
    blurb: "My faith",
    theme: "blue",
    blocks: [
      { type: "aphorism", text: "BY GOD'S GRACE 🙏🏽" },
      {
        type: "prose",
        text: "When I look back at my life, I know I have not come this far by my own strength. Thank You, Lord, for protecting me, for guiding me, and for giving me another year.",
      },
      { type: "video", video: "mercy-deep-worship", ratio: "16/9" },
      {
        type: "prose",
        text: "Church has always been part of my life, and worship is something I take part in. This clip is the one I picked out myself.",
      },
      { type: "video", video: "me-worshiping-at-church" },
      {
        type: "prose",
        text: "Pastor Paul, thank you for never giving up on me. Thank you for believing in my dreams, for caring about my happiness, and for standing by me like a father. I am grateful to God for placing you in my life. You have been a blessing to me, and I will always appreciate the role you have played in my life. May God continue to bless you.",
      },
      {
        type: "prose",
        text: "To Mama Agartha, thank you for the support and encouragement you have given me, and for standing with my family in the seasons that mattered. I appreciate you, and I pray that God continues to bless you and your family.",
      },
      {
        type: "figure",
        photo: "pastor-paul-oteng-asamoah-and-mama-agartha-asamoah",
        size: "wide",
        caption: "With Pastor Paul and Mama Agartha.",
      },
      {
        type: "prose",
        text: "Philippians 4:6 is the Bible verse I chose.",
      },
      { type: "aphorism", text: "Be anxious for nothing, but in everything, by prayer and petition with thanksgiving." },
      {
        type: "prose",
        text: "Please forgive me for my mistakes, draw me closer to You, and help me to keep You at the centre of my life. My memories have taught me how to live without depending on anyone else but God. I do not build my life around what other people expected of me. I choose my own way instead.",
      },
    ],
  },
  {
    slug: "music",
    number: "05",
    title: "My music",
    nav: "Music",
    intro: "Singing is something I work at seriously.",
    cover: "my-studio-song",
    blurb: "Singing and music",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "THE GIFT OF MUSIC 🎶" },
      {
        type: "prose",
        text: "Singing is something that is close to my heart. I like singing, I like listening to music, and I work at it. For me, the singing and the faith are connected.",
      },
      {
        type: "figure",
        photo: "way-back-in-shs-when-i-contested-for-best-vocalist",
        size: "square",
        caption: "The flyer from when I contested for Best Vocalist at Konongo Odumase Senior High School.",
      },
      {
        type: "prose",
        text: "This is the flyer from that time. Music was already becoming an important part of my life.",
      },
      {
        type: "prose",
        text: "Melody Singers has been part of my Christian and music journey. One of the artists I listen to is Mama Esther. Two lines I have mentioned are my soul says yes to your ways, and may the meditation of my heart be accepted to you.",
      },
      { type: "video", video: "my-studio-song" },
      {
        type: "prose",
        text: "This is me working on the music I want to keep improving. I pray that God continues to help me grow, and to use the gift He has given me to serve Him and encourage others.",
      },
      { type: "figure", photo: "my-picture-at-school", size: "half", caption: "From my school years." },
    ],
  },
  {
    slug: "today",
    number: "06",
    title: "Today",
    nav: "Today",
    intro: "Where I am right now.",
    cover: "me-currently",
    blurb: "Where I am now",
    theme: "blue",
    blocks: [
      { type: "aphorism", text: "TODAY ❤️" },
      {
        type: "prose",
        text: "I am still learning. I am still growing. I am still figuring things out. But I am grateful for how far God has brought me, and excited about what He has ahead.",
      },
      {
        type: "prose",
        text: "I am currently a teacher, and I am working towards further education at university.",
      },
      { type: "figure", photo: "me-currently", size: "wide", caption: "Me today." },
      {
        type: "pair",
        photos: ["my-favourate-picture", "my-picture-1"],
        captions: ["One of my favourite pictures.", "A moment worth remembering."],
      },
      {
        type: "prose",
        text: "Away from work and school, some of the simple things I enjoy are good food, like banku with okra stew and meat, and watching films. I have mentioned Treasure in the Sky and Best Friends in the World. My favourite colours are pink and blue.",
      },
      { type: "video", video: "some-years-back-and-up-to-today" },
      {
        type: "pair",
        photos: ["my-picture", "my-picture-2"],
        captions: ["A happy memory.", "One of the moments that makes me smile."],
      },
      { type: "video", video: "myself-now" },
    ],
  },
  {
    slug: "dreams",
    number: "07",
    title: "What I am working towards",
    nav: "Dreams",
    intro: "What I am still working on.",
    cover: "my-picture-2",
    blurb: "My goals",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "I want to make heaven proud" },
      {
        type: "prose",
        text: "I want to become an Agric Officer. I want to become a good gospel musician. I want to make my parents proud.",
      },
      {
        type: "prose",
        text: "I have not got there yet. These are the things I am still working on.",
      },
      {
        type: "pair",
        photos: ["my-picture-2", "me-currently"],
        captions: ["One of the moments that makes me smile.", "Me, today."],
      },
      { type: "wishBox", prompt: "Tell Mercy what she is working towards" },
    ],
  },
];

/* Mercy's birthday prayer, and the last thing a visitor reads. It is not a
   caption and not a photo note - it is a prayer in her own voice, so it uses
   the first person like the rest of the story. Kept here as data so the page
   renders it with the components that already exist. */
export const thanksgiving = {
  kicker: "A birthday prayer",
  title: "DEAR LORD, THANK YOU ❤️🙏🏽",
  paragraphs: [
    "Dear Lord,",
    "Thank You for this day. Thank You for giving me another year of life, and for bringing me safely to it. When I look back at where I came from and everything You have carried me through, I know that I am standing here today because of Your grace, and not my own strength.",
    "Thank You for protecting me, for guiding me and for keeping me. Thank You for my parents, who cared for me and taught me to make the right decisions. Thank You for my siblings, my friends, and for every person You have placed in my life.",
    "Thank You for the happy moments, and thank You even for the difficult seasons that have taught me important lessons.",
    "Lord, as I begin this new year, please go ahead and bless my life. Guide my education and every step I take this year. Bless my future, and lead me into the path You have prepared for me.",
    "Thank You for the gift of music. Please continue to guide me as I grow, and help me to use my voice to serve You and encourage others.",
    "Lord, forgive me for my sins and my mistakes. Help me to do better, to make the right decisions and to live according to Your will. Draw me closer to You and help me never to forget You. Help me to become the person You want me to be.",
    "I do not know everything this new year will hold, but I trust You.",
    "Thank You, Lord, for this birthday, and for bringing me this far.",
    "It is only by Your grace. Amen. 🙏🏽",
  ],
  signoff: "Mercy",
};

/* Robert's personal message to Mercy. This is deliberately the one place the
   voice switches out of first person and addresses her directly, in second
   person. Keep it sincere and specific - no invented memories, no claim to a
   relationship that has not been established. */
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
