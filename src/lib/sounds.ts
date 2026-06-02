'use client';

const SOUNDS = {
  complete: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  timer_end: 'https://assets.mixkit.co/active_storage/sfx/1084/1084-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
};

export const playSound = (sound: keyof typeof SOUNDS) => {
  if (typeof Audio === 'undefined') return;
  const audio = new Audio(SOUNDS[sound]);
  audio.volume = 0.4;
  void audio.play().catch(() => {
    // Ignore autoplay errors
  });
};
