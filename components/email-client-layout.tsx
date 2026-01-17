'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SettingsDialog } from '@/components/settings-dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { ComposePanel } from '@/components/compose-panel';
import { 
  Inbox, 
  Send, 
  Plus,
  Menu
} from 'lucide-react';
import { hasApiKey } from '@/lib/settings';
import { useRouter, usePathname } from 'next/navigation';

interface EmailClientLayoutProps {
  children: React.ReactNode;
  activeView: 'inbox' | 'sent' | 'compose';
  onViewChange?: (view: 'inbox' | 'sent' | 'compose') => void;
}

export function EmailClientLayout({ children, activeView, onViewChange }: EmailClientLayoutProps) {
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  // Use typeof window check directly to avoid setState in effect
  const mounted = typeof window !== 'undefined';
  const router = useRouter();
  const pathname = usePathname();
  const [composeOpen, setComposeOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Determine active view from pathname
  const currentView = pathname === '/sent' ? 'sent' : pathname === '/inbox' ? 'inbox' : activeView;
  
  const handleNavigation = (view: 'inbox' | 'sent') => {
    router.push(`/${view}`);
    onViewChange?.(view);
  };
  
  const handleCompose = () => {
    setComposeOpen(true);
  };

  // Check API key on mount and when settings might change
  useEffect(() => {
    const checkApiKey = () => {
      setApiKeyConfigured(hasApiKey());
    };
    
    // Check immediately after mount
    checkApiKey();
    
    // Listen for storage changes (when settings are updated in another tab)
    window.addEventListener('storage', checkApiKey);
    
    // Listen for custom settings update event (when settings are updated in same tab)
    window.addEventListener('settings-updated', checkApiKey);
    
    return () => {
      window.removeEventListener('storage', checkApiKey);
      window.removeEventListener('settings-updated', checkApiKey);
    };
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-sidebar flex-col shadow-sm">
        <div className="p-4 border-b bg-sidebar/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Resend Client
            </h1>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <SettingsDialog />
            </div>
          </div>
          {mounted && !apiKeyConfigured && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-2.5 text-xs text-yellow-800 dark:text-yellow-200">
              <span className="font-medium">⚠️</span> Please configure your API key in settings
            </div>
          )}
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-1">
            <Button
              variant={currentView === 'inbox' ? 'secondary' : 'ghost'}
              className={`w-full justify-start transition-all ${
                currentView === 'inbox' 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                  : 'hover:bg-sidebar-accent/50'
              }`}
              onClick={() => handleNavigation('inbox')}
            >
              <Inbox className="mr-2 h-4 w-4" />
              Inbox
            </Button>
            <Button
              variant={currentView === 'sent' ? 'secondary' : 'ghost'}
              className={`w-full justify-start transition-all ${
                currentView === 'sent' 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                  : 'hover:bg-sidebar-accent/50'
              }`}
              onClick={() => handleNavigation('sent')}
            >
              <Send className="mr-2 h-4 w-4" />
              Sent
            </Button>
            <Separator className="my-3" />
            <Button
              variant="ghost"
              className="w-full justify-start transition-all bg-primary/10 hover:bg-primary/20 text-primary font-medium"
              onClick={handleCompose}
            >
              <Plus className="mr-2 h-4 w-4" />
              Compose
            </Button>
          </nav>
        </ScrollArea>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden border-b bg-card/50 backdrop-blur-sm p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Resend Client
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <SettingsDialog />
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-64 bg-sidebar border-r shadow-xl z-50 md:hidden flex flex-col">
            <div className="p-4 border-b bg-sidebar/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Resend Client
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-8 w-8"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
              {mounted && !apiKeyConfigured && (
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-2.5 text-xs text-yellow-800 dark:text-yellow-200">
                  <span className="font-medium">⚠️</span> Please configure your API key in settings
                </div>
              )}
            </div>
            <ScrollArea className="flex-1">
              <nav className="p-3 space-y-1">
                <Button
                  variant={currentView === 'inbox' ? 'secondary' : 'ghost'}
                  className={`w-full justify-start transition-all ${
                    currentView === 'inbox' 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                      : 'hover:bg-sidebar-accent/50'
                  }`}
                  onClick={() => {
                    handleNavigation('inbox');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Inbox className="mr-2 h-4 w-4" />
                  Inbox
                </Button>
                <Button
                  variant={currentView === 'sent' ? 'secondary' : 'ghost'}
                  className={`w-full justify-start transition-all ${
                    currentView === 'sent' 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                      : 'hover:bg-sidebar-accent/50'
                  }`}
                  onClick={() => {
                    handleNavigation('sent');
                    setMobileMenuOpen(false);
                  }}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Sent
                </Button>
                <Separator className="my-3" />
                <Button
                  variant="ghost"
                  className="w-full justify-start transition-all bg-primary/10 hover:bg-primary/20 text-primary font-medium"
                  onClick={() => {
                    handleCompose();
                    setMobileMenuOpen(false);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Compose
                </Button>
              </nav>
            </ScrollArea>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
      
      {/* Compose Panel - Global */}
      <ComposePanel
        open={composeOpen}
        onOpenChange={setComposeOpen}
      />
      
      {/* Floating Compose Button */}
      <Button
        onClick={handleCompose}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-30 md:hidden hover:scale-105 transition-transform"
        aria-label="Compose email"
      >
        <Plus className="h-6 w-6" />
      </Button>
      <Button
        onClick={handleCompose}
        size="lg"
        className="fixed bottom-6 right-6 h-14 px-6 rounded-full shadow-lg z-30 hidden md:flex hover:scale-105 transition-transform"
        aria-label="Compose email"
      >
        <Plus className="h-5 w-5 mr-2" />
        Compose
      </Button>
    </div>
  );
}

