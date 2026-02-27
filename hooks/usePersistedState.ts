import { useState, useEffect } from 'react';

/**
 * A custom hook that works like useState but persists the value to localStorage.
 * @param key The key to use in localStorage
 * @param defaultValue The initial value if no value is found in localStorage
 */
export function usePersistedState<T>(key: string, defaultValue: T): [T, (val: T) => void] {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(`Error parsing persisted state for key "${key}":`, e);
        return defaultValue;
      }
    }
    return defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
