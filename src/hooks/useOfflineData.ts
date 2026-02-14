import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const CACHE_PREFIX = 'sonyc_offline_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const useOfflineData = () => {
  const queryClient = useQueryClient();

  // Save data to localStorage
  const saveToCache = useCallback(<T>(key: string, data: T) => {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Error saving to offline cache:', error);
    }
  }, []);

  // Load data from localStorage
  const loadFromCache = useCallback(<T>(key: string): T | null => {
    try {
      const stored = localStorage.getItem(CACHE_PREFIX + key);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      
      // Check if expired
      if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Error loading from offline cache:', error);
      return null;
    }
  }, []);

  // Clear all offline data
  const clearCache = useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
    } catch (error) {
      console.warn('Error clearing offline cache:', error);
    }
  }, []);

  // Check if online
  const isOnline = useCallback(() => {
    return navigator.onLine;
  }, []);

  // Sync cached query data
  const syncQueryCache = useCallback((queryKey: string[], data: unknown) => {
    saveToCache(queryKey.join('_'), data);
  }, [saveToCache]);

  // Get cached query data
  const getCachedQueryData = useCallback(<T>(queryKey: string[]): T | null => {
    return loadFromCache<T>(queryKey.join('_'));
  }, [loadFromCache]);

  return {
    saveToCache,
    loadFromCache,
    clearCache,
    isOnline,
    syncQueryCache,
    getCachedQueryData,
  };
};

// Utility hook for offline-first queries
export const useOfflineQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: { enabled?: boolean }
) => {
  const { getCachedQueryData, syncQueryCache, isOnline } = useOfflineData();
  const queryClient = useQueryClient();

  useEffect(() => {
    // When going online, refetch
    const handleOnline = () => {
      queryClient.invalidateQueries({ queryKey });
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [queryClient, queryKey]);

  // Get initial data from cache if offline
  const initialData = !isOnline() ? getCachedQueryData<T>(queryKey) : undefined;

  return {
    initialData,
    onSuccess: (data: T) => {
      syncQueryCache(queryKey, data);
    },
  };
};
