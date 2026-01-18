import { useSystemSetting } from './useSystemSettings';

// Use a reliable fallback logo from public folder
const DEFAULT_LOGO = '/logo.png';

export function useSiteLogo() {
  const { data: logoSetting, isLoading } = useSystemSetting('site_logo');
  
  // Always start with default logo
  let logoUrl = DEFAULT_LOGO;
  
  // Only use custom logo if it's a valid URL
  if (!isLoading && logoSetting?.value) {
    const value = logoSetting.value;
    // Handle both string URL and possible nested object
    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
      logoUrl = value;
    } else if (typeof value === 'object' && value !== null) {
      // If value is an object, try to extract the URL
      const url = (value as any).url || (value as any).value;
      if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('/'))) {
        logoUrl = url;
      }
    }
  }
  
  return {
    logoUrl,
    isLoading,
    isCustomLogo: logoUrl !== DEFAULT_LOGO,
  };
}
