import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abdullah.teacherhub',
  appName: 'Teacher Hub',
  webDir: 'dist',
  ios: {
    // Apple Developer Team ID
    teamId: 'Z27XGT5N8K',
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
    allowsLinkPreview: false,
    scrollEnabled: true,
    preferredContentMode: 'mobile',
    // URL Scheme for deep linking
    scheme: 'teacherhub'
  },
  android: {
    backgroundColor: '#0f172a'
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    Browser: {
      // Enable in-app browser for payment
    }
  },
  // Server configuration for deep linking
  server: {
    allowNavigation: ['teacherhub.site', '*.teacherhub.site', '*.myfatoorah.com', 'myfatoorah.com', 'demo.myfatoorah.com']
  }
};

export default config;
