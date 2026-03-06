import { Capacitor } from '@capacitor/core';
import { purchasePremiumPack } from '@/utils/seasonPass';

/**
 * Restore purchases from the native store (iOS App Store / Google Play).
 * Uses @capgo/capacitor-purchases (RevenueCat) when available.
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
    // Dynamically import to avoid crashes on web
    const { CapacitorPurchases } = await import('@capgo/capacitor-purchases');

    const { customerInfo } = await CapacitorPurchases.restorePurchases();

    // Check if the premium entitlement is active
    // Adjust the entitlement identifier to match your RevenueCat config
    const premiumEntitlement = customerInfo.entitlements.active['premium'] 
      ?? customerInfo.entitlements.active['premium_pack'];

    if (premiumEntitlement) {
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
