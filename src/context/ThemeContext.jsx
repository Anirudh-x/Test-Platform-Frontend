import { createContext } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Light mode only - no dark mode switching
  const theme = {
    bg: {
      primary: 'bg-white',
      secondary: 'bg-slate-50',
      tertiary: 'bg-slate-100',
      gradient: 'bg-slate-50', // Replaced gradient with solid light background
    },
    text: {
      primary: 'text-slate-800',
      secondary: 'text-slate-500',
    },
    border: 'border-slate-200',
    card: 'bg-white border-slate-200 shadow-sm rounded-xl',
    hover: 'hover:bg-slate-50 transition-colors',
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}
