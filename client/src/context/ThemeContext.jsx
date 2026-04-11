/**
 * ThemeContext.jsx
 * Place at: client/src/context/ThemeContext.jsx
 *
 * Provides global dark/light mode state.
 * - Persists preference in localStorage
 * - Respects system preference on first visit
 * - Applies data-theme attribute to <html> element
 */

import { createContext, useContext, useEffect, useState } from 'react';

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // 1. Check localStorage first
    const saved = localStorage.getItem('universe-theme');
    if (saved === 'dark' || saved === 'light') return saved;

    // 2. Fall back to system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';

    // 3. Default to light
    return 'light';
  });

  // Apply theme to <html> whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('universe-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));
  const isDark      = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Convenience hook
export function useTheme() {
  return useContext(ThemeContext);
}