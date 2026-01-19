import { useState, useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

// Types for the biometric plugin
interface BiometricOptions {
  reason?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  negativeButtonText?: string;
  maxAttempts?: number;
  useFallback?: boolean;
}

interface Credentials {
  username: string;
  password: string;
}

// Check if we're on a native platform
const isNative = Capacitor.isNativePlatform();

// Storage key for biometric preference
const BIOMETRIC_ENABLED_KEY = 'biometricAuthEnabled';
const BIOMETRIC_SERVER_KEY = 'teacherhub_biometric';

export function useBiometricAuth() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometryType, setBiometryType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const nativeBiometricRef = useRef<any>(null);
  const pluginLoadedRef = useRef(false);

  // Load the plugin
  const loadPlugin = useCallback(async () => {
    if (!isNative) {
      console.log('Not a native platform, skipping biometric plugin');
      return null;
    }
    
    if (pluginLoadedRef.current && nativeBiometricRef.current) {
      return nativeBiometricRef.current;
    }

    try {
      const module = await import('capacitor-native-biometric');
      nativeBiometricRef.current = module.NativeBiometric;
      pluginLoadedRef.current = true;
      console.log('Biometric plugin loaded successfully');
      return nativeBiometricRef.current;
    } catch (error) {
      console.log('Biometric plugin not available:', error);
      return null;
    }
  }, []);

  // Check biometric availability
  const checkAvailability = useCallback(async () => {
    if (!isNative) {
      console.log('Not native platform');
      setIsAvailable(false);
      setIsLoading(false);
      return false;
    }

    const plugin = await loadPlugin();
    if (!plugin) {
      console.log('Plugin not loaded');
      setIsAvailable(false);
      setIsLoading(false);
      return false;
    }

    try {
      console.log('Checking biometric availability...');
      const result = await plugin.isAvailable();
      console.log('Biometric result:', result);
      setIsAvailable(result.isAvailable);
      setBiometryType(result.biometryType || 'biometric');
      
      // Check if user has enabled biometric auth
      const enabled = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
      setIsEnabled(enabled);
      
      setIsLoading(false);
      return result.isAvailable;
    } catch (error) {
      console.log('Biometric check error:', error);
      setIsAvailable(false);
      setIsLoading(false);
      return false;
    }
  }, [loadPlugin]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Verify user with biometrics
  const verifyIdentity = useCallback(async (options?: BiometricOptions): Promise<boolean> => {
    const plugin = await loadPlugin();
    if (!isNative || !plugin) {
      return false;
    }

    try {
      await plugin.verifyIdentity({
        reason: options?.reason || 'التحقق من هويتك',
        title: options?.title || 'تسجيل الدخول',
        subtitle: options?.subtitle || 'Teacher Hub',
        description: options?.description || 'استخدم البصمة أو Face ID للدخول',
        negativeButtonText: options?.negativeButtonText || 'إلغاء',
        maxAttempts: options?.maxAttempts || 3,
        useFallback: options?.useFallback ?? true,
      });
      return true;
    } catch (error) {
      console.log('Biometric verification failed:', error);
      return false;
    }
  }, [loadPlugin]);

  // Save credentials securely
  const saveCredentials = useCallback(async (email: string, password: string): Promise<boolean> => {
    const plugin = await loadPlugin();
    if (!isNative || !plugin) {
      return false;
    }

    try {
      await plugin.setCredentials({
        username: email,
        password: password,
        server: BIOMETRIC_SERVER_KEY,
      });
      
      localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      setIsEnabled(true);
      return true;
    } catch (error) {
      console.log('Failed to save credentials:', error);
      return false;
    }
  }, [loadPlugin]);

  // Get saved credentials
  const getCredentials = useCallback(async (): Promise<Credentials | null> => {
    const plugin = await loadPlugin();
    if (!isNative || !plugin) {
      return null;
    }

    try {
      const credentials = await plugin.getCredentials({
        server: BIOMETRIC_SERVER_KEY,
      });
      return {
        username: credentials.username,
        password: credentials.password,
      };
    } catch (error) {
      console.log('Failed to get credentials:', error);
      return null;
    }
  }, [loadPlugin]);

  // Delete saved credentials
  const deleteCredentials = useCallback(async (): Promise<boolean> => {
    const plugin = await loadPlugin();
    if (!isNative || !plugin) {
      return false;
    }

    try {
      await plugin.deleteCredentials({
        server: BIOMETRIC_SERVER_KEY,
      });
      
      localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      setIsEnabled(false);
      return true;
    } catch (error) {
      console.log('Failed to delete credentials:', error);
      return false;
    }
  }, [loadPlugin]);

  // Perform biometric login
  const biometricLogin = useCallback(async (): Promise<Credentials | null> => {
    if (!isEnabled || !isAvailable) {
      return null;
    }

    // First verify identity
    const verified = await verifyIdentity();
    if (!verified) {
      return null;
    }

    // Then get credentials
    const credentials = await getCredentials();
    return credentials;
  }, [isEnabled, isAvailable, verifyIdentity, getCredentials]);

  // Get biometry type display name in Arabic
  const getBiometryDisplayName = useCallback(() => {
    switch (biometryType.toLowerCase()) {
      case 'face':
      case 'faceid':
        return 'Face ID';
      case 'fingerprint':
      case 'touchid':
        return 'البصمة';
      case 'iris':
        return 'بصمة العين';
      default:
        return 'البصمة';
    }
  }, [biometryType]);

  return {
    isAvailable,
    isEnabled,
    isLoading,
    biometryType,
    getBiometryDisplayName,
    checkAvailability,
    verifyIdentity,
    saveCredentials,
    getCredentials,
    deleteCredentials,
    biometricLogin,
    isNative,
  };
}
