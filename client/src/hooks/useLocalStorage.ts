import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get stored value or use initial value
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Update localStorage when state changes
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          // Dispatch custom event for cross-tab sync
          window.dispatchEvent(new StorageEvent('storage', { key }));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

// Auto-save hook with debounce
export function useAutoSave<T>(
  key: string,
  data: T,
  delay: number = 1000
) {
  const [, setStoredValue] = useLocalStorage<T>(key, data);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStoredValue(data);
    }, delay);

    return () => clearTimeout(timer);
  }, [key, data, delay, setStoredValue]);
}

// Form auto-save hook
interface UseFormAutoSaveOptions<T> {
  key: string;
  data: T;
  delay?: number;
  enabled?: boolean;
  onSave?: () => void;
}

export function useFormAutoSave<T>({
  key,
  data,
  delay = 1000,
  enabled = true,
  onSave
}: UseFormAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [, setStoredValue, clearStoredValue] = useLocalStorage<T>(key, data);

  useEffect(() => {
    if (!enabled) return;

    setIsSaving(true);
    const timer = setTimeout(() => {
      setStoredValue(data);
      setIsSaving(false);
      setLastSaved(new Date());
      onSave?.();
    }, delay);

    return () => clearTimeout(timer);
  }, [key, data, delay, enabled, onSave, setStoredValue]);

  const clearSavedData = useCallback(() => {
    clearStoredValue();
    setLastSaved(null);
  }, [clearStoredValue]);

  return { isSaving, lastSaved, clearSavedData };
}

// Draft storage for complex forms
export interface DraftState<T> {
  data: T;
  savedAt: string;
  version: number;
}

export function useDraftStorage<T>(
  key: string,
  version: number = 1
) {
  const fullKey = `${key}_v${version}`;
  
  const [draft, setDraft, removeDraft] = useLocalStorage<DraftState<T> | null>(
    fullKey,
    null
  );

  const saveDraft = useCallback(
    (data: T) => {
      setDraft({
        data,
        savedAt: new Date().toISOString(),
        version
      });
    },
    [setDraft, version]
  );

  const loadDraft = useCallback((): T | null => {
    return draft?.data ?? null;
  }, [draft]);

  const hasDraft = useCallback((): boolean => {
    return draft !== null && draft.version === version;
  }, [draft, version]);

  const getDraftAge = useCallback((): number | null => {
    if (!draft?.savedAt) return null;
    const saved = new Date(draft.savedAt);
    const now = new Date();
    return Math.floor((now.getTime() - saved.getTime()) / 1000 / 60); // minutes
  }, [draft]);

  return {
    draft,
    saveDraft,
    loadDraft,
    removeDraft,
    hasDraft,
    getDraftAge
  };
}
