/**
 * DarkModeToggle.jsx
 * Place at: client/src/components/DarkModeToggle.jsx
 *
 * Animated sun ☀️ / moon 🌙 toggle.
 * Drop it anywhere — already used in Navbar.jsx.
 */

import { useTheme } from '../context/ThemeContext';

export default function DarkModeToggle({ size = 36 }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width:           size,
        height:          size,
        borderRadius:    '50%',
        border:          '1.5px solid var(--border)',
        background:      'var(--surface)',
        cursor:          'pointer',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        fontSize:        size * 0.5,
        transition:      'background 0.2s, border-color 0.2s, transform 0.15s',
        flexShrink:      0,
        lineHeight:      1,
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <span
        style={{
          display:    'inline-block',
          transition: 'transform 0.4s, opacity 0.3s',
          transform:  isDark ? 'rotate(0deg)' : 'rotate(180deg)',
          opacity:     1
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  );
}