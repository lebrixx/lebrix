import { useCallback, useRef, useState } from 'react';

interface SoundHook {
  playClick: () => void;
  playSuccess: (comboCount?: number) => void;
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
    // Clic court et net
    createTone(600, 0.05, 'square');
  }, [createTone]);

  const playSuccess = useCallback((comboCount: number = 1) => {
    // Ding clair avec pitch qui augmente avec le combo
    const basePitch = 800;
    const pitchIncrease = Math.min(comboCount * 50, 400); // Max +400Hz
    const frequency = basePitch + pitchIncrease;
    
    createTone(frequency, 0.15, 'sine');
    // Petit écho harmonique
    setTimeout(() => createTone(frequency * 1.5, 0.1, 'sine'), 50);
  }, [createTone]);

  const playFailure = useCallback(() => {
    // Buzz cartoon style - son plus satisfaisant d'échec
    createTone(150, 0.3, 'sawtooth');
    setTimeout(() => createTone(120, 0.2, 'sawtooth'), 150);
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