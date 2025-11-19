import * as React from "react";

// Détecte si l'appareil est une tablette (iPad principalement)
// iPad Air 11" a une largeur de 820px en portrait, 1180px en paysage
const TABLET_MIN_WIDTH = 768;
const TABLET_MAX_WIDTH = 1024;

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkIsTablet = () => {
      const width = window.innerWidth;
      const isTabletSize = width >= TABLET_MIN_WIDTH && width <= TABLET_MAX_WIDTH;
      const isIpad = /iPad|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document;
      setIsTablet(isTabletSize || isIpad);
    };

    checkIsTablet();
    window.addEventListener("resize", checkIsTablet);
    return () => window.removeEventListener("resize", checkIsTablet);
  }, []);

  return !!isTablet;
}
