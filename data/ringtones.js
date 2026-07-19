// Bundled alarm ringtones (Nokia "Tones 2015" set, converted to WAV).
// The `id` is stored per-alarm; `module` is the require() handle expo-av loads.
export const RINGTONES = [
  { id: "afternoon", name: "Afternoon", module: require("../assets/sounds/afternoon.wav") },
  { id: "beep", name: "Beep", module: require("../assets/sounds/beep.wav") },
  { id: "bird-box", name: "Bird Box", module: require("../assets/sounds/bird-box.wav") },
  { id: "bouncey-bounce", name: "Bouncey Bounce", module: require("../assets/sounds/bouncey-bounce.wav") },
  { id: "breeze", name: "Breeze", module: require("../assets/sounds/breeze.wav") },
  { id: "brikabrak", name: "Brikabrak", module: require("../assets/sounds/brikabrak.wav") },
  { id: "candy", name: "Candy", module: require("../assets/sounds/candy.wav") },
  { id: "concierge", name: "Concierge", module: require("../assets/sounds/concierge.wav") },
  { id: "exoplanet", name: "Exoplanet", module: require("../assets/sounds/exoplanet.wav") },
  { id: "friendship", name: "Friendship", module: require("../assets/sounds/friendship.wav") },
  { id: "ice", name: "Ice", module: require("../assets/sounds/ice.wav") },
  { id: "keypumper", name: "Keypumper", module: require("../assets/sounds/keypumper.wav") },
  { id: "kick", name: "Kick", module: require("../assets/sounds/kick.wav") },
  { id: "konke", name: "Konke", module: require("../assets/sounds/konke.wav") },
  { id: "lean-forward", name: "Lean Forward", module: require("../assets/sounds/lean-forward.wav") },
  { id: "lord-of-trance", name: "Lord Of Trance", module: require("../assets/sounds/lord-of-trance.wav") },
  { id: "marbles", name: "Marbles", module: require("../assets/sounds/marbles.wav") },
  { id: "mbira", name: "Mbira", module: require("../assets/sounds/mbira.wav") },
  { id: "miniature-of-troy", name: "Miniature Of Troy", module: require("../assets/sounds/miniature-of-troy.wav") },
  { id: "nevada", name: "Nevada", module: require("../assets/sounds/nevada.wav") },
  { id: "nostalgia", name: "Nostalgia", module: require("../assets/sounds/nostalgia.wav") },
  { id: "on-the-bridge", name: "On The Bridge", module: require("../assets/sounds/on-the-bridge.wav") },
  { id: "ringing", name: "Ringing", module: require("../assets/sounds/ringing.wav") },
  { id: "silver", name: "Silver", module: require("../assets/sounds/silver.wav") },
  { id: "that-girl-from-copenhagen", name: "That Girl From Copenhagen", module: require("../assets/sounds/that-girl-from-copenhagen.wav") },
  { id: "the-shakes", name: "The Shakes", module: require("../assets/sounds/the-shakes.wav") },
  { id: "two-cats", name: "Two Cats", module: require("../assets/sounds/two-cats.wav") },
  { id: "universe", name: "Universe", module: require("../assets/sounds/universe.wav") },
  { id: "urban-tea", name: "Urban Tea", module: require("../assets/sounds/urban-tea.wav") },
  { id: "zen", name: "Zen", module: require("../assets/sounds/zen.wav") },
];

export const DEFAULT_RINGTONE = "afternoon";

export const getRingtone = (id) =>
  RINGTONES.find((r) => r.id === id) || RINGTONES[0];
