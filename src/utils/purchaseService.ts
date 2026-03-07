import { Capacitor } from '@capacitor/core';
import { purchasePremiumPack } from '@/utils/seasonPass';

const PRODUCT_ID = 'com.luckystop.premium';
const PREMIUM_FLAG = 'ls_premium_no_ads';

/**
 * Activate all premium benefits locally after a confirmed purchase.
 */
function activatePremium(onAddCoins?: (amount: number) => void): void {
  console.log('[purchaseService] Activating premium benefits...');
  const result = purchasePremiumPack();
  localStorage.setItem(PREMIUM_FLAG, 'true');
  onAddCoins?.(result.coins);
  console.log('[purchaseService] Premium activated — coins:', result.coins, 'diamonds:', result.diamonds);
}

/**
 * Check if the user is already premium (local flag).
 */
export function isPremiumActive(): boolean {
  return localStorage.getItem(PREMIUM_FLAG) === 'true';
}

/**
 * Purchase the Premium Pack via native IAP (StoreKit 2 / Google Play Billing).
 * Uses @capgo/native-purchases — compatible with Capacitor 7.
 * Returns 'purchased' | 'cancelled' | 'error'
 */
export async function purchasePremiumNative(
  onAddCoins?: (amount: number) => void
): Promise<'purchased' | 'cancelled' | 'error'> {
  // Already premium
  if (isPremiumActive()) {
    return 'purchased';
  }

  // On web, fall back to direct unlock (dev/testing)
  if (!Capacitor.isNativePlatform()) {
    console.warn('[purchaseService] Not on native platform — direct unlock for testing');
    activatePremium(onAddCoins);
    return 'purchased';
  }

  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');

    // Verify billing is available
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) {
      console.error('[purchaseService] Billing not supported on this device');
      return 'error';
    }

    // Initiate the native purchase flow
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
    });

    if (result.transactionId) {
      activatePremium(onAddCoins);
      console.log('[purchaseService] Purchase successful, premium activated', result.transactionId);
      return 'purchased';
    }

    console.warn('[purchaseService] Purchase completed but no transaction returned');
    return 'error';
  } catch (error: any) {
    // User cancelled the purchase
    if (
      error?.code === 'PURCHASE_CANCELLED' ||
      error?.code === '1' ||
      error?.message?.toLowerCase()?.includes('cancel')
    ) {
      console.log('[purchaseService] Purchase cancelled by user');
      return 'cancelled';
    }
    console.error('[purchaseService] Purchase error:', error);
    return 'error';
  }
}

/**
 * Verify premium status on app launch by checking past purchases.
 * Silently re-activates premium if the user owns it.
 */
export async function verifyPremiumOnLaunch(): Promise<void> {
  // Skip on web
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');

    const { purchases } = await NativePurchases.getPurchases({
      productType: PURCHASE_TYPE.INAPP,
    });

    const hasPremium = purchases?.some(
      (p: any) => p.productIdentifier === PRODUCT_ID
    );

    if (hasPremium && !isPremiumActive()) {
      // User owns it but local state was lost — restore
      activatePremium();
      console.log('[purchaseService] Premium re-verified and restored on launch');
    } else if (!hasPremium && isPremiumActive()) {
      // Purchase no longer valid (refund, etc.) — remove local premium
      localStorage.removeItem(PREMIUM_FLAG);
      console.log('[purchaseService] Premium purchase no longer found, removed local flag');
    }
  } catch (error) {
    console.warn('[purchaseService] Could not verify premium on launch:', error);
  }
}
