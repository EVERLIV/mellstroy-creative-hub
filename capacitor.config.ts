import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b08e9e463b7043d5abd6467959332f8b',
  appName: 'RhinoFit',
  webDir: 'dist',
  server: {
    url: 'https://b08e9e46-3b70-43d5-abd6-467959332f8b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    },
    BarcodeScanner: {
      // Add any scanner configuration here if needed
    }
  }
};

export default config;
