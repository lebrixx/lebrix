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
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [volume, setVolume] = useState(0.3);

  // Charger les préférences depuis localStorage au montage
  useEffect(() => {
    const savedEnabled = localStorage.getItem('luckyStopMusicEnabled');
    const savedVolume = localStorage.getItem('luckyStopMusicVolume');
    
    // Si jamais sauvegardé, activer par défaut
    if (savedEnabled === null) {
      setIsMusicEnabled(true);
      localStorage.setItem('luckyStopMusicEnabled', 'true');
    } else {
      setIsMusicEnabled(savedEnabled === 'true');
    }
    
    if (savedVolume !== null) {
      setVolume(parseFloat(savedVolume));
    }
  }, []);

  // Initialiser l'audio
  useEffect(() => {
    const audio = new Audio(MUSIC_URL);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
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
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
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
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => setIsPlaying(true)).catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isMusicEnabled]);

  const toggleMusic = useCallback(() => {
    setIsMusicEnabled(prev => {
      const newEnabled = !prev;
      localStorage.setItem('luckyStopMusicEnabled', String(newEnabled));
      return newEnabled;
    });
  }, []);

  const setMusicVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    localStorage.setItem('luckyStopMusicVolume', String(clampedVolume));
  }, []);

  const play = useCallback(() => {
    if (audioRef.current && isMusicEnabled) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => {});
      }
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
