/**
 * Renders "Happy Birthday to You" to a 16-bit PCM WAV buffer.
 *
 * The site used to play the tune live through the Web Audio API using plain
 * sine and triangle oscillators. That is fine for proving a button works, but
 * it sounds like a test tone rather than a gift. This renders a proper piano
 * tone instead - additive synthesis with a decaying harmonic series, where
 * the upper harmonics die away faster than the fundamental, which is what makes
 * a struck string sound like a struck string - plus chord accompaniment and a
 * light reverb.
 *
 * Everything is generated at build time, so no audio binary is committed and
 * the file is byte-for-byte reproducible.
 *
 * Notes on the arrangement: the melody is the canonical "Happy Birthday to You"
 * in C major, one line per row. The chords are a plain I-V-vi-IV-V-I sort of
 * walk underneath it. Nothing here is sampled or licensed - it is arithmetic.
 */

/* A quarter note is 0.5s (120bpm), which is the tempo the song is normally
   sung at and the reason the whole piece lands near twelve seconds. */
const BEAT = 0.5;
const SAMPLE_RATE = 32000;   /* plenty for a piano tone, and half the bytes of 44.1k */
const TAIL = 2.2;            /* seconds of decay/reverb left after the last note */

const FREQ = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
};

/* [note, beats] - "Hap-py  birth-day  to   you" and so on. */
const MELODY = [
  ["G4", 0.5], ["G4", 0.5], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
  ["G4", 0.5], ["G4", 0.5], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
  ["G4", 0.5], ["G4", 0.5], ["G5", 1.5], ["E5", 0.5], ["C5", 1], ["B4", 0.5], ["A4", 1],
  ["F5", 0.5], ["F5", 0.5], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 2],
];

/* Chord bed: [start beat, length in beats, [notes...]] */
const CHORDS = [
  [0, 6, ["C3", "E3", "G3", "C4"]],
  [6, 6, ["G3", "B3", "D4", "G4"]],
  [12, 3.5, ["C3", "E3", "G3", "C4"]],
  [15.5, 2, ["F3", "A3", "C4", "F4"]],
  [17.5, 3, ["F3", "A3", "C4", "F4"]],
  [20.5, 1, ["G3", "B3", "D4", "G4"]],
  [21.5, 2.2, ["C3", "E3", "G3", "C4"]],
];

/**
 * Add one struck-string note to `buf`.
 *
 * Additive synthesis: a stack of harmonics whose amplitudes fall off roughly
 * as 1/n^1.35 and whose decay times shorten as the harmonic number rises. The
 * fast-decaying brightness is the difference between "piano" and "organ".
 */
function strike(buf, freq, startSec, durSec, gain, { decay = 1, attack = 0.004, harmonics = 10 } = {}) {
  const start = Math.round(startSec * SAMPLE_RATE);
  if (start < 0) return;
  const len = Math.round(durSec * SAMPLE_RATE);
  for (let h = 1; h <= harmonics; h++) {
    const amp = gain / Math.pow(h, 1.35);
    if (amp < 1e-4) break;
    /* Higher partials die first, exactly like a real string. */
    const tau = (2.6 / (1 + 0.5 * (h - 1))) * decay;
    const step = (2 * Math.PI * freq * h) / SAMPLE_RATE;
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      if (idx >= buf.length) break;
      const t = i / SAMPLE_RATE;
      const env = Math.min(1, t / attack) * Math.exp(-t / tau);
      buf[idx] += amp * env * Math.sin(step * i);
    }
  }
}

/** Cheap Schroeder-ish reverb: a few decaying delay taps. */
function reverb(buf, delayMs, decay, taps) {
  for (let t = 1; t <= taps; t++) {
    const d = Math.round((delayMs * t) / 1000 * SAMPLE_RATE);
    if (d <= 0 || d >= buf.length) continue;
    const g = Math.pow(decay, t) * 0.5;
    for (let i = d; i < buf.length; i++) buf[i] += buf[i - d] * g;
  }
}

/** Wrap 16-bit PCM samples in a canonical RIFF/WAVE header. */
function toWav(samples) {
  const dataBytes = samples.length * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);          /* PCM chunk size */
  buf.writeUInt16LE(1, 20);           /* format = PCM */
  buf.writeUInt16LE(1, 22);           /* mono */
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);   /* byte rate */
  buf.writeUInt16LE(2, 32);           /* block align */
  buf.writeUInt16LE(16, 34);          /* bits per sample */
  buf.write("data", 36);
  buf.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return buf;
}

/** Render the whole piece. Returns a WAV Buffer. */
export function renderSong() {
  let totalBeats = 0;
  for (const [, beats] of MELODY) totalBeats += beats;
  const seconds = totalBeats * BEAT + TAIL;
  const buf = new Float64Array(Math.ceil(seconds * SAMPLE_RATE));

  /* Chord bed first, so the melody sits on top of it. */
  for (const [startBeat, lenBeats, notes] of CHORDS) {
    for (const n of notes) {
      strike(buf, FREQ[n], startBeat * BEAT, lenBeats * BEAT + 1.4, 0.085, { decay: 1.5, attack: 0.02 });
    }
  }

  /* Melody. */
  let t = 0;
  for (const [name, beats] of MELODY) {
    const dur = beats * BEAT;
    strike(buf, FREQ[name], t, dur + 0.5, 0.34, { decay: dur > 1 ? 1.25 : 0.8 });
    t += dur;
  }

  reverb(buf, 61, 0.52, 6);

  /* Normalise with a little headroom, then soften any peaks. */
  let peak = 0;
  for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
  const norm = peak > 0 ? 0.89 / peak : 1;
  for (let i = 0; i < buf.length; i++) {
    const v = buf[i] * norm;
    buf[i] = Math.tanh(v * 1.15) * 0.94;   /* gentle saturation */
  }

  return toWav(buf);
}

export const SONG_SECONDS = MELODY.reduce((a, [, b]) => a + b, 0) * BEAT;
