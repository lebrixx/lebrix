import { useCallback, useRef, useState } from 'react';

interface SoundHook {
  playClick: () => void;
  playSuccess: () => void;
  playFailure: () => void;
  toggleMute: () => void;
  isMuted: boolean;
}

export const useSound = (): SoundHook => {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('luckyStopMuted');
    return saved === 'true';
  });

  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const createTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (isMuted) return;

    try {
      const audioContext = getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Audio not supported:', error);
    }
  }, [isMuted, getAudioContext]);

  const playClick = useCallback(() => {
    createTone(800, 0.1, 'square');
  }, [createTone]);

  const playSuccess = useCallback(() => {
    // Success chord
    setTimeout(() => createTone(523, 0.2), 0); // C
    setTimeout(() => createTone(659, 0.2), 50); // E
    setTimeout(() => createTone(784, 0.3), 100); // G
  }, [createTone]);

  const playFailure = useCallback(() => {
    // Failure descending tone
    createTone(400, 0.15);
    setTimeout(() => createTone(350, 0.15), 100);
    setTimeout(() => createTone(300, 0.2), 200);
  }, [createTone]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('luckyStopMuted', String(newMuted));
  }, [isMuted]);

  return {
    playClick,
    playSuccess,
    playFailure,
    toggleMute,
    isMuted,
  };
};