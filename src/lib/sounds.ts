'use client';

const SOUNDS = {
  complete: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  timer_end: 'https://assets.mixkit.co/active_storage/sfx/1084/1084-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  rain: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // High quality relax loop
  lofi: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Focus ambient loop
};

let activeAmbientAudio: HTMLAudioElement | null = null;
let activeAmbientSound: string | null = null;

export const playSound = (sound: keyof typeof SOUNDS) => {
  if (typeof Audio === 'undefined') return;
  const audio = new Audio(SOUNDS[sound]);
  audio.volume = 0.4;
  void audio.play().catch(() => {
    // Ignore autoplay errors
  });
};

export const startAmbientSound = (sound: 'rain' | 'lofi') => {
  if (typeof Audio === 'undefined') return;
  
  if (activeAmbientAudio) {
    activeAmbientAudio.pause();
    activeAmbientAudio = null;
  }
  
  const audio = new Audio(SOUNDS[sound]);
  audio.volume = 0.2;
  audio.loop = true;
  activeAmbientAudio = audio;
  activeAmbientSound = sound;
  
  void audio.play().catch(() => {
    // Ignore autoplay errors
  });
};

export const stopAmbientSound = () => {
  if (activeAmbientAudio) {
    activeAmbientAudio.pause();
    activeAmbientAudio = null;
    activeAmbientSound = null;
  }
};

export const getActiveAmbientSound = () => activeAmbientSound;

