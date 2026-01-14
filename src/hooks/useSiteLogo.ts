import { useQuery } from '@tanstack/react-query';
import { useSystemSetting } from './useSystemSettings';
import defaultLogo from '@/assets/logo.png';

export function useSiteLogo() {
  const { data: logoSetting, isLoading } = useSystemSetting('site_logo');
  
  // Return the custom logo URL if set, otherwise return the default logo
  const logoUrl = logoSetting?.value as string || defaultLogo;
  
  return {
    logoUrl,
    isLoading,
    isCustomLogo: !!logoSetting?.value,
  };
}
