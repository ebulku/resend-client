'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSettings } from '@/lib/settings';
import { Send, X, Minimize2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { RichTextEditor } from '@/components/rich-text-editor';

interface ComposePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: {
    to: string[];
    from: string;
    subject: string;
    messageId?: string;
    originalHtml?: string;
    originalText?: string;
    originalFrom?: string;
    originalDate?: string;
  };
  onSent?: () => void;
}

export function ComposePanel({ open, onOpenChange, replyTo, onSent }: ComposePanelProps) {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    html: '',
    from: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [minimized, setMinimized] = useState(false);

  // Initialize form when panel opens or replyTo changes
  useEffect(() => {
    if (open) {
      const settings = getSettings();
      if (replyTo) {
        // Pre-fill reply fields with original email content
        const originalDate = replyTo.originalDate || new Date().toLocaleString();
        const originalFrom = replyTo.originalFrom || replyTo.from;
        
        const quotedHtml = replyTo.originalHtml
          ? '<p><br></p><div style="border-left: 3px solid #ccc; padding-left: 1rem; margin-top: 1rem; color: #666;">' +
            '<p style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #999;">' +
            'On ' + originalDate + ', ' + originalFrom + ' wrote:' +
            '</p>' +
            '<div style="margin-top: 0.5rem;">' +
            replyTo.originalHtml +
            '</div>' +
            '</div>'
          : '<p><br></p>';

        setFormData({
          to: Array.isArray(replyTo.to) ? replyTo.to.join(', ') : replyTo.to,
          subject: replyTo.subject.startsWith('Re: ') ? replyTo.subject : `Re: ${replyTo.subject}`,
          html: quotedHtml,
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
      setMinimized(false);
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
        const settings = getSettings();
        setFormData({
          to: '',
          subject: '',
          html: '',
          from: settings.fromEmail || '',
        });
        // Close panel after a short delay
        setTimeout(() => {
          onOpenChange(false);
          onSent?.();
        }, 1500);
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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Side Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full bg-background border-l shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out",
          minimized ? "w-80" : "w-full md:w-[600px]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="border-b bg-card/50 backdrop-blur-sm p-4 flex items-center justify-between shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {replyTo ? 'Reply' : 'New Message'}
            </h2>
            {replyTo && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                To: {Array.isArray(replyTo.to) ? replyTo.to.join(', ') : replyTo.to}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMinimized(!minimized)}
              className="h-8 w-8"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!minimized && (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="from" className="text-sm font-medium text-muted-foreground">
                      From
                    </label>
                    <Input
                      id="from"
                      type="email"
                      placeholder="sender@example.com"
                      value={formData.from}
                      onChange={(e) => handleChange('from', e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="to" className="text-sm font-medium text-muted-foreground">
                      To <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="to"
                      type="text"
                      placeholder="recipient@example.com"
                      value={formData.to}
                      onChange={(e) => handleChange('to', e.target.value)}
                      required
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium text-muted-foreground">
                      Subject <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="Email subject"
                      value={formData.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      required
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="html" className="text-sm font-medium text-muted-foreground">
                      Message
                    </label>
                    <RichTextEditor
                      value={formData.html}
                      onChange={(value) => handleChange('html', value)}
                      placeholder="Compose your message..."
                    />
                  </div>

                  {result && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-muted border">
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        {result.success ? 'Success' : 'Error'}
                      </Badge>
                      <span
                        className={
                          result.success
                            ? 'text-green-600 dark:text-green-400 text-sm'
                            : 'text-destructive text-sm'
                        }
                      >
                        {result.message}
                      </span>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex justify-end gap-2 px-4 py-3 border-t bg-muted/30 shrink-0">
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
          </>
        )}
      </div>
    </>
  );
}

