import { useCallback, useRef, useState, useEffect } from 'react';

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

  // Synchroniser avec localStorage en cas de changement externe
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('luckyStopMuted');
      setIsMuted(saved === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback((): AudioContext => {
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext);
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new Ctor();
    }
    return audioContextRef.current;
  }, []);

  const ensureAudioRunning = useCallback(async (): Promise<AudioContext> => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Resume may fail without a user gesture; will retry on next interaction
      }
    }
    return ctx;
  }, [getAudioContext]);

  const createTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (isMuted) return;

    (async () => {
      try {
        const audioContext = await ensureAudioRunning();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = type;

        const now = audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
      } catch (error) {
        console.warn('Audio not supported:', error);
      }
    })();
  }, [isMuted, ensureAudioRunning]);

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