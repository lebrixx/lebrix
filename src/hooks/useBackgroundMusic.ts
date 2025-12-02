import { useCallback, useRef, useEffect, useState } from 'react';

interface BackgroundMusicHook {
  isPlaying: boolean;
  isMusicEnabled: boolean;
  volume: number;
  toggleMusic: () => void;
  setMusicVolume: (volume: number) => void;
  play: () => void;
  pause: () => void;
}

// URL d'une musique placeholder - remplace par ta propre musique
const MUSIC_URL = 'https://assets.mixkit.co/music/preview/mixkit-games-worldbeat-466.mp3';

export const useBackgroundMusic = (): BackgroundMusicHook => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [isMusicEnabled, setIsMusicEnabled] = useState(() => {
    const saved = localStorage.getItem('luckyStopMusicEnabled');
    return saved === null ? false : saved === 'true'; // Désactivé par défaut
  });

  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('luckyStopMusicVolume');
    return saved ? parseFloat(saved) : 0.3; // 30% par défaut
  });

  // Initialiser l'audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(MUSIC_URL);
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Synchroniser le volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Gérer la lecture selon l'état
  useEffect(() => {
    if (!audioRef.current) return;

    if (isMusicEnabled) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.warn('Autoplay bloqué, attente interaction utilisateur:', error);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isMusicEnabled]);

  // Pause quand l'app passe en arrière-plan
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!audioRef.current || !isMusicEnabled) return;
      
      if (document.hidden) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isMusicEnabled]);

  const toggleMusic = useCallback(() => {
    const newEnabled = !isMusicEnabled;
    setIsMusicEnabled(newEnabled);
    localStorage.setItem('luckyStopMusicEnabled', String(newEnabled));
  }, [isMusicEnabled]);

  const setMusicVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    localStorage.setItem('luckyStopMusicVolume', String(clampedVolume));
  }, []);

  const play = useCallback(() => {
    if (audioRef.current && isMusicEnabled) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isMusicEnabled]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  return {
    isPlaying,
    isMusicEnabled,
    volume,
    toggleMusic,
    setMusicVolume,
    play,
    pause,
  };
};
