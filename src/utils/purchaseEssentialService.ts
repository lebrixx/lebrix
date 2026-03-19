import { Capacitor } from '@capacitor/core';
import { addTickets } from '@/utils/ticketSystem';
import { ESSENTIAL_PRODUCT_ID } from '@/utils/productIds';

const PRODUCT_ID = ESSENTIAL_PRODUCT_ID;

/**
 * Apply Essential Pack rewards locally.
 * 5× each boost + 15 expert tickets.
 * Consumable — can be purchased multiple times.
 */
function applyEssentialRewards(): void {
  console.log('[essentialPurchase] Applying essential pack rewards');

  // 5 of each boost
  try {
    const saved = localStorage.getItem('luckyStopBoosts');
    const boosts: Record<string, number> = saved ? JSON.parse(saved) : {};
    boosts['shield'] = (boosts['shield'] || 0) + 5;
    boosts['bigger_zone'] = (boosts['bigger_zone'] || 0) + 5;
    boosts['start_20'] = (boosts['start_20'] || 0) + 5;
    localStorage.setItem('luckyStopBoosts', JSON.stringify(boosts));
    window.dispatchEvent(new CustomEvent('boostsInventoryUpdate', { detail: boosts }));
  } catch (e) {
    console.error('[essentialPurchase] Failed to save boosts:', e);
  }

  // 15 expert tickets
  addTickets(15);

  console.log('[essentialPurchase] Rewards applied: 5× each boost, 15 tickets');
}

/**
 * Purchase the Essential Pack via native IAP.
 * CONSUMABLE — can be bought multiple times.
 * Returns 'purchased' | 'cancelled' | 'error' | 'unavailable'
 */
export async function purchaseEssentialNative(): Promise<'purchased' | 'cancelled' | 'error' | 'unavailable'> {
  // On web, fall back to direct unlock (dev/testing)
  if (!Capacitor.isNativePlatform()) {
    console.warn('[essentialPurchase] Not on native platform — direct unlock for testing');
    applyEssentialRewards();
    return 'purchased';
  }

  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');

    console.log('[essentialPurchase] Checking billing support...');
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) {
      console.error('[essentialPurchase] Billing not supported on this device');
      return 'error';
    }

    // Verify product is available on the store before purchasing
    console.log('[essentialPurchase] Loading products from store...');
    const rawResponse = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP,
    });

    // Log the full raw response for debugging
    console.log('[essentialPurchase] RAW getProducts response:', JSON.stringify(rawResponse, null, 2));

    const products = rawResponse?.products;

    if (!products || products.length === 0) {
      console.error('[essentialPurchase] No products returned by StoreKit / Google Play');
      return 'unavailable';
    }

    // Log each product's full structure to detect field names
    products.forEach((p: any, i: number) => {
      console.log(`[essentialPurchase] Product[${i}]:`, JSON.stringify(p, null, 2));
    });

    // @capgo/native-purchases uses "identifier" (not "productIdentifier") on Product objects
    const loadedIds = products.map((p: any) => p.identifier ?? p.productIdentifier ?? p.productId ?? p.id);
    console.log('[essentialPurchase] Loaded product IDs:', loadedIds);

    const found = loadedIds.includes(PRODUCT_ID);
    if (!found) {
      console.error('[essentialPurchase] Product not found on store:', PRODUCT_ID, '— available:', loadedIds);
      return 'unavailable';
    }

    console.log('[essentialPurchase] Product found, initiating purchase for', PRODUCT_ID);
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
    });

    if (result.transactionId) {
      applyEssentialRewards();
      console.log('[essentialPurchase] Purchase successful, rewards applied', result.transactionId);
      return 'purchased';
    }

    console.warn('[essentialPurchase] Purchase completed but no transaction returned');
    return 'error';
  } catch (error: any) {
    if (
      error?.code === 'PURCHASE_CANCELLED' ||
      error?.code === '1' ||
      error?.message?.toLowerCase()?.includes('cancel')
    ) {
      console.log('[essentialPurchase] Purchase cancelled by user');
      return 'cancelled';
    }
    console.error('[essentialPurchase] Purchase error:', error);
    return 'error';
  }
}
