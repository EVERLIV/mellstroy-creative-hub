import { Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  return (
    <header className="sticky top-0 bg-background border-b border-border backdrop-blur-lg bg-background/95 z-40">
      <div className="flex items-center justify-between h-16 px-4 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};