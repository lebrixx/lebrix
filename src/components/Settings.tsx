import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Bell, BellOff } from 'lucide-react';

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
            Réglages
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
                Son
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
                Notifications quotidiennes
              </Label>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>

          <div className="text-xs text-text-muted text-center pt-2">
            Une notification par jour car le classement n'attend que toi 🎮
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          Fermer
        </Button>
      </DialogContent>
    </Dialog>
  );
};