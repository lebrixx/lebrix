import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidUsername, generateDefaultUsername, canChangeUsername, getRemainingUsernameChanges, getUsername, getDeviceId } from '@/utils/localIdentity';
import { setUsernameForScores } from '@/utils/scoresApi';
import { User, AlertTriangle, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter
} from '@/components/ui/alert-dialog';
import { useLanguage, translations } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { trackSent, trackSkipped } from '@/utils/edgeFunctionMetrics';

interface UsernameModalProps {
  isOpen: boolean;
  onUsernameSet: () => void;
  onClose?: () => void;
}

// Cache: username → available (persists across modal open/close within session)
const usernameCache = new Map<string, boolean>();

export const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, onUsernameSet, onClose }) => {
  const currentUsername = getUsername();
  const [username, setUsername] = useState(currentUsername || generateDefaultUsername());
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastCheckedRef = useRef<string>('');

  const isFirstUsername = !currentUsername;
  const remainingChanges = getRemainingUsernameChanges();
  const canChange = canChangeUsername();

  // Check username availability with optimized debounce
  useEffect(() => {
    // Skip if modal is closed
    if (!isOpen) return;

    // Skip if same as current username
    if (!isFirstUsername && username === currentUsername) {
      setIsUsernameAvailable(null);
      return;
    }

    // Skip if empty or invalid
    if (!username || !isValidUsername(username)) {
      setIsUsernameAvailable(null);
      return;
    }

    const normalizedUsername = username.toLowerCase();

    // Skip if already checked this exact username
    if (lastCheckedRef.current === normalizedUsername) {
      trackSkipped('check-username', 'already-checked-same');
      return;
    }

    // Check cache first
    if (usernameCache.has(normalizedUsername)) {
      const cached = usernameCache.get(normalizedUsername)!;
      setIsUsernameAvailable(cached);
      setError(cached ? '' : 'Ce pseudo est déjà pris par un autre joueur');
      lastCheckedRef.current = normalizedUsername;
      trackSkipped('check-username', 'cache-hit');
      return;
    }

    const timer = setTimeout(async () => {
      // Abort previous request if still in flight
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        trackSkipped('check-username', 'aborted-previous');
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsCheckingUsername(true);
      try {
        trackSent('check-username');
        const { data, error: fnError } = await supabase.functions.invoke('check-username', {
          body: { username, device_id: getDeviceId() }
        });
        
        // Ignore if aborted
        if (controller.signal.aborted) return;

        if (!fnError && data) {
          setIsUsernameAvailable(data.available);
          lastCheckedRef.current = normalizedUsername;
          usernameCache.set(normalizedUsername, data.available);
          if (!data.available) {
            setError('Ce pseudo est déjà pris par un autre joueur');
          } else {
            setError('');
          }
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          console.error('Error checking username:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsCheckingUsername(false);
        }
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
      }
    }, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, [username, currentUsername, isFirstUsername, isOpen]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidUsername(username)) {
      setError(t.usernameError);
      return;
    }

    if (currentUsername && username === currentUsername) {
      setError('Ce pseudo est déjà le tien');
      return;
    }

    if (isUsernameAvailable === false) {
      setError('Ce pseudo est déjà pris par un autre joueur');
      return;
    }

    if (!isFirstUsername && !canChange) {
      setError('Tu as atteint la limite de changements de pseudo (1 max)');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmUsername = () => {
    try {
      setUsernameForScores(username);
      setShowConfirmation(false);
      
      const newRemainingChanges = getRemainingUsernameChanges();
      
      toast({
        title: t.usernameRegistered,
        description: isFirstUsername 
          ? t.usernameRegisteredDesc
          : `${t.usernameRegisteredDesc} (${newRemainingChanges} changement(s) restant(s))`,
      });
      onUsernameSet();
    } catch (err) {
      if (err instanceof Error && err.message === 'LIMIT_REACHED') {
        setError('Tu as atteint la limite de changements de pseudo (1 max)');
      } else {
        setError(t.saveError);
      }
      setShowConfirmation(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setError('');
    setIsUsernameAvailable(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="sm:max-w-md bg-button-bg border-wheel-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-text-primary">
            <User className="w-5 h-5 text-primary" />
            {t.chooseUsername}
          </DialogTitle>
        </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="text-center mb-3">
            <p className="text-sm text-primary font-medium">
              {t.useInstagram}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {t.contestsSoon}
            </p>
          </div>
          
          {!isFirstUsername && (
            <div className={`flex items-center gap-2 p-2 rounded-lg ${remainingChanges === 0 ? 'bg-red-500/20' : 'bg-yellow-500/20'}`}>
              <AlertTriangle className={`w-4 h-4 ${remainingChanges === 0 ? 'text-red-400' : 'text-yellow-400'}`} />
              <p className={`text-xs ${remainingChanges === 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                {remainingChanges === 0 
                  ? 'Tu ne peux plus changer de pseudo'
                  : `${remainingChanges} changement(s) restant(s)`}
              </p>
            </div>
          )}
          
          <Label htmlFor="username" className="text-text-primary">
            {t.usernameLabel}
          </Label>
          <div className="relative">
            <Input
              id="username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder={t.usernamePlaceholder}
              className="bg-background border-wheel-border text-text-primary pr-10"
              maxLength={16}
              autoFocus
              disabled={!isFirstUsername && !canChange}
            />
            {username && username !== currentUsername && isValidUsername(username) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingUsername ? (
                  <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
                ) : isUsernameAvailable === true ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : isUsernameAvailable === false ? (
                  <XCircle className="w-4 h-4 text-red-500" />
                ) : null}
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <p className="text-xs text-text-muted">
            {t.usernameRules}
          </p>
        </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleUsernameChange(generateDefaultUsername())}
              className="flex-1 border-wheel-border hover:bg-button-hover"
              disabled={!isFirstUsername && !canChange}
            >
              {t.random}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary hover:opacity-90"
              disabled={(!isFirstUsername && !canChange) || isCheckingUsername || isUsernameAvailable === false || (username !== currentUsername && isUsernameAvailable === null && isValidUsername(username))}
            >
              {t.validateLabel}
            </Button>
          </div>
        </form>
      </DialogContent>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-button-bg border-wheel-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary">
              {t.importantConfirmation}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary space-y-2">
              <p>
                {t.aboutToRegister} <span className="font-bold text-primary">{username}</span>
              </p>
              {!isFirstUsername && (
                <p className="text-sm text-yellow-400 font-medium">
                  ⚠️ Après cette confirmation, il te restera {remainingChanges - 1} changement(s) de pseudo.
                </p>
              )}
              <p className="text-sm text-text-primary">
                {isFirstUsername 
                  ? 'Tu pourras changer ton pseudo 1 fois maximum après cette première inscription.'
                  : t.dontChangeUsername}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="border-wheel-border hover:bg-button-hover"
            >
              {t.modify}
            </Button>
            <Button
              onClick={confirmUsername}
              className="bg-gradient-primary hover:opacity-90"
            >
              {t.confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
