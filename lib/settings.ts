export interface Settings {
  apiKey: string;
  fromEmail: string;
}

const SETTINGS_KEY = 'resend-settings';

export function getSettings(): Settings {
  if (typeof window === 'undefined') {
    return { apiKey: '', fromEmail: '' };
  }
  
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return { apiKey: '', fromEmail: '' };
    }
  }
  
  return { apiKey: '', fromEmail: '' };
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function hasApiKey(): boolean {
  const settings = getSettings();
  return !!settings.apiKey;
}

