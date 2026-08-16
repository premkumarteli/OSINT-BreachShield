import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.osint.app',
  appName: 'OSINT Breach Finder',
  webDir: 'build',
  bundledWebRuntime: false,
  server: {
    // During development, enable Live Reload from the dev server
    // To use: run `npm start` then `npm run cap:open:android` and set url accordingly
    androidScheme: 'http',
    cleartext: true
  }
};

export default config;
