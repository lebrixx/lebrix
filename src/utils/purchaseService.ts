import { Capacitor } from '@capacitor/core';
import { purchasePremiumPack } from '@/utils/seasonPass';

const PRODUCT_ID = 'com.luckystop.premium';
const PREMIUM_FLAG = 'ls_premium_no_ads';

/**
 * Activate all premium benefits locally after a confirmed purchase.
 */
function activatePremium(onAddCoins?: (amount: number) => void): void {
  const result = purchasePremiumPack();
  localStorage.setItem(PREMIUM_FLAG, 'true');
  onAddCoins?.(result.coins);
}

/**
 * Check if the user is already premium (local flag).
 */
export function isPremiumActive(): boolean {
  return localStorage.getItem(PREMIUM_FLAG) === 'true';
}

/**
 * Purchase the Premium Pack via native IAP (RevenueCat).
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
    const { CapacitorPurchases } = await import('@capgo/capacitor-purchases');

    // Fetch available packages
    const { offerings } = await CapacitorPurchases.getOfferings();

    // Find our product in the current offering
    let targetPackage: any = null;

    if (offerings.current) {
      // Search through all available packages for our product ID
      const allPackages = [
        ...(offerings.current.availablePackages ?? []),
      ];
      targetPackage = allPackages.find(
        (pkg: any) => pkg.product?.identifier === PRODUCT_ID
      );
    }

    if (!targetPackage) {
      console.error('[purchaseService] Product not found in offerings:', PRODUCT_ID);
      return 'error';
    }

    // Trigger native purchase flow
    const { customerInfo } = await CapacitorPurchases.purchasePackage({
      aPackage: targetPackage,
    });

    // Verify the entitlement is now active
    const premiumEntitlement =
      customerInfo.entitlements.active['premium'] ??
      customerInfo.entitlements.active['premium_pack'];

    if (premiumEntitlement) {
      activatePremium(onAddCoins);
      console.log('[purchaseService] Purchase successful, premium activated');
      return 'purchased';
    }

    // Purchase went through but entitlement not found — unlikely but handle
    console.warn('[purchaseService] Purchase completed but entitlement not active');
    return 'error';
  } catch (error: any) {
    // RevenueCat throws when the user cancels
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
 * Verify premium status on app launch by checking the store.
 * Silently re-activates premium if the user owns it.
 */
export async function verifyPremiumOnLaunch(): Promise<void> {
  // Skip on web
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { CapacitorPurchases } = await import('@capgo/capacitor-purchases');
    const { customerInfo } = await CapacitorPurchases.getCustomerInfo();

    const premiumEntitlement =
      customerInfo.entitlements.active['premium'] ??
      customerInfo.entitlements.active['premium_pack'];

    if (premiumEntitlement && !isPremiumActive()) {
      // User owns it but local state was lost — restore
      activatePremium();
      console.log('[purchaseService] Premium re-verified and restored on launch');
    } else if (!premiumEntitlement && isPremiumActive()) {
      // Entitlement revoked (refund, etc.) — remove local premium
      localStorage.removeItem(PREMIUM_FLAG);
      console.log('[purchaseService] Premium entitlement no longer active, removed local flag');
    }
  } catch (error) {
    console.warn('[purchaseService] Could not verify premium on launch:', error);
  }
}
