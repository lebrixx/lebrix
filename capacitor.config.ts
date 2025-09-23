import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2dd90aa453b647199c4d45da7e4a8847',
  appName: 'Lucky Stop',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1b3e',
      showSpinner: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a1b3e'
    }
  }
};

export default config;