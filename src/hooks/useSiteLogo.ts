import { useSystemSetting } from './useSystemSettings';

// Use a reliable fallback logo
const DEFAULT_LOGO = '/logo.png';

export function useSiteLogo() {
  const { data: logoSetting, isLoading } = useSystemSetting('site_logo');
  
  // Parse the logo URL properly - could be string directly or nested in value
  let logoUrl = DEFAULT_LOGO;
  
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
    isCustomLogo: logoUrl !== DEFAULT_LOGO,
  };
}
