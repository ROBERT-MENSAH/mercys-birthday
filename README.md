# Mercy — A Story Worth Celebrating

A personalized, cinematic, interactive digital birthday and life-story web experience celebrating Mercy, told in her own authentic first-person voice and concluding with a warm personal dedication from her best friend, Robert.

## Architectural Highlights

- **First-Person Authentic Storytelling**: Chapters 01 through 09 are written strictly in Mercy's authentic voice ("I", "my", "myself"), reflecting her Christian foundation, memories of school, love for her family and friends, spiritual mentors, music ministry, and life dreams.
- **Robert's Dedication Transition**: Chapter 11 & 12 seamlessly transition from Mercy's narrative into a touching birthday tribute from Robert.
- **Color System**: White foundation (#FAFAF9 / #FFFFFF) with dusty blush rose accents (#D47A90) and royal slate/navy blue typography (#1E3A5F / #0B1624).
- **Procedural Ambient Music Engine**: Zero-asset, Web Audio API procedural synthesizer playing gentle piano/meditation chords in F Major with smooth velvet envelopes and user toggle control.
- **Accessible Video Player**: Shared native `<dialog>` modal with lazy loading (`preload="none"` / `preload="metadata"`) ensuring mobile Safari and Android devices stay crash-free across all 13 MP4 media clips.
- **Physics-Based Celebration**: High-performance HTML5 Canvas confetti generator with custom velocity, rotation, gravity, and prefers-reduced-motion support.
- **The Secret Blessing**: Interactive wax seal ("M") revealing Numbers 6:24–26 as an Easter egg.

## Directory Structure

```
MERCY'S BIRTHDAY/
├── assets/
│   ├── images/          # 26 personal photos (verified and organized)
│   └── videos/          # 13 authentic video moments
├── css/
│   ├── variables.css    # Color tokens, typographic fluid clamps, spacing
│   ├── base.css         # Reset, typography, skip link, accessibility
│   ├── components.css   # Buttons, cards, modal dialog, audio controls
│   ├── sections.css     # Chapters 00 through 12 layout and styles
│   └── responsive.css   # Mobile, tablet, and desktop media queries
├── js/
│   ├── data.js          # Frozen first-person narrative registry and asset registry
│   └── main.js          # Controller, Web Audio synthesizer, canvas confetti, modal
├── index.html           # Accessible semantic markup
└── README.md            # Project documentation and engineering notes
```

## Running the Project

Open `index.html` directly in any modern web browser, or serve it via a local static HTTP server:

```powershell
# Using Python
python -m http.server 8000

# Using Node.js npx serve
npx serve .
```

