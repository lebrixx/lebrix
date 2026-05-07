import { Capacitor } from '@capacitor/core';
import { unlockRainbow } from '@/utils/seasonPass';
import { RAINBOW_PRODUCT_ID } from '@/utils/productIds';

const PRODUCT_ID = RAINBOW_PRODUCT_ID;

/**
 * Purchase the Multicolore (rainbow) username color via native IAP.
 * Non-consumable — once bought, permanently unlocked.
 */
export async function purchaseRainbowNative(): Promise<'purchased' | 'cancelled' | 'error' | 'unavailable'> {
  // Web fallback (dev/testing) — direct unlock
  if (!Capacitor.isNativePlatform()) {
    console.warn('[rainbowPurchase] Not on native platform — direct unlock for testing');
    unlockRainbow();
    return 'purchased';
  }

  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');

    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) {
      console.error('[rainbowPurchase] Billing not supported');
      return 'error';
    }

    const rawResponse = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP,
    });

    const products = rawResponse?.products;
    if (!products || products.length === 0) {
      console.error('[rainbowPurchase] No products returned');
      return 'unavailable';
    }

    const loadedIds = products.map((p: any) => p.identifier ?? p.productIdentifier ?? p.productId ?? p.id);
    if (!loadedIds.includes(PRODUCT_ID)) {
      console.error('[rainbowPurchase] Product not found:', PRODUCT_ID, '— available:', loadedIds);
      return 'unavailable';
    }

    const result = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
    });

    if (result.transactionId) {
      unlockRainbow();
      console.log('[rainbowPurchase] Purchase successful', result.transactionId);
      return 'purchased';
    }

    return 'error';
  } catch (error: any) {
    if (
      error?.code === 'PURCHASE_CANCELLED' ||
      error?.code === '1' ||
      error?.message?.toLowerCase()?.includes('cancel')
    ) {
      return 'cancelled';
    }
    console.error('[rainbowPurchase] Error:', error);
    return 'error';
  }
}
