import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidUsername, generateDefaultUsername } from '@/utils/localIdentity';
import { setUsernameForScores } from '@/utils/scoresApi';
import { User } from 'lucide-react';

interface UsernameModalProps {
  isOpen: boolean;
  onUsernameSet: () => void;
}

export const UsernameModal: React.FC<UsernameModalProps> = ({ isOpen, onUsernameSet }) => {
  const [username, setUsername] = useState(generateDefaultUsername());
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidUsername(username)) {
      setError('Le pseudo doit contenir entre 3 et 16 caractères (lettres, chiffres, underscore)');
      return;
    }

    try {
      setUsernameForScores(username);
      onUsernameSet();
    } catch (err) {
      setError('Erreur lors de la sauvegarde du pseudo');
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
            <Label htmlFor="username" className="text-text-primary">
              Pseudo (3-16 caractères)
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Player1234"
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
            <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-xs text-text-secondary text-center leading-relaxed">
                💡 Mettez votre pseudo Instagram, qui sait peut-être que des concours arrivent bientôt ! 🎁
              </p>
            </div>
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
    </Dialog>
  );
};