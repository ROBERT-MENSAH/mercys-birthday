import { readFileSync } from "node:fs";
import { photos, videos } from "./content.mjs";

/* Captions describe the picture, not the meaning. These are the phrasings the
   brief rules out. Alt text is a different job and legitimately describes the
   image, so only captions/titles/why are checked here. */
const BANNED = [
  /wearing a/i, /\bin a (blue|pink|white|red|green|purple) (dress|shirt|skirt|top)\b/i,
  /\bstanding (outside|indoors|by|next to)\b/i, /on camera\b/i, /\bclose[- ]up\b/i,
  /posing\b/i, /\bsmiling at the camera\b/i, /filming herself/i, /\bwhite shirt\b/i,
  /\bin front of\b/i, /\bbeside a\b/i, /\bwith her (friends|family)\b(?!\.)/i,
];
/* NARRATION: the story is told in Mercy's first person, so a caption that
   talks about her in the third person ("With her mother") belongs to the old
   voice and must not come back. This also catches stray "she/her" in the
   Memory Room, which is the one place captions are read outside the story. */
const THIRD_PERSON = [/\bher\b/i, /\bshe\b/i, /\bMercy's\b/];
/* Alt text used to be written as image-recognition output - dress colour,
   handbag, background. It is now written to carry the same meaning as the
   caption, so the same rules apply. These are the visual-detail words that
   mean a caption is describing the picture instead of telling the story. */
const VISUAL_NOISE = [
  /\bdress\b/i, /\bshirt\b/i, /\bskirt\b/i, /\bblazer\b/i, /\bt-?shirts?\b/i,
  /\bheadwrap\b|\bheadscarf\b|\bturban\b/i, /\bsunglasses\b/i, /\bgold\b/i,
  /\bpink\b|\bblue\b|\bgreen\b|\bred\b|\bpurple\b|\borange\b|\bteal\b|\bneon\b/i,
  /\bhandbag\b|\bpouch\b|\bbackpack\b|\bpurse\b/i, /\bgarden\b|\blawn\b|\bhedges?\b/i,
  /\bbush(es)?\b|\bgrass\b|\broad\b|\bbackground\b|\bpath\b|\bwall\b|\bfence\b/i,
  /\btree-?lined\b|\bsnow\b|\bwindow\b|\bbackdrop\b/i, /\bholding\b|\bwearing\b|\bwears\b/i,
  /\bsmiling\b|\bsmile\b|\bshe is\b|\bhe is\b|\bthey are\b|\bposed?\b/i,
  /\bbraided?\b|\be-?sized\b|\bmaroon\b|\bpatterned\b/i,
  /\bstanding (outside|indoors|by|next to)\b/i, /\bsitting\b|\bseated\b/i,
];
let bad = 0;
const scan = (kind, id, text) => {
  for (const re of BANNED) {
    if (re.test(text)) {
      console.log(`  ${kind} "${id}": ${JSON.stringify(text)} <- ${re}`);
      bad++;
    }
  }
};
const scanFirstPerson = (kind, id, text) => {
  for (const re of THIRD_PERSON) {
    if (re.test(text)) {
      console.log(`  ${kind} "${id}": ${JSON.stringify(text)} <- third person (${re})`);
      bad++;
    }
  }
};
/* Alt text is read by screen readers and spoken aloud, so it must also avoid
   the old "here is what the camera shows" phrasing. */
const scanAlt = (id, text) => {
  for (const re of VISUAL_NOISE) {
    if (re.test(text)) {
      console.log(`  alt "${id}": ${JSON.stringify(text)} <- describes the image (${re})`);
      bad++;
    }
  }
};
for (const p of photos) {
  scan("photo", p.id, p.caption);
  scanFirstPerson("photo", p.id, p.caption);
  scanAlt(p.id, p.alt);
}
for (const v of videos) {
  scan("video", v.id, v.caption);
  if (v.why) {
    scan("video.why", v.id, v.why);
    scanFirstPerson("video.why", v.id, v.why);
  }
  scanAlt(v.id, v.alt);
}

/* Identity: the Elijah photo contains only Elijah, so no caption may claim
   Mercy is in it, and the best friend must be named as such somewhere. */
const elijah = photos.find((p) => p.id === "my-best-friend-elisha-owusu-asante");
if (/mercy and/i.test(elijah.caption)) {
  console.log(`  IDENTITY: Elijah photo caption wrongly claims Mercy is in it: ${elijah.caption}`);
  bad++;
}

const caps = [...photos.map((p) => p.caption), ...videos.map((v) => v.caption)];
const dupes = caps.filter((c, i) => caps.indexOf(c) !== i);
if (dupes.length) {
  console.log("  DUPLICATE captions:", [...new Set(dupes)].join(" | "));
  bad++;
}

console.log(bad ? `\n${bad} caption problem(s).` : `\nAll ${caps.length} captions pass.`);
process.exit(bad ? 1 : 0);
