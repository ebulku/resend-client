'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getSettings } from '@/lib/settings';
import { Send, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from '@/components/rich-text-editor';

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    to: string[];
    from: string;
    subject: string;
    messageId?: string;
  };
  onSent?: () => void;
}

export function ComposeModal({ open, onOpenChange, replyTo, onSent }: ComposeModalProps) {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    html: '',
    from: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Initialize form when modal opens or replyTo changes
  useEffect(() => {
    if (open) {
      const settings = getSettings();
      if (replyTo) {
        // Pre-fill reply fields
        setFormData({
          to: Array.isArray(replyTo.to) ? replyTo.to.join(', ') : replyTo.to,
          subject: replyTo.subject.startsWith('Re: ') ? replyTo.subject : `Re: ${replyTo.subject}`,
          html: '',
          from: settings.fromEmail || '',
        });
      } else {
        // Reset for new email
        setFormData({
          to: '',
          subject: '',
          html: '',
          from: settings.fromEmail || '',
        });
      }
      setResult(null);
    }
  }, [open, replyTo]);

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
          replyTo: replyTo?.messageId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ success: true, message: 'Email sent successfully!' });
        // Reset form
        setFormData({
          to: '',
          subject: '',
          html: '',
          from: settings.fromEmail || '',
        });
        // Close modal after a short delay
        setTimeout(() => {
          onOpenChange(false);
          onSent?.();
        }, 1500);
      } else {
        setResult({ success: false, message: data.error || 'Failed to send email' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setResult({ success: false, message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {replyTo ? 'Reply' : 'New Message'}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {replyTo ? 'Reply to this email' : 'Compose and send a new email'}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 px-6">
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="from" className="text-sm font-medium">
                  From
                </label>
                <Input
                  id="from"
                  type="email"
                  placeholder="sender@example.com"
                  value={formData.from}
                  onChange={(e) => handleChange('from', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="to" className="text-sm font-medium">
                  To <span className="text-destructive">*</span>
                </label>
                <Input
                  id="to"
                  type="text"
                  placeholder="recipient@example.com"
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
                  <span
                    className={
                      result.success
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-destructive'
                    }
                  >
                    {result.message}
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2 px-6 py-4 border-t bg-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

