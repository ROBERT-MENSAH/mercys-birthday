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
    title: "Where Her Story Began",
    nav: "Childhood",
    intro: "Before the student, the teacher and the singer, there was a little girl growing up.",
    cover: "my-childhood-picture",
    blurb: "The very first page.",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "Every long story has a first page." },
      {
        type: "prose",
        text: "Every story has a beginning, and Mercy's is no different. Before the student, the teacher, the singer and the woman with dreams for the future, there was simply a young girl growing up surrounded by family and faith. This is one of the earliest pictures of her - small hands, a book, and a studio backdrop that must have felt enormous at the time.",
      },
      {
        type: "figure",
        photo: "my-childhood-picture",
        size: "wide",
        caption: "A small glimpse of where the story began.",
      },
      {
        type: "prose",
        text: "Then came school. Junior high first, and then Konongo Odumase Senior High School, which added new experiences, new people and another stage of growing into the person she wanted to become. School years are where a lot of who somebody is gets quietly decided.",
      },
      {
        type: "pair",
        photos: ["when-was-at-jhs-some-years-back", "my-picture-at-school"],
        captions: ["Junior high days, with the girls from school.", "A school day, somewhere between the classroom and the field."],
      },
      {
        type: "prose",
        text: "As I put these moments together, what stands out is how early she started. The girl in that studio portrait and the woman she is today are not two different people. It is the same person, further along.",
      },
    ],
  },
  {
    slug: "family",
    number: "02",
    title: "The Family Behind Her",
    nav: "Family",
    intro: "Her parents. Her siblings. The people who raised her.",
    cover: "picture-with-my-younger-siblings",
    blurb: "The people she comes from.",
    theme: "blue",
    blocks: [
      { type: "aphorism", text: "You can tell who raised you by looking at them." },
      {
        type: "prose",
        text: "For Mercy, family has never been just a word. She grew up in a Christian home where faith and family were part of the foundation. Her parents have been with her from the very beginning - caring for her since birth, guiding her, and helping her make the right decisions along the way. They are, in her own reckoning, among the most essential people in her life.",
      },
      {
        type: "pair",
        photos: ["me-and-my-lovely-father", "me-and-my-lovely-mother"],
        captions: ["Mercy and her lovely father.", "Mercy and her lovely mother."],
      },
      {
        type: "prose",
        text: "Two photographs that say more than a paragraph ever could. These are the people whose care is quietly underneath almost everything else on this site.",
      },
      { type: "video", video: "my-lovely-mom-video" },
      {
        type: "prose",
        text: "And then there are her siblings. Mercy speaks about them with real appreciation - they have been there for her, particularly in the moments when she has needed somebody beside her. That kind of reliability does not get talked about enough.",
      },
      {
        type: "figure",
        photo: "picture-with-my-younger-siblings",
        size: "wide",
        caption: "The younger siblings who grew up alongside her.",
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
    title: "The People Who Shaped Her",
    nav: "People",
    intro: "Some people arrive quietly and never leave.",
    cover: "i-and-my-lovely-friends",
    blurb: "The people who stayed.",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "Some people arrive quietly and never leave." },
      {
        type: "prose",
        text: "Then there are the friendships that quietly become part of somebody's story. Elijah Owusu Asante is one of those people for Mercy. He has been with her through thick and thin, and she values his advice, his love and the way he simply cares.",
      },
      {
        type: "figure",
        photo: "my-best-friend-elisha-owusu-asante",
        size: "half",
        caption: "Elijah Owusu Asante, her best friend.",
      },
      {
        type: "prose",
        text: "Their friendship has had its moments. They used to fight sometimes, and Mercy will tell you herself that she can be stubborn. But somewhere along the way, those moments only made the bond stronger. The fact that he has not got tired of her says more about him than it does about either of them.",
      },
      {
        type: "pair",
        photos: ["my-friend-sandra", "my-friend-rachael"],
        captions: ["Mercy and her friend Sandra.", "With her friend Rachael."],
      },
      {
        type: "prose",
        text: "Sandra. Rachael. A fighting partner. A favourite person. Different names, but the same role in her life - people who made the ordinary days feel like they were worth keeping.",
      },
      {
        type: "figure",
        photo: "i-and-my-lovely-friends",
        size: "wide",
        caption: "Mercy and some of the people she loves most.",
      },
      { type: "pair", photos: ["me-with-my-friends-2", "my-favorite-person-and-i"] },
      { type: "video", video: "happy-moment-with-friends" },
      { type: "video", video: "my-family-and-friends" },
    ],
  },
  {
    slug: "faith",
    number: "04",
    title: "The Part That Holds It Together",
    nav: "Faith",
    intro: "She grew up in a Christian home, and faith never really left.",
    cover: "me-worshiping-at-church",
    blurb: "Where the words stop.",
    theme: "blue",
    blocks: [
      { type: "aphorism", text: "There are moments that words cannot carry." },
      {
        type: "prose",
        text: "When Mercy talks about her own priorities, she does not list them casually. Being a Christian comes first. Living a whole and balanced life. Ministering unto the Lord. Being a gospel singer. These are not separate ambitions for her - they all point the same direction. She grew up in a Christian home, and that has stayed with her.",
      },
      { type: "video", video: "me-worshiping-at-church" },
      {
        type: "prose",
        text: "This is her worshipping. No camera trick, no audience, no explanation needed. It is the part of her life that does not need anybody watching to be real.",
      },
      {
        type: "prose",
        text: "Some people come into a person's life and leave a mark that is difficult to explain in just a few words. For Mercy, Pastor Paul Oteng Asamoah is one of those people. She describes him as someone who never gave up on her, who fought for her dreams, and who wanted her to be happy. He has stood by her like a father, and became a genuine blessing in her life.",
      },
      {
        type: "figure",
        photo: "pastor-paul-oteng-asamoah-and-mama-agartha-asamoah",
        size: "wide",
        caption: "Pastor Paul Oteng Asamoah and Mama Agartha Asamoah.",
      },
      {
        type: "prose",
        text: "Her Bible verse is Philippians 4:6. Anyone who knows Mercy will understand why that one matters to her - a reminder not to let worry take more space than it has earned.",
      },
      { type: "aphorism", text: "Be anxious for nothing, but in everything, by prayer and petition with thanksgiving." },
      {
        type: "prose",
        text: "And then there were the lessons. Along the way, Mercy learned that growing up is also about learning which voices to listen to. Some experiences taught her not to build her life around other people's expectations, but to trust God and make her own decisions. She has talked about pushing past advice from friends about things she never wanted for her life, and choosing her own road anyway.",
      },
    ],
  },
  {
    slug: "music",
    number: "05",
    title: "The Voice She Keeps Working On",
    nav: "Music",
    intro: "Some things only come out when you sing them.",
    cover: "my-studio-song",
    blurb: "Where her voice lives.",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "Some things only come out when you sing them." },
      {
        type: "prose",
        text: "Music is not a hobby Mercy keeps on the side. She sings, she listens, and she wants to be genuinely good at it - specifically, a good gospel musician. Singing and faith are the same thing in her life, not two separate departments.",
      },
      {
        type: "figure",
        photo: "way-back-in-shs-when-i-contested-for-best-vocalist",
        size: "square",
        caption: "Back in SHS, when she contested for Best Vocalist.",
      },
      {
        type: "prose",
        text: "That is a printed flyer, a category, and a photograph of her at a stage when she had not yet found the words for what she wanted to do. The interest was there long before the confidence caught up.",
      },
      {
        type: "prose",
        text: "Melody Singers has been part of this road, and it is where her music and her ministry meet. There are songs she has carried with her since then. One line in particular has stayed with her: my soul says yes to your ways. She names Mama Esther among the voices that shaped her ear.",
      },
      { type: "video", video: "my-studio-song" },
      {
        type: "prose",
        text: "And this is what the work looks like now. Behind a microphone, still going.",
      },
      { type: "figure", photo: "my-picture-at-school", size: "half", caption: "From the same season." },
    ],
  },
  {
    slug: "today",
    number: "06",
    title: "Who She Is Today",
    nav: "Today",
    intro: "She is still becoming.",
    cover: "me-currently",
    blurb: "Right now, exactly as she is.",
    theme: "blue",
    blocks: [
      { type: "aphorism", text: "A photograph cannot age on your behalf. This one is current." },
      {
        type: "prose",
        text: "Today, Mercy is a teacher, and she is working towards furthering her education at university. That is another chapter rather than a finish line. She is still becoming, and she is honest enough to say so.",
      },
      { type: "figure", photo: "me-currently", size: "wide", caption: "Mercy, currently." },
      { type: "pair", photos: ["my-favourate-picture", "my-picture-1"] },
      {
        type: "prose",
        text: "Some years back, and up to today. The distance between those two lines is the whole of her story so far - and it is a good deal further along than it looks from the outside.",
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
    title: "Where She Wants To Go",
    nav: "Dreams",
    intro: "The best chapters are the ones still being written.",
    cover: "my-picture-2",
    blurb: "The chapter still unwritten.",
    theme: "pink",
    blocks: [
      { type: "aphorism", text: "The best chapters are the ones still being written." },
      {
        type: "prose",
        text: "The story does not end here. Mercy has already begun thinking about the person she wants to become - an Agric Officer, a good gospel musician, a woman who keeps learning. She wants to make her parents proud, and she has said she wants to make heaven proud too. That last one is the biggest ambition on the list, and it is not a small thing to want.",
      },
      {
        type: "prose",
        text: "None of it has happened yet, and she is not pretending otherwise. It is the part she has not lived, so she is not going to describe it as though she has. It is the part she is still making, and the part she is most excited about.",
      },
      { type: "pair", photos: ["my-picture-2", "me-currently"] },
      { type: "wishBox", prompt: "Tell Mercy what she is becoming" },
    ],
  },
];

/* Robert's personal message to Mercy. This is deliberately the one place the
   voice switches out of third person and speaks to her directly. Keep it
   sincere and specific - no invented memories, no claim to a relationship
   that has not been established. */
export const personalMessage = {
  kicker: "A message from Robert",
  title: "Mercy,",
  paragraphs: [
    "I made this website because I wanted to do something for your birthday that would not just get lost in a chat. Something you can open whenever you want and go through properly, at your own pace.",
    "So I went through your pictures and your videos, and I tried to put them in the order that made sense - the childhood, the school years, home, the people who have been there for you, your faith, your music, where you are now, and where you are trying to get to. I did my best to write it the way I would say it out loud, because that is more honest than trying to sound fancy.",
    "I have left out anything I was not sure about. I would rather this be accurate than impressive.",
    "I hope you like it. And I hope the year ahead is kind to you, and that the things you are working towards - Agric Officer, gospel musician, making your parents proud - come to you properly. Not just soon.",
    "Happy birthday, Mercy. It really was a pleasure putting this together for you.",
  ],
  signoff: "From Robert",
};

/* Wishes that can be sent straight to Mercy on WhatsApp. */
export const wishPrompts = [
  "Happy birthday Mercy! Wishing you a year full of joy, health and grace.",
  "Happy birthday Mercy! May this new year bring you everything you have been praying for.",
  "Mercy, happy birthday! Keep shining - you inspire us to be better.",
  "Happy birthday Mercy! Enjoy your day. You deserve every good thing that comes with it.",
  "Mercy, may your birthday be as warm as your heart. Have fun today!",
  "Wishing you a wonderful birthday Mercy. Grateful for you.",
];

/* Page-level copy used by the Birthday and Wishes pages. */
export const celebration = {
  kicker: "Today is all about her",
  heading: "Happy Birthday,\nMercy",
  lead: "This page exists because today belongs to you, Mercy. Take your time with it - press the cake, play the song, and read the wishes people have left for you.",
  songTitle: "Happy Birthday to You",
  songNote: "A little tune, made for you. Press play.",
  candleLabel: "Blow out the candles",
  candleLabelOut: "Relight the candles",
  candleNote: "Tap the cake to blow out the candles and make a wish.",
  candleNoteOut: "Wish made! Tap the cake to relight them.",
  confetti: "Celebrate",
};
