// Bundled alarm ringtones. The `id` is stored per-alarm; `module` is the
// require() handle expo-av loads. Swap the .wav files in assets/sounds for
// higher-quality tones and keep these ids stable.
export const RINGTONES = [
  { id: 'chimes', name: 'Chimes', module: require('../assets/sounds/chimes.wav') },
  { id: 'bell', name: 'Bell', module: require('../assets/sounds/bell.wav') },
  { id: 'beeps', name: 'Beeps', module: require('../assets/sounds/beeps.wav') },
  { id: 'xylophone', name: 'Xylophone', module: require('../assets/sounds/xylophone.wav') },
  { id: 'classic', name: 'Classic', module: require('../assets/sounds/classic.wav') },
];

export const DEFAULT_RINGTONE = 'chimes';

export const getRingtone = (id) =>
  RINGTONES.find((r) => r.id === id) || RINGTONES[0];
