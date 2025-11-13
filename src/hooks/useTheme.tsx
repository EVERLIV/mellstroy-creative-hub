import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "rhinofit-theme",
  ...props
}: ThemeProviderProps) {
  // Force light theme - ignore localStorage
  const [theme] = useState<Theme>("light");

  useEffect(() => {
    const root = window.document.documentElement;

    // Clear any existing theme classes
    root.classList.remove("light", "dark");
    
    // Force light theme always
    root.classList.add("light");
    
    // Clear localStorage to remove any dark theme preference
    localStorage.removeItem(storageKey);
    localStorage.setItem(storageKey, "light");
  }, [storageKey]);

  const value = {
    theme: "light" as Theme,
    setTheme: () => {
      // Theme switching disabled - do nothing
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
