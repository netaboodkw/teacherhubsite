import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abdullah.teacherhub',
  appName: 'Teacher Hub',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f172a',
    allowsLinkPreview: false,
    scrollEnabled: true,
    preferredContentMode: 'mobile'
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
    }
  },
  // Server configuration for deep linking
  server: {
    allowNavigation: ['teacherhub.site', '*.teacherhub.site', '*.myfatoorah.com', 'myfatoorah.com']
  }
};

export default config;
