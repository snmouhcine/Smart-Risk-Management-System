import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  // Get from local storage then parse stored json or return initialValue
  const readValue = () => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState(readValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save to local state
      setStoredValue(valueToStore);
      
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readValue());
    };

    // Listen for changes in other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [storedValue, setValue];
};

// Helper to clear all app data
export const clearAllAppData = () => {
  const keysToKeep = []; // Add any keys you want to preserve
  const allKeys = Object.keys(localStorage);
  
  allKeys.forEach(key => {
    if (key.startsWith('methodealpha_') && !keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });
};