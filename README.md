# Mercy — A Story Worth Celebrating

A personalized, cinematic, interactive digital birthday and life-story web experience celebrating Mercy, told in her own authentic first-person voice and concluding with a warm personal dedication from her best friend, Robert.

## Architectural Highlights

- **First-Person Authentic Storytelling**: Chapters 01 through 09 are written strictly in Mercy's authentic voice ("I", "my", "myself"), reflecting her Christian foundation, memories of school, love for her family and friends, spiritual mentors, music ministry, and life dreams.
- **Robert's Dedication Transition**: Chapter 11 & 12 seamlessly transition from Mercy's narrative into a touching birthday tribute from Robert.
- **Color System**: White foundation (#FAFAF9 / #FFFFFF) with dusty blush rose accents (#D47A90) and royal slate/navy blue typography (#1E3A5F / #0B1624).
- **Music Playback**: The embedded studio recording starts from an explicit tap, remains unmuted, uses inline iPhone playback, and shows retry guidance if a phone blocks playback.
- **Accessible Video Player**: Shared native `<dialog>` modal with lazy loading (`preload="none"` / `preload="metadata"`) ensuring mobile Safari and Android devices stay crash-free across all 13 MP4 media clips.
- **Physics-Based Celebration**: High-performance HTML5 Canvas confetti generator with custom velocity, rotation, gravity, and prefers-reduced-motion support.
- **Birthday Frame**: A responsive fixed garland, balloon clusters, ribbon border, and sparkles surround the story on desktop and mobile without blocking interaction.
- **The Secret Blessing**: Interactive wax seal ("M") revealing Numbers 6:24–26 as an Easter egg.
- **Phone App Experience**: Native share fallback, install guidance, saved reading position, quick chapter navigation, connection status, lifecycle-aware media pausing, and full-screen video controls.

## Directory Structure

```
MERCY'S BIRTHDAY/
├── assets/
│   ├── icons/           # Home-screen and favicon app artwork
│   ├── images/          # 26 personal photos (verified and organized)
│   └── videos/          # 13 authentic video moments
├── css/
│   ├── variables.css    # Color tokens, typographic fluid clamps, spacing
│   ├── base.css         # Reset, typography, skip link, accessibility
│   ├── components.css   # Buttons, cards, modal dialog, audio controls
│   ├── sections.css     # Chapters 00 through 12 layout and styles
│   ├── montage.css      # Curated cinematic memory reel
│   └── responsive.css   # Mobile, tablet, and desktop media queries
├── js/
│   ├── data.js          # Frozen first-person narrative registry and asset registry
│   └── main.js          # Controller, Web Audio synthesizer, canvas confetti, modal
├── index.html           # Accessible semantic markup
└── README.md            # Project documentation and engineering notes
```

## Content Notes

The main story is written in first-person form using the supplied information. Robert's final dedication is intentionally marked as an editable placeholder until his personal message is provided. The best-friend asset filename contains "Elisha" while the supplied project brief names Elijah Owusu Asante; the brief is currently used for visible copy and the original filename is preserved.

The memory reel is a browser-based cinematic storyboard using selected local media. It does not generate or autoplay a separate rendered video file.

## Running the Project

Open `index.html` directly in any modern web browser, or serve it via a local static HTTP server:

```powershell
# Using Python
python -m http.server 8000

# Using Node.js npx serve
npx serve .
```

## Install on Mercy's phone

1. Host this folder on an HTTPS static host (GitHub Pages, Netlify, Cloudflare Pages, or similar). A `file://` copy on a computer cannot be installed on a phone.
2. Open the hosted HTTPS address in Safari on iPhone (or Chrome on Android).
3. On iPhone, tap **Share → Add to Home Screen**. On Android, use **Install app** or the browser menu's **Add to Home Screen**.
4. Open **Mercy** from her Home Screen. It launches in standalone mode and caches the app shell for quicker/offline opening.

The soundtrack starts only after a tap because iPhone and Android block unprompted autoplay. If it remains quiet, close any other audio, raise the phone media volume, and tap the video/play control once. Three source clips (`ME CURRENTLY FLEXING.mp4`, `ME FLEXING SMALL.mp4`, and `MYSELF NOW.mp4`) have no audio stream in the supplied MP4 files and therefore cannot play sound.

