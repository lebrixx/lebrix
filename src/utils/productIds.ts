import { Capacitor } from '@capacitor/core';

const isAndroid = () => Capacitor.getPlatform() === 'android';

export const ESSENTIAL_PRODUCT_ID = isAndroid()
  ? 'com-luckystop-essentiel'
  : 'com.luckystop.essentiel';

export const PREMIUM_PRODUCT_ID = isAndroid()
  ? 'com-luckystop-premium'
  : 'com.luckystop.premium';
