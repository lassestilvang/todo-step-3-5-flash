/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('sounds', () => {
  let mockAudioInstance: {
    volume: number;
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
  };
  let originalAudio: typeof Audio;

  beforeEach(() => {
    originalAudio = global.Audio;
    mockAudioInstance = {
      volume: 1,
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
    };
  });

  afterEach(() => {
    global.Audio = originalAudio;
    vi.clearAllMocks();
  });

  it('should play complete sound', async () => {
    const MockAudio = function () {
      return mockAudioInstance;
    };
    global.Audio = MockAudio as any;

    const { playSound } = await import('@/lib/sounds');

    await playSound('complete');

    expect(mockAudioInstance.volume).toBe(0.4);
    expect(mockAudioInstance.play).toHaveBeenCalled();
  });

  it('should play timer_end sound', async () => {
    const MockAudio = function () {
      return mockAudioInstance;
    };
    global.Audio = MockAudio as any;

    const { playSound } = await import('@/lib/sounds');

    await playSound('timer_end');

    expect(mockAudioInstance.play).toHaveBeenCalled();
  });

  it('should play click sound', async () => {
    const MockAudio = function () {
      return mockAudioInstance;
    };
    global.Audio = MockAudio as any;

    const { playSound } = await import('@/lib/sounds');

    await playSound('click');

    expect(mockAudioInstance.play).toHaveBeenCalled();
  });

  it('should handle autoplay errors silently', async () => {
    const MockAudio = function () {
      return mockAudioInstance;
    };
    global.Audio = MockAudio as any;
    mockAudioInstance.play.mockRejectedValue(new Error('Autoplay prevented'));

    const { playSound } = await import('@/lib/sounds');

    await playSound('complete');

    expect(mockAudioInstance.play).toHaveBeenCalled();
  });

  it('should return early when Audio is undefined', async () => {
    const originalAudio = global.Audio;
    // @ts-expect-error - testing undefined case
    global.Audio = undefined;

    // Clear module cache to get fresh import
    vi.resetModules();
    const { playSound } = await import('@/lib/sounds');

    // Should not throw
    await playSound('complete');

    global.Audio = originalAudio;
  });

  it('should handle start, stop and get of ambient sounds', async () => {
    let mockLoop = false;
    let mockVolume = 1;
    const mockAmbientAudioInstance = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      set loop(v: boolean) { mockLoop = v; },
      get loop() { return mockLoop; },
      set volume(v: number) { mockVolume = v; },
      get volume() { return mockVolume; }
    };
    
    const MockAudio = function () {
      return mockAmbientAudioInstance;
    };
    global.Audio = MockAudio as any;

    vi.resetModules();
    const { startAmbientSound, stopAmbientSound, getActiveAmbientSound } = await import('@/lib/sounds');

    startAmbientSound('rain');
    expect(getActiveAmbientSound()).toBe('rain');
    expect(mockAmbientAudioInstance.play).toHaveBeenCalled();
    expect(mockLoop).toBe(true);
    expect(mockVolume).toBe(0.2);

    stopAmbientSound();
    expect(getActiveAmbientSound()).toBeNull();
    expect(mockAmbientAudioInstance.pause).toHaveBeenCalled();
  });
});
