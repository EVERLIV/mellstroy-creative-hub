import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/src/hooks/useTheme';
import { Button } from '@/src/components/ui/button';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-full"
    >
      {theme === 'dark' ? (
        <Sun className="text-foreground" />
      ) : (
        <Moon className="text-foreground" />
      )}
    </Button>
  );
};
