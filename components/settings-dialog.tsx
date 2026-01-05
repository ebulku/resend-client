'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getSettings, saveSettings, type Settings } from '@/lib/settings';
import { Settings as SettingsIcon } from 'lucide-react';

export function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({ apiKey: '', fromEmail: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setSettings(getSettings());
      setSaved(false);
    }
  }, [open]);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    // Trigger a custom event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('settings-updated'));
    }
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <SettingsIcon className="h-4 w-4" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your Resend API key and default email settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              Resend API Key <span className="text-destructive">*</span>
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={settings.apiKey}
              onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Resend Dashboard
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="fromEmail" className="text-sm font-medium">
              Default From Email
            </label>
            <Input
              id="fromEmail"
              type="email"
              placeholder="onboarding@resend.dev"
              value={settings.fromEmail}
              onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Default email address to use when sending emails
            </p>
          </div>

          {saved && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-200">
              Settings saved successfully!
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!settings.apiKey}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

