import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.luckystop.app', // ⚠️ IMPORTANT: Remplacez par votre Bundle ID Apple
  appName: 'Lucky Stop',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'https'
  },
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