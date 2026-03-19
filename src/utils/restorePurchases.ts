import { Capacitor } from '@capacitor/core';
import { purchasePremiumPack } from '@/utils/seasonPass';
import { PREMIUM_PRODUCT_ID } from '@/utils/productIds';

const PRODUCT_ID = PREMIUM_PRODUCT_ID;

/**
 * Restore purchases from the native store (iOS App Store / Google Play).
 * Uses @capgo/native-purchases (StoreKit 2 / Google Play Billing).
 * Returns: 'restored' | 'none' | 'error'
 */
export async function restorePurchases(): Promise<'restored' | 'none' | 'error'> {
  // Already premium? No need to restore
  if (localStorage.getItem('ls_premium_no_ads') === 'true') {
    return 'restored';
  }

  // Only run native restoration on actual devices
  if (!Capacitor.isNativePlatform()) {
    console.warn('[restorePurchases] Not on native platform, skipping store check');
    return 'none';
  }

  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');

    // Restore purchases replays historical purchases from the store
    await NativePurchases.restorePurchases();

    // After restoring, check if the premium product is in the purchase history
    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.INAPP,
    });

    const hasPremium = purchases?.some(
      (p: any) => p.productIdentifier === PRODUCT_ID
    );

    if (hasPremium) {
      // Re-activate all premium benefits locally
      const result = purchasePremiumPack();
      localStorage.setItem('ls_premium_no_ads', 'true');
      console.log('[restorePurchases] Premium restored successfully', result);
      return 'restored';
    }

    return 'none';
  } catch (error) {
    console.error('[restorePurchases] Error restoring purchases:', error);
    return 'error';
  }
}
