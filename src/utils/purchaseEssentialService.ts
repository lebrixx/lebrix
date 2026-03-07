import { Capacitor } from '@capacitor/core';
import { addTickets } from '@/utils/ticketSystem';

const PRODUCT_ID = 'com.luckystop.essentiel';

/**
 * Apply Essential Pack rewards locally.
 * 15× each boost + 15 expert tickets.
 * Consumable — can be purchased multiple times.
 */
function applyEssentialRewards(): void {
  console.log('[essentialPurchase] Applying essential pack rewards');

  // 15 of each boost
  try {
    const saved = localStorage.getItem('luckyStopBoosts');
    const boosts: Record<string, number> = saved ? JSON.parse(saved) : {};
    boosts['shield'] = (boosts['shield'] || 0) + 15;
    boosts['bigger_zone'] = (boosts['bigger_zone'] || 0) + 15;
    boosts['start_20'] = (boosts['start_20'] || 0) + 15;
    localStorage.setItem('luckyStopBoosts', JSON.stringify(boosts));
    window.dispatchEvent(new CustomEvent('boostsInventoryUpdate', { detail: boosts }));
  } catch (e) {
    console.error('[essentialPurchase] Failed to save boosts:', e);
  }

  // 15 expert tickets
  addTickets(15);

  console.log('[essentialPurchase] Rewards applied: 15× each boost, 15 tickets');
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
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP,
    });

    console.log('[essentialPurchase] Loaded IAP products:', products?.map((p: any) => p.productIdentifier));

    const found = products?.some((p: any) => p.productIdentifier === PRODUCT_ID);
    if (!found) {
      console.error('[essentialPurchase] Product not found on store:', PRODUCT_ID);
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
