import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidUsername, generateDefaultUsername } from '@/utils/localIdentity';
import { setUsernameForScores } from '@/utils/scoresApi';
import { User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter
} from '@/components/ui/alert-dialog';

interface UsernameModalProps {
  isOpen: boolean;
  onUsernameSet: () => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, onUsernameSet }) => {
  const [username, setUsername] = useState(generateDefaultUsername());
  const [error, setError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidUsername(username)) {
      setError('Le pseudo doit contenir entre 3 et 16 caractères (lettres, chiffres, underscore)');
      return;
    }

    // Afficher la confirmation
    setShowConfirmation(true);
  };

  const confirmUsername = () => {
    try {
      setUsernameForScores(username);
      setShowConfirmation(false);
      toast({
        title: "✅ Pseudo enregistré",
        description: "Ton pseudo a été enregistré avec succès !",
      });
      onUsernameSet();
    } catch (err) {
      setError('Erreur lors de la sauvegarde du pseudo');
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
            Choisir un pseudo
          </DialogTitle>
        </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="text-center mb-3">
            <p className="text-sm text-primary font-medium">
              📸 Utilise ton pseudo Instagram !
            </p>
            <p className="text-xs text-text-muted mt-1">
              Des concours et récompenses arrivent bientôt 🎁
            </p>
          </div>
          
          <Label htmlFor="username" className="text-text-primary">
            Pseudo (3-16 caractères)
          </Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="ton_pseudo_insta"
            className="bg-background border-wheel-border text-text-primary"
            maxLength={16}
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <p className="text-xs text-text-muted">
            Lettres, chiffres et underscore uniquement
          </p>
        </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleUsernameChange(generateDefaultUsername())}
              className="flex-1 border-wheel-border hover:bg-button-hover"
            >
              Aléatoire
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              Valider
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Dialogue de confirmation */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-button-bg border-wheel-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary">
              ⚠️ Confirmation importante
            </AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary space-y-3">
              <p>
                Tu es sur le point d'enregistrer le pseudo : <span className="font-bold text-primary">{username}</span>
              </p>
              <p className="text-sm">
                <strong className="text-text-primary">Important :</strong> Il est fortement recommandé de ne plus changer ton pseudo après validation pour éviter tout problème de synchronisation dans le classement.
              </p>
              <p className="text-xs text-text-muted">
                Assure-toi que c'est bien ton pseudo Instagram si tu veux participer aux futurs concours !
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="border-wheel-border hover:bg-button-hover"
            >
              Modifier
            </Button>
            <Button
              onClick={confirmUsername}
              className="bg-gradient-primary hover:opacity-90"
            >
              Confirmer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};