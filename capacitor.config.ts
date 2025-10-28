import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bryangouzou.luckystop', // ⚠️ NE JAMAIS CHANGER pour une mise à jour !
  appName: 'Lucky Stop',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#270830'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#270830',
      showSpinner: false
    }
  }
};

export default config;