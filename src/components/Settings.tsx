import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Bell, BellOff, Languages, Send, Settings2, Coins } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage, translations, Language } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  isSoundMuted: boolean;
  onToggleSound: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  isOpen, 
  onClose,
  isSoundMuted,
  onToggleSound
}) => {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [isSendingTest, setIsSendingTest] = useState(false);

  const openAppSettings = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { NativeSettings, AndroidSettings, IOSSettings } = await import('capacitor-native-settings');
        if (Capacitor.getPlatform() === 'ios') {
          await NativeSettings.openIOS({ option: IOSSettings.App });
        } else {
          await NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
        }
      } catch (error) {
        console.error('Error opening settings:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'ouvrir les paramètres de l'application.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Non disponible",
        description: "Cette fonction est disponible uniquement sur mobile.",
      });
    }
  };

  const handleTestNotification = async () => {
    setIsSendingTest(true);
    try {
      const { sendTestNotification } = await import('@/utils/notifications');
      const success = await sendTestNotification();
      if (success) {
        toast({
          title: t.testNotificationSent || "Notification envoyée !",
          description: t.testNotificationSentDesc || "Vérifie tes notifications.",
        });
      } else {
        toast({
          title: t.testNotificationFailed || "Échec",
          description: t.testNotificationFailedDesc || "Autorise les notifications d'abord.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    } finally {
      setIsSendingTest(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
    if (notificationsEnabled) {
      import('@/utils/notifications').then(({ requestNotificationPermission, scheduleDailyNotification }) => {
        requestNotificationPermission().then(granted => {
          if (granted) {
            scheduleDailyNotification();
          }
        });
      });
    } else {
      import('@/utils/notifications').then(({ cancelScheduledNotification }) => {
        cancelScheduledNotification();
      });
    }
  }, [notificationsEnabled]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-button-bg border-wheel-border">
        <DialogHeader>
          <DialogTitle className="text-text-primary text-center text-xl">
            {t.settings}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Son */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isSoundMuted ? (
                <VolumeX className="w-5 h-5 text-text-muted" />
              ) : (
                <Volume2 className="w-5 h-5 text-primary" />
              )}
              <Label htmlFor="sound" className="text-text-primary text-base">
                {t.sound}
              </Label>
            </div>
            <Switch
              id="sound"
              checked={!isSoundMuted}
              onCheckedChange={onToggleSound}
            />
          </div>

          {/* Notifications */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {notificationsEnabled ? (
                  <Bell className="w-5 h-5 text-primary" />
                ) : (
                  <BellOff className="w-5 h-5 text-text-muted" />
                )}
                <Label htmlFor="notifications" className="text-text-primary text-base">
                  {t.dailyNotifications}
                </Label>
              </div>
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
            <div className="flex items-center gap-1 ml-8 text-xs text-blue-400">
              <Coins className="w-3 h-3" />
              <span>+20 coins/jour si activé</span>
            </div>
          </div>

          {/* Test Notification Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Send className="w-5 h-5 text-primary" />
              <Label className="text-text-primary text-base">
                {t.testNotification || "Tester les notifications"}
              </Label>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestNotification}
              disabled={isSendingTest}
              className="border-wheel-border hover:bg-button-hover text-text-primary"
            >
              {isSendingTest ? "..." : (t.testBtn || "Test")}
            </Button>
          </div>

          {/* Langue */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-primary" />
              <Label className="text-text-primary text-base">
                {t.language}
              </Label>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-wheel-border hover:bg-button-hover text-text-primary"
                >
                  {language.toUpperCase()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2 bg-button-bg border-wheel-border z-50 max-h-72 overflow-y-auto">
                <div className="flex flex-col gap-1">
                  {[
                    { code: 'fr', label: '🇫🇷 Français' },
                    { code: 'en', label: '🇬🇧 English' },
                    { code: 'es', label: '🇪🇸 Español' },
                    { code: 'de', label: '🇩🇪 Deutsch' },
                    { code: 'it', label: '🇮🇹 Italiano' },
                    { code: 'pt', label: '🇵🇹 Português' },
                    { code: 'ar', label: '🇸🇦 العربية' },
                    { code: 'ja', label: '🇯🇵 日本語' },
                    { code: 'zh', label: '🇨🇳 中文' },
                  ].map(({ code, label }) => (
                    <Button
                      key={code}
                      onClick={() => setLanguage(code as Language)}
                      variant={language === code ? 'default' : 'ghost'}
                      size="sm"
                      className="justify-start text-xs"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="text-xs text-text-muted text-center pt-2">
            {t.notificationDesc}
          </div>

          {/* Bouton Autorisations App */}
          {Capacitor.isNativePlatform() && (
            <div className="flex items-center justify-between pt-2 border-t border-wheel-border/30">
              <div className="flex items-center gap-3">
                <Settings2 className="w-5 h-5 text-text-muted" />
                <Label className="text-text-primary text-base">
                  Autorisations de l'app
                </Label>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={openAppSettings}
                className="border-wheel-border hover:bg-button-hover text-text-primary"
              >
                Ouvrir
              </Button>
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          {t.close}
        </Button>
      </DialogContent>
    </Dialog>
  );
};