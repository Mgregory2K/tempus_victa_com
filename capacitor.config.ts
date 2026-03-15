// @ts-nocheck
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tempusvicta.app',
  appName: 'Twin+',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: false,
      androidScaleType: "CENTER_CROP"
    }
  }
};

export default config;
