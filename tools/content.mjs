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
    "A birthday story about Mercy, told through her photographs, videos, family, friends, faith, music and the goals she is working towards.",
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
  subtitle: "A Birthday Digital Experience",
  whatsappNumber: "233533874270",
  whatsappDisplay: "053 387 4270",
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
    caption: "Mercy as a young girl.",
    alt: "A studio portrait of Mercy as a young girl, in a pinstripe blazer over a white collar, holding a book, with drop earrings",
  },
  {
    id: "when-was-at-jhs-some-years-back",
    group: "childhood",
    caption: "Mercy during her junior high years, with classmates.",
    alt: "Five schoolmates in matching teal Girls Support Girls t-shirts and blue skirts standing on a grass field, with school buildings behind",
  },

  // School
  {
    id: "my-picture-at-school",
    group: "school",
    caption: "Mercy during her school years.",
    alt: "Mercy in a white blouse with a green and yellow patterned skirt, smiling with her chin on her hand beside a school building",
  },

  // Family
  {
    id: "me-and-my-lovely-father",
    group: "family",
    caption: "Mercy and her father.",
    alt: "Mercy in a pink sleeveless dress with a young man in white, standing beside a man in white at a celebration",
  },
  {
    id: "me-and-my-lovely-mother",
    group: "family",
    caption: "Mercy and her mother.",
    alt: "Mercy in a pink sleeveless dress and sunglasses standing arm in arm with her mother in a white and teal patterned dress and headwrap",
  },
  {
    id: "picture-with-my-younger-siblings",
    group: "family",
    caption: "Mercy with her younger siblings.",
    alt: "Mercy in a green and white zigzag dress with her arm around a younger boy, beside three younger boys in green, white and blue outfits",
  },
  {
    id: "sister-cece",
    group: "family",
    caption: "Sister Cece",
    alt: "A young girl in a blue patterned dress and light blue headwrap, smiling and holding a black handbag in a garden",
  },
  {
    id: "sister-elizabeth",
    group: "family",
    caption: "Sister Elizabeth",
    alt: "Mercy in a purple and orange patterned dress, hair braided up with gold beads, speaking into a blue microphone",
  },
  {
    id: "brother-kofi",
    group: "family",
    caption: "Brother Kofi",
    alt: "A young man in a white printed shirt and dark trousers, holding a checkered pouch and a phone, on a tree-lined path",
  },
  {
    id: "brother-samuel",
    group: "family",
    caption: "Brother Samuel",
    alt: "A young man in a light blue button-down shirt and grey trousers, smiling, with a yellow building behind him",
  },

  // People
  {
    id: "my-best-friend-elisha-owusu-asante",
    group: "people",
    caption: "Mercy and Elijah Owusu Asante, Mercy's best friend.",
    alt: "Elijah Owusu Asante in a light blue polo shirt, adjusting his sunglasses indoors",
  },
  {
    id: "my-friend-sandra",
    group: "people",
    caption: "Mercy and her friend Sandra.",
    alt: "Mercy in a white and gold lace dress walking arm in arm with her friend Sandra, who wears a red dress, beside a pink wall",
  },
  {
    id: "my-friend-rachael",
    group: "people",
    caption: "Mercy and her friend Rachael.",
    alt: "Two friends in white t-shirts wearing printed sashes, one making a peace sign, in front of a green wire fence",
  },
  {
    id: "my-fighting-patner",
    group: "people",
    caption: "Mercy and a friend.",
    alt: "Two women in white dresses standing together outside a house, one carrying a black quilted handbag",
  },
  {
    id: "my-favorite-person-and-i",
    group: "people",
    caption: "Mercy and a friend she is close to.",
    alt: "Mercy in a white top and skirt standing with her arm around a friend, both in white, on a lawn",
  },
  {
    id: "me-with-my-friends-2",
    group: "people",
    caption: "Mercy with her friends.",
    alt: "Three friends seated on a stone step, in neon green, patterned and pink off-shoulder tops, arms around each other",
  },
  {
    id: "i-and-my-lovely-friends",
    group: "people",
    caption: "Mercy with some of her friends.",
    alt: "Four friends standing together against a pink wall, in green, white, white-and-gold and red dresses",
  },

  // Faith
  {
    id: "pastor-paul-oteng-asamoah-and-mama-agartha-asamoah",
    group: "faith",
    caption: "Pastor Paul Oteng Asamoah and Mama Agartha Asamoah",
    alt: "Pastor Paul Oteng Asamoah seated in a maroon suit, with Mama Agartha Asamoah standing behind him in a red dress",
  },

  // Music
  {
    id: "way-back-in-shs-when-i-contested-for-best-vocalist",
    group: "music",
    caption: "Contesting for Best Vocalist at Konongo Odumase Senior High School.",
    alt: "A senior high school voting flyer for the Best Vocalist category featuring Mercy's photograph",
  },

  // Today
  {
    id: "me-currently",
    group: "today",
    caption: "Mercy, as she is today.",
    alt: "Mercy seated on a chair in a studio against a deep blue backdrop, wearing a white striped dress, beside a lit ring light, a silver bird ornament and dried grasses",
  },
  {
    id: "my-picture",
    group: "today",
    caption: "Mercy today.",
    alt: "Mercy in a long patterned dress standing on a dirt road, one hand on her hip, with green bushes behind her",
  },
  {
    id: "my-favourate-picture",
    group: "today",
    caption: "One of Mercy's favourite pictures.",
    alt: "Mercy in a green and white zigzag patterned dress, standing on a lawn in front of a house",
  },
  {
    id: "my-picture-1",
    group: "today",
    caption: "Mercy out in the sunshine.",
    alt: "Mercy in a white lace dress with a black handbag and gold jewellery, standing in bright sunlight in front of green hedges",
  },
  {
    id: "my-picture-2",
    group: "today",
    caption: "Mercy today.",
    alt: "Mercy seated in a white t-shirt against a pale blue winter backdrop, with a single red rose on the floor",
  },
  {
    id: "years-back",
    group: "today",
    caption: "Mercy some years back.",
    alt: "Mercy in a white top standing arm in arm with a younger girl in a teal Girls Support Girls t-shirt, outdoors",
  },
  {
    id: "some-years-back-my-picture",
    group: "today",
    caption: "Mercy some years back.",
    alt: "Mercy with a pink bow in her hair and earphones around her neck, arms folded in a floral top with a white collar",
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
    title: "For her mum",
    caption: "Mercy made this for her mother.",
    group: "family",
    alt: "Video still of Mercy smiling beside her mother",
  },
  {
    id: "me-worshiping-at-church",
    file: "ME WORSHIPING AT CHURCH.mp4",
    title: "Worshipping at church",
    caption: "Mercy worshipping at church. Her Christian faith is an important part of her life.",
    group: "faith",
    alt: "Video still of Mercy worshipping at church",
  },
  {
    id: "my-studio-song",
    file: "MY STUDIO SONG.mp4",
    title: "In the studio",
    caption: "Mercy singing in the studio. She wants to become a good gospel musician.",
    group: "music",
    alt: "Video still of Mercy singing into a microphone in a recording studio",
  },
  {
    id: "happy-moment-with-friends",
    file: "HAPPY MOMENT WITH FRIENDS.mp4",
    title: "A happy moment with friends",
    caption: "Mercy and her friend Rachael.",
    group: "people",
    alt: "Video still of two friends laughing together",
  },
  {
    id: "my-family-and-friends",
    file: "MY FAMILY AND FRIENDS.mp4",
    title: "My family and friends",
    caption: "Mercy with her family and friends.",
    group: "people",
    alt: "Video still of Mercy in a floral top standing outdoors",
  },
  {
    id: "some-years-back-and-up-to-today",
    file: "SOME YEARS BACK AND UP TO TODAY.mp4",
    title: "Then, and now",
    caption: "Some years back, and up to today.",
    group: "today",
    alt: "Video still of Mercy in a white top seated in a decorated hall",
  },
  {
    id: "myself-now",
    file: "MYSELF NOW.mp4",
    title: "Mercy now",
    caption: "Mercy, as she is today.",
    group: "today",
    alt: "Video still of Mercy in a patterned top taking a selfie indoors",
  },
  {
    id: "me-currently-flexing",
    file: "ME CURRENTLY FLEXING.mp4",
    title: "Me currently flexing",
    caption: "Mercy flexing for the camera.",
    group: "today",
    alt: "Video still of Mercy flexing in a patterned headwrap",
  },
  {
    id: "me-flexing-small",
    file: "ME FLEXING SMALL.mp4",
    title: "Me flexing small",
    caption: "Mercy flexing for the camera.",
    group: "today",
    alt: "Video still of Mercy flexing in a patterned headwrap",
  },
  {
    id: "my-video-1",
    file: "MY VIDEO 1.mp4",
    title: "Mercy at home",
    caption: "Mercy at home.",
    group: "today",
    alt: "Video still of Mercy in a green patterned top indoors",
  },
  {
    id: "my-selfie-video-1",
    file: "MY SELFIE VIDEO 1.mp4",
    title: "A selfie moment",
    caption: "A selfie Mercy took of herself.",
    group: "today",
    alt: "Video still of Mercy smiling in a patterned top",
  },
  {
    id: "my-video-2",
    file: "MY VIDEO  2.mp4",
    title: "Mercy at home",
    caption: "Mercy smiling at the camera.",
    group: "today",
    alt: "Video still of Mercy smiling in a patterned top",
  },
  {
    id: "my-video-in-smilling-mood",
    file: "MY VIDEO IN SMILLING MOOD.mp4",
    title: "In a smiling mood",
    caption: "Mercy in a good mood.",
    group: "today",
    alt: "Video still of Mercy smiling at the camera",
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
