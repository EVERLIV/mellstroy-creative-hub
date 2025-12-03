import { useState, useEffect } from 'react';
import { X, Sparkles, Zap, Shield, Bell } from 'lucide-react';
import { APP_VERSION } from '@/src/config/appVersion';

interface ChangelogEntry {
  version: string;
  date: string;
  features: {
    icon: 'sparkles' | 'zap' | 'shield' | 'bell';
    title: string;
    description: string;
  }[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.1.0',
    date: 'December 3, 2025',
    features: [
      {
        icon: 'bell',
        title: 'PWA Update Notifications',
        description: 'Get notified when a new version is available and update with one tap.'
      },
      {
        icon: 'sparkles',
        title: 'Improved Event Cards',
        description: 'Redesigned compact view with better layout showing location, category, and availability.'
      },
      {
        icon: 'zap',
        title: 'Faster Performance',
        description: 'Optimized loading and smoother animations throughout the app.'
      },
      {
        icon: 'shield',
        title: 'Enhanced Security',
        description: 'Improved data protection and privacy controls.'
      }
    ]
  }
];

const IconMap = {
  sparkles: Sparkles,
  zap: Zap,
  shield: Shield,
  bell: Bell
};

export const WhatsNewModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentChangelog, setCurrentChangelog] = useState<ChangelogEntry | null>(null);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('rhinofit_last_seen_version');
    
    // Find changelog for current version
    const changelog = CHANGELOG.find(c => c.version === APP_VERSION);
    
    if (changelog && lastSeenVersion !== APP_VERSION) {
      setCurrentChangelog(changelog);
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('rhinofit_last_seen_version', APP_VERSION);
    setIsOpen(false);
  };

  if (!isOpen || !currentChangelog) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden animate-scale-in shadow-xl">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">What's New</h2>
              <p className="text-sm opacity-90">Version {currentChangelog.version}</p>
            </div>
          </div>
          <p className="text-sm opacity-80 mt-2">{currentChangelog.date}</p>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          <div className="space-y-4">
            {currentChangelog.features.map((feature, index) => {
              const Icon = IconMap[feature.icon];
              return (
                <div 
                  key={index}
                  className="flex gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleClose}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium
                       hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
