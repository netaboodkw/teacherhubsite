import { useSystemSetting } from './useSystemSettings';
import defaultLogo from '@/assets/logo.png';

export function useSiteLogo() {
  const { data: logoSetting, isLoading } = useSystemSetting('site_logo');
  
  // Parse the logo URL properly - could be string directly or nested in value
  let logoUrl = defaultLogo;
  
  if (logoSetting?.value) {
    const value = logoSetting.value;
    // Handle if it's a direct string URL
    if (typeof value === 'string' && value.startsWith('http')) {
      logoUrl = value;
    }
  }
  
  return {
    logoUrl,
    isLoading,
    isCustomLogo: logoUrl !== defaultLogo,
  };
}
