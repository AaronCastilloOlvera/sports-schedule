import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const ThemeModeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
});

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(
    () => localStorage.getItem('themeMode') ?? 'light'
  );

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = useCallback(
    () => setMode(prev => (prev === 'light' ? 'dark' : 'light')),
    []
  );

  const value = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}

ThemeModeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useThemeMode = () => useContext(ThemeModeContext);
