import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage, translations } from '@/hooks/useLanguage';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Download } from 'lucide-react';

// ⚠️ INCRÉMENTE cette valeur à chaque nouvelle release soumise aux stores
const CURRENT_APP_VERSION = '1.0.0';

const STORE_URLS = {
  ios: 'https://apps.apple.com/app/idTON_APP_ID', // TODO: remplace par ton vrai lien App Store
  android: 'https://play.google.com/store/apps/details?id=com.bryangouzou.luckystop',
};

function compareVersions(current: string, minimum: string): boolean {
  const c = current.split('.').map(Number);
  const m = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((c[i] || 0) < (m[i] || 0)) return true;
    if ((c[i] || 0) > (m[i] || 0)) return false;
  }
  return false;
}

export const ForceUpdate: React.FC = () => {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];

  useEffect(() => {
    // Only check on native platforms
    if (!Capacitor.isNativePlatform()) return;

    const checkVersion = async () => {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('value')
          .eq('key', 'min_version')
          .single();

        if (error || !data) return;

        const minVersion = data.value;
        if (compareVersions(CURRENT_APP_VERSION, minVersion)) {
          setNeedsUpdate(true);
        }
      } catch (err) {
        console.error('[ForceUpdate] check failed:', err);
      }
    };

    checkVersion();
  }, []);

  const handleUpdate = () => {
    const platform = Capacitor.getPlatform();
    const url = platform === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
    window.open(url, '_blank');
  };

  if (!needsUpdate) return null;

  const updateTitle = language === 'fr'
    ? 'Nouvelle mise à jour disponible'
    : language === 'es'
      ? 'Nueva actualización disponible'
      : 'New update available';

  const updateDesc = language === 'fr'
    ? 'Une nouvelle version du jeu est disponible. Mets à jour pour continuer à jouer !'
    : language === 'es'
      ? '¡Una nueva versión del juego está disponible. Actualiza para seguir jugando!'
      : 'A new version of the game is available. Update to keep playing!';

  const updateBtn = language === 'fr'
    ? 'Mettre à jour'
    : language === 'es'
      ? 'Actualizar'
      : 'Update';

  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="sm:max-w-md bg-button-bg border-wheel-border">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Download className="w-8 h-8 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-text-primary text-center text-xl">
            {updateTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-text-muted text-center">
            {updateDesc}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogAction
            onClick={handleUpdate}
            className="w-full bg-gradient-primary hover:opacity-90 text-white"
          >
            {updateBtn}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
