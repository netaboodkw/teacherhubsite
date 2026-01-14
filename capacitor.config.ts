import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3ad4a6f4c67b4b818b6b7aa91d42cda7',
  appName: 'echo-grade-ease',
  webDir: 'dist',
  server: {
    url: 'https://3ad4a6f4-c67b-4b81-8b6b-7aa91d42cda7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav'
    }
  }
};

export default config;
