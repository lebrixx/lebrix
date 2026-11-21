import { Capacitor } from '@capacitor/core';
import { purchasePremiumPack, unlockRainbow, hasRainbowUnlocked } from '@/utils/seasonPass';
import { PREMIUM_PRODUCT_ID, RAINBOW_PRODUCT_ID } from '@/utils/productIds';

export const PREMIUM_FLAG = 'ls_premium_no_ads';
/** Le contenu du pack Premium (paliers, boosts) n'est crédité qu'une fois par installation. */
export const PREMIUM_PACK_GRANTED = 'ls_premium_pack_granted';

/** Active les avantages Premium. Le contenu du pack n'est donné qu'une fois, le « sans pub » est toujours réactivé. */
export function grantPremium(): { coins: number; firstGrant: boolean } {
  // Un joueur déjà Premium avant cette version a déjà reçu le pack.
  const firstGrant = localStorage.getItem(PREMIUM_PACK_GRANTED) !== 'true' && localStorage.getItem(PREMIUM_FLAG) !== 'true';
  let coins = 0;
  if (firstGrant) {
    coins = purchasePremiumPack().coins;
    localStorage.setItem(PREMIUM_PACK_GRANTED, 'true');
  }
  localStorage.setItem(PREMIUM_FLAG, 'true');
  return { coins, firstGrant };
}

const productIdOf = (p: any): string | undefined => p?.productIdentifier ?? p?.identifier ?? p?.productId;

/**
 * Restaure TOUS les achats définitifs depuis l'App Store / Google Play :
 * Pack Premium (sans pub + contenu) et couleur Multicolore.
 * Le Pack Essentiel est consommable : il n'a pas à être restauré.
 * Renvoie 'restored' si au moins un achat a été retrouvé.
 */
export async function restorePurchases(): Promise<'restored' | 'none' | 'error'> {
  if (!Capacitor.isNativePlatform()) {
    console.warn('[restorePurchases] Not on native platform, skipping store check');
    return 'none';
  }

  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');

    // Rejoue l'historique des achats du compte Store
    await NativePurchases.restorePurchases();
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
    const owned = new Set((purchases ?? []).map(productIdOf).filter(Boolean));

    let restored = false;
    if (owned.has(PREMIUM_PRODUCT_ID)) {
      grantPremium();
      restored = true;
    }
    if (owned.has(RAINBOW_PRODUCT_ID)) {
      if (!hasRainbowUnlocked()) unlockRainbow();
      restored = true;
    }
    console.log('[restorePurchases] Owned products:', [...owned], 'restored:', restored);
    return restored ? 'restored' : 'none';
  } catch (error) {
    console.error('[restorePurchases] Error restoring purchases:', error);
    return 'error';
  }
}
