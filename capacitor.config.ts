import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2dd90aa453b647199c4d45da7e4a8847',
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