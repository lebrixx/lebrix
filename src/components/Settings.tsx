import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Bell, BellOff, Languages } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage, translations, Language } from '@/hooks/useLanguage';

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
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
    
    if (notificationsEnabled) {
      // Importer et activer les notifications
      import('@/utils/notifications').then(({ requestNotificationPermission, scheduleDailyNotification }) => {
        requestNotificationPermission().then(granted => {
          if (granted) {
            scheduleDailyNotification();
          }
        });
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