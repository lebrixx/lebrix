// Performance optimization utilities for mobile app
export const optimizeForMobile = () => {
  // Prevent zoom on double tap for iOS
  let lastTouchEnd = 0;
  document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  }, false);

  // Prevent scrolling on body
  document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
  }, { passive: false });

  // Optimize viewport for mobile
  const viewport = document.querySelector('meta[name=viewport]');
  if (viewport) {
    viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content');
  }
};

// Initialize performance optimizations when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeForMobile);
  } else {
    optimizeForMobile();
  }
}