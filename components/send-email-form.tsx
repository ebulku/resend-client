'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSettings } from '@/lib/settings';
import { Send } from 'lucide-react';
import { RichTextEditor } from '@/components/rich-text-editor';

export function SendEmailForm() {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    html: '',
    from: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const settings = getSettings();
      if (!settings.apiKey) {
        setResult({ success: false, message: 'Please configure your API key in settings' });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: formData.to.split(',').map((email) => email.trim()),
          subject: formData.subject,
          html: formData.html || undefined,
          text: formData.html ? formData.html.replace(/<[^>]*>/g, '').trim() : undefined,
          from: formData.from || settings.fromEmail || undefined,
          apiKey: settings.apiKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: 'Email sent successfully!' });
        setFormData({
          to: '',
          subject: '',
          html: '',
          from: '',
        });
      } else {
        setResult({ success: false, message: data.error || 'Failed to send email' });
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const settings = getSettings();

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm p-4 sticky top-0 z-10">
        <h2 className="text-lg font-semibold">Compose</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Create and send a new email</p>
      </div>
      <ScrollArea className="flex-1">
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-4xl mx-auto">
          <div className="space-y-2">
            <label htmlFor="from" className="text-sm font-medium">
              From
            </label>
            <Input
              id="from"
              type="email"
              placeholder={settings.fromEmail || "sender@example.com"}
              value={formData.from}
              onChange={(e) => handleChange('from', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use default from settings
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="to" className="text-sm font-medium">
              To <span className="text-destructive">*</span>
            </label>
            <Input
              id="to"
              type="text"
              placeholder="recipient@example.com or recipient1@example.com, recipient2@example.com"
              value={formData.to}
              onChange={(e) => handleChange('to', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Subject <span className="text-destructive">*</span>
            </label>
            <Input
              id="subject"
              type="text"
              placeholder="Email subject"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="html" className="text-sm font-medium">
              Message
            </label>
            <RichTextEditor
              value={formData.html}
              onChange={(value) => handleChange('html', value)}
              placeholder="Compose your message..."
            />
          </div>

          {result && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.success ? 'Success' : 'Error'}
              </Badge>
              <span className={result.success ? 'text-green-600 dark:text-green-400' : 'text-destructive'}>
                {result.message}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="submit" disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
}
