import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import Landing from '@/pages/Landing';
import Welcome from '@/pages/Welcome';

export default function PlatformRouter() {
  const [isNative, setIsNative] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if running on native platform (iOS/Android)
    const native = Capacitor.isNativePlatform();
    setIsNative(native);
  }, []);

  // Show nothing while detecting platform
  if (isNative === null) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Native app (iOS/Android) → Welcome page
  if (isNative) {
    return <Welcome />;
  }

  // Web browser → Landing page
  return <Landing />;
}
