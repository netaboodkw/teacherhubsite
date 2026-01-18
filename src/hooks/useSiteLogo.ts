import { useSystemSetting } from './useSystemSettings';

// Use a reliable fallback logo from public folder
const DEFAULT_LOGO = '/logo.png';

export function useSiteLogo() {
  const { data: logoSetting, isLoading } = useSystemSetting('site_logo');
  
  // Always start with default logo
  let logoUrl = DEFAULT_LOGO;
  
  // Only use custom logo if it's a valid HTTP URL
  if (!isLoading && logoSetting?.value) {
    const value = logoSetting.value;
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
