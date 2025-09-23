import { useEffect } from 'react';

export const MobileOptimizer: React.FC = () => {
  useEffect(() => {
    // Prévenir le zoom sur les inputs (iOS Safari)
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    
    // Prévenir le scroll bounce (iOS Safari)
    const preventScroll = (e: TouchEvent) => {
      const element = e.target as HTMLElement;
      // Permettre le scroll uniquement sur les éléments scrollables
      if (!element.closest('.scroll-area, [data-scroll="true"]')) {
        e.preventDefault();
      }
    };
    
    // Optimiser les performances
    const optimizePerformance = () => {
      // Désactiver l'hover sur mobile pour éviter les états collants
      if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
      }
      
      // Améliorer la fluidité des animations
      document.documentElement.style.setProperty('--transform-gpu', 'translateZ(0)');
    };
    
    // Gérer l'orientation
    const handleOrientationChange = () => {
      // Petit délai pour que le navigateur finisse sa rotation
      setTimeout(() => {
        // Forcer un recalcul de la hauteur viewport
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      }, 100);
    };
    
    // Initialiser les optimisations
    optimizePerformance();
    handleOrientationChange();
    
    // Ajouter les event listeners
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);
  
  return null; // Composant invisible d'optimisation
};