import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3ad4a6f4c67b4b818b6b7aa91d42cda7',
  appName: 'teacherhubsite',
  webDir: 'dist',
  server: {
    url: 'https://3ad4a6f4-c67b-4b81-8b6b-7aa91d42cda7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
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
  }
};

export default config;
