import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3ad4a6f4c67b4b818b6b7aa91d42cda7',
  appName: 'Teacher Hub',
  webDir: 'dist',
  server: {
    url: 'https://3ad4a6f4-c67b-4b81-8b6b-7aa91d42cda7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
    allowsLinkPreview: true,
    scrollEnabled: true
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
    }
  }
};

export default config;
