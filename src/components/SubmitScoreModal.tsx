import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { submitScore } from '@/utils/scoresApi';
import { getLocalIdentity } from '@/utils/localIdentity';

interface SubmitScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  mode: string;
  onUsernameRequired: () => void;
}

export const SubmitScoreModal: React.FC<SubmitScoreModalProps> = ({ 
  isOpen, 
  onClose, 
  score, 
  mode,
  onUsernameRequired 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    const identity = getLocalIdentity();
    
    if (!identity.username) {
      onClose();
      onUsernameRequired();
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      console.log('Tentative de soumission:', { score, mode, username: getLocalIdentity().username });
      const success = await submitScore({ score, mode });
      console.log('Résultat soumission:', success);
      
      if (success) {
        setSubmitStatus('success');
        setTimeout(() => {
          onClose();
          setSubmitStatus('idle');
        }, 2000);
      } else {
        setSubmitStatus('error');
        setErrorMessage('Erreur lors de la soumission');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'USERNAME_REQUIRED') {
        onClose();
        onUsernameRequired();
        return;
      }
      
      setSubmitStatus('error');
      setErrorMessage('Serveur indisponible, réessaie plus tard');
    }
    
    setIsSubmitting(false);
  };

  const getModeDisplayName = (mode: string) => {
    const names = {
      classic: 'Classique',
      arc_changeant: 'Arc Changeant',
      survie_60s: 'Survie 30s',
      zone_mobile: 'Zone Mobile'
    };
    return names[mode as keyof typeof names] || mode;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-button-bg border-wheel-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-text-primary">
            <Trophy className="w-5 h-5 text-primary" />
            Soumettre ton score
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Score Display */}
          <div className="text-center p-6 bg-background rounded-lg border border-wheel-border">
            <div className="text-4xl font-bold text-primary mb-2">{score}</div>
            <div className="text-text-muted">Mode: {getModeDisplayName(mode)}</div>
          </div>

          {/* Submit Status */}
          {submitStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-400 justify-center">
              <CheckCircle className="w-5 h-5" />
              <span>Score soumis avec succès ✅</span>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-400 justify-center">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-wheel-border hover:bg-button-hover"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-primary hover:opacity-90"
              disabled={isSubmitting || submitStatus === 'success'}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? 'Envoi...' : 'Soumettre'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};