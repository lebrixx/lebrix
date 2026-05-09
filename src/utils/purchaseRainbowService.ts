import { Capacitor } from '@capacitor/core';
import { unlockRainbow, hasRainbowUnlocked } from '@/utils/seasonPass';
import { RAINBOW_PRODUCT_ID } from '@/utils/productIds';

const PRODUCT_ID = RAINBOW_PRODUCT_ID;
const TAG = '[multicolorePurchase]';

/**
 * Load the Multicolore product from the native store and return its localized price.
 * Returns null on failure / non-native.
 */
export async function loadRainbowProduct(): Promise<{ price: string; currency?: string } | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) {
      console.warn(`${TAG} Billing not supported`);
      return null;
    }
    const rawResponse = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP,
    });
    const products = rawResponse?.products ?? [];
    const loadedIds = products.map((p: any) => p.identifier ?? p.productIdentifier ?? p.productId ?? p.id);
    console.log(`${TAG} Loaded product IDs:`, loadedIds);
    const product: any = products.find(
      (p: any) => (p.identifier ?? p.productIdentifier ?? p.productId ?? p.id) === PRODUCT_ID
    );
    if (!product) return null;
    const price =
      product.priceString ??
      product.localizedPrice ??
      product.price_string ??
      (typeof product.price === 'string' ? product.price : undefined);
    const currency = product.currencyCode ?? product.priceCurrencyCode;
    if (!price) return null;
    return { price, currency };
  } catch (e) {
    console.warn(`${TAG} loadRainbowProduct error:`, e);
    return null;
  }
}

/**
 * Purchase the Multicolore (rainbow) username color via native IAP.
 * Non-consumable — once bought, permanently unlocked.
 */
export async function purchaseRainbowNative(): Promise<'purchased' | 'cancelled' | 'error' | 'unavailable' | 'already_owned'> {
  // Already unlocked locally — block double purchase
  if (hasRainbowUnlocked()) {
    console.log(`${TAG} Already owned — skipping purchase`);
    return 'already_owned';
  }

  // Web fallback (dev/testing) — direct unlock
  if (!Capacitor.isNativePlatform()) {
    console.warn(`${TAG} Not on native platform — direct unlock for testing`);
    unlockRainbow();
    return 'purchased';
  }

  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');

    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) {
      console.error(`${TAG} Billing not supported`);
      return 'error';
    }

    console.log(`${TAG} Loading products from store...`);
    const rawResponse = await NativePurchases.getProducts({
      productIdentifiers: [PRODUCT_ID],
      productType: PURCHASE_TYPE.INAPP,
    });

    const products = rawResponse?.products;
    if (!products || products.length === 0) {
      console.error(`${TAG} No products returned`);
      return 'unavailable';
    }

    const loadedIds = products.map((p: any) => p.identifier ?? p.productIdentifier ?? p.productId ?? p.id);
    const platformLabel = Capacitor.getPlatform() === 'android' ? 'Android' : 'iOS';
    console.log(`${TAG} Loaded ${platformLabel} products:`, loadedIds);

    if (!loadedIds.includes(PRODUCT_ID)) {
      console.error(`${TAG} Product not found:`, PRODUCT_ID, '— available:', loadedIds);
      return 'unavailable';
    }

    // Defensive: check store ownership before launching purchase flow
    try {
      const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
      const owned = purchases?.some((p: any) => (p.productIdentifier ?? p.identifier) === PRODUCT_ID);
      if (owned) {
        console.log(`${TAG} Store reports product already owned — restoring`);
        unlockRainbow();
        return 'already_owned';
      }
    } catch {}

    console.log(`${TAG} Initiating purchase for`, PRODUCT_ID);
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
    });

    if (result.transactionId) {
      unlockRainbow();
      console.log(`${TAG} Purchase successful`, result.transactionId);
      return 'purchased';
    }

    console.warn(`${TAG} Purchase completed without transactionId`);
    return 'error';
  } catch (error: any) {
    if (
      error?.code === 'PURCHASE_CANCELLED' ||
      error?.code === '1' ||
      error?.message?.toLowerCase()?.includes('cancel')
    ) {
      console.log(`${TAG} Purchase cancelled by user`);
      return 'cancelled';
    }
    console.error(`${TAG} Purchase error:`, error);
    return 'error';
  }
}

/**
 * On app launch — verify if the Multicolore product was previously purchased
 * and re-unlock locally if so (iOS/Android restore).
 */
export async function verifyRainbowOnLaunch(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases');
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
    const owned = purchases?.some(
      (p: any) => (p.productIdentifier ?? p.identifier) === PRODUCT_ID
    );
    if (owned && !hasRainbowUnlocked()) {
      unlockRainbow();
      console.log(`${TAG} Multicolore restored on launch`);
    }
  } catch (e) {
    console.warn(`${TAG} verifyRainbowOnLaunch error:`, e);
  }
}
