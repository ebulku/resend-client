'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getSettings } from '@/lib/settings';
import { apiCache } from '@/lib/cache';
import { RefreshCw } from 'lucide-react';

interface Email {
  id: string;
  to: string[];
  from: string;
  subject: string;
  created_at: string;
  status?: string;
}

interface EmailListProps {
  type: 'sent' | 'received';
  onEmailSelect?: (email: Email) => void;
}

export function EmailList({ type, onEmailSelect }: EmailListProps) {
  // Initialize with cached data if available
  const getInitialEmails = (): Email[] => {
    try {
      const settings = getSettings();
      if (settings.apiKey) {
        const cacheKey = `emails-${type}-${settings.apiKey}`;
        const cached = apiCache.get<{ data: Email[] }>(cacheKey);
        if (cached) {
          return cached.data || [];
        }
      }
    } catch {
      // Ignore errors during initialization
    }
    return [];
  };

  const [emails, setEmails] = useState<Email[]>(getInitialEmails);
  const [loading, setLoading] = useState(getInitialEmails().length === 0);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const currentTypeRef = useRef(type);

  const fetchEmails = useCallback(async (forceRefresh = false) => {
    // Prevent duplicate requests
    if (fetchingRef.current && !forceRefresh) {
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const settings = getSettings();
      if (!settings.apiKey) {
        setError('Please configure your API key in settings');
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      const cacheKey = `emails-${type}-${settings.apiKey}`;
      
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = apiCache.get<{ data: Email[] }>(cacheKey);
        if (cached) {
          // Cache stores the email array directly
          setEmails(cached.data || []);
          setLoading(false);
          fetchingRef.current = false;
          return;
        }
      }

      const response = await fetch(`/api/emails/${type}?apiKey=${encodeURIComponent(settings.apiKey)}`);
      const result = await response.json();
      
      if (result.success) {
        const emailData = result.data?.data || [];
        setEmails(emailData);
        // Cache the email array directly for easier access
        apiCache.set(cacheKey, { data: emailData }, 30000);
      } else {
        setError(result.error || 'Failed to fetch emails');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [type]);

  useEffect(() => {
    // Only fetch if type actually changed
    if (currentTypeRef.current !== type) {
      currentTypeRef.current = type;
      // Try to load from cache first
      const settings = getSettings();
      if (settings.apiKey) {
        const cacheKey = `emails-${type}-${settings.apiKey}`;
        const cached = apiCache.get<{ data: Email[] }>(cacheKey);
        if (cached && cached.data && cached.data.length > 0) {
          setEmails(cached.data);
          setLoading(false);
          return; // Don't fetch if we have cached data
        } else {
          setEmails([]);
          setLoading(true);
        }
      }
    }
    
    // Fetch emails (will check cache internally)
    fetchEmails(false);
  }, [type, fetchEmails]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusColors: Record<string, string> = {
      sent: 'bg-green-500',
      delivered: 'bg-blue-500',
      bounced: 'bg-red-500',
      failed: 'bg-red-500',
    };
    return (
      <Badge className={statusColors[status] || 'bg-gray-500'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <p className="text-destructive text-center">{error}</p>
        <Button onClick={fetchEmails} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground text-center">
          {type === 'sent' 
            ? 'No sent emails found'
            : 'No received emails found'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm p-3 md:p-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h2 className="text-lg md:text-xl font-semibold">
            {type === 'sent' ? 'Sent' : 'Inbox'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {emails.length} {emails.length === 1 ? 'email' : 'emails'}
          </p>
        </div>
        <Button onClick={() => fetchEmails(true)} variant="outline" size="sm" disabled={loading} className="hidden sm:flex">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button onClick={() => fetchEmails(true)} variant="outline" size="icon" disabled={loading} className="sm:hidden">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="hidden md:block">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10 border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px] font-semibold text-xs uppercase text-muted-foreground">
                  {type === 'sent' ? 'To' : 'From'}
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase text-muted-foreground">Subject</TableHead>
                <TableHead className="w-[120px] font-semibold text-xs uppercase text-muted-foreground">Date</TableHead>
                {type === 'sent' && <TableHead className="w-[100px] font-semibold text-xs uppercase text-muted-foreground">Status</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.map((email) => (
                <TableRow
                  key={email.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors border-b group"
                  onClick={() => onEmailSelect?.(email)}
                >
                  <TableCell className="font-medium py-3">
                    <div className="truncate max-w-[200px] text-sm">
                      {type === 'sent'
                        ? Array.isArray(email.to)
                          ? email.to.join(', ')
                          : email.to
                        : email.from}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="truncate max-w-[400px] text-sm">
                      {email.subject || (
                        <span className="text-muted-foreground italic">(No subject)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm py-3">
                    {formatDate(email.created_at)}
                  </TableCell>
                  {type === 'sent' && (
                    <TableCell className="py-3">
                      {getStatusBadge(email.status)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* Mobile view */}
        <div className="md:hidden">
          <div className="divide-y">
            {emails.map((email) => (
              <div
                key={email.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onEmailSelect?.(email)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {type === 'sent'
                        ? Array.isArray(email.to)
                          ? email.to.join(', ')
                          : email.to
                        : email.from}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {formatDate(email.created_at)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {email.subject || (
                    <span className="italic">(No subject)</span>
                  )}
                </div>
                {type === 'sent' && email.status && (
                  <div className="mt-2">
                    {getStatusBadge(email.status)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
