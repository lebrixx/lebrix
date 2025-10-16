import { Ads } from './AdService';
import { BoostType } from '@/types/boosts';

export type RewardKind = 'revive' | 'boost1' | 'boost2' | 'boost3' | 'coins80' | 'ticket';

interface RewardHandlers {
  onRevive?: () => void;
  onBoost?: (boostId: BoostType) => void;
  onCoins?: (amount: number) => void;
  onTicket?: (amount: number) => void;
  showToast: (title: string, description: string, variant?: 'default' | 'destructive') => void;
}

// État pour gérer le revive (1x par partie)
let reviveUsedThisRun = false;

export function resetReviveFlag() {
  reviveUsedThisRun = false;
}

export async function showRewardedFor(
  kind: RewardKind,
  handlers: RewardHandlers
): Promise<boolean> {
  const { onRevive, onBoost, onCoins, onTicket, showToast } = handlers;

  // Vérifications d'éligibilité
  if (kind === 'revive' && reviveUsedThisRun) {
    showToast(
      "Revive déjà utilisé",
      "Tu ne peux revivre qu'une seule fois par partie.",
      'destructive'
    );
    return false;
  }

  if (!Ads.isReady()) {
    const cooldown = Ads.getCooldownRemaining();
    if (cooldown > 0) {
      showToast(
        "Pub en cooldown",
        `Réessaye dans ${cooldown} secondes.`,
        'destructive'
      );
    } else {
      showToast(
        "Pub indisponible",
        "La pub n'est pas encore prête. Réessaye dans quelques instants.",
        'destructive'
      );
    }
    return false;
  }

  // Afficher la pub
  try {
    const success = await Ads.showRewarded(kind);

    if (success) {
      // Appliquer la récompense selon le type
      switch (kind) {
        case 'revive':
          if (onRevive) {
            onRevive();
            reviveUsedThisRun = true;
            showToast("Revive activé !", "Tu as été ramené à la vie !");
          }
          break;

        case 'boost1':
          if (onBoost) {
            onBoost('shield');
            showToast("Boost reçu !", "Tu as reçu un Bouclier 🛡️");
          }
          break;

        case 'boost2':
          if (onBoost) {
            onBoost('bigger_zone');
            showToast("Boost reçu !", "Tu as reçu une Zone plus grande 🎯");
          }
          break;

        case 'boost3':
          if (onBoost) {
            onBoost('start_20');
            showToast("Boost reçu !", "Tu as reçu un Démarrage à 20 🚀");
          }
          break;

        case 'coins80':
          if (onCoins) {
            onCoins(80);
            showToast("Coins reçus !", "Tu as reçu 80 coins ! 🪙");
          }
          break;

        case 'ticket':
          if (onTicket) {
            onTicket(1);
            showToast("Ticket reçu !", "Tu as reçu 1 ticket pour le mode Expert ! 🎫");
          }
          break;
      }

      return true;
    } else {
      showToast(
        "Pub annulée",
        "Tu n'as pas reçu la récompense car la pub n'a pas été complétée.",
        'destructive'
      );
      return false;
    }
  } catch (error) {
    console.error('Error showing rewarded ad:', error);
    showToast(
      "Erreur",
      "Une erreur s'est produite. Réessaye plus tard.",
      'destructive'
    );
    return false;
  }
}
