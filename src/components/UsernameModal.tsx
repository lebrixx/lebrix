import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidUsername, generateDefaultUsername, canChangeUsername, getRemainingUsernameChanges, getUsername } from '@/utils/localIdentity';
import { setUsernameForScores } from '@/utils/scoresApi';
import { User, AlertTriangle } from 'lucide-react';
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

interface UsernameModalProps {
  isOpen: boolean;
  onUsernameSet: () => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, onUsernameSet }) => {
  const currentUsername = getUsername();
  const [username, setUsername] = useState(currentUsername || generateDefaultUsername());
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];

  const isFirstUsername = !currentUsername;
  const remainingChanges = getRemainingUsernameChanges();
  const canChange = canChangeUsername();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidUsername(username)) {
      setError(t.usernameError);
      return;
    }

    // Vérifier si le pseudo est identique
    if (currentUsername && username === currentUsername) {
      setError('Ce pseudo est déjà le tien');
      return;
    }

    // Vérifier la limite de changements
    if (!isFirstUsername && !canChange) {
      setError('Tu as atteint la limite de changements de pseudo (2 max)');
      return;
    }

    // Afficher la confirmation
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
        setError('Tu as atteint la limite de changements de pseudo (2 max)');
      } else {
        setError(t.saveError);
      }
      setShowConfirmation(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setError('');
  };

  return (
    <Dialog open={isOpen}>
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
          
          {/* Afficher le nombre de changements restants si ce n'est pas le premier pseudo */}
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
          <Input
            id="username"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder={t.usernamePlaceholder}
            className="bg-background border-wheel-border text-text-primary"
            maxLength={16}
            autoFocus
            disabled={!isFirstUsername && !canChange}
          />
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
              disabled={!isFirstUsername && !canChange}
            >
              {t.validateLabel}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Dialogue de confirmation */}
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
                  ? 'Tu pourras changer ton pseudo 2 fois maximum après cette première inscription.'
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