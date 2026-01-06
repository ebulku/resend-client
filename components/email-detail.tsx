"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, RefreshCw, Reply } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { apiCache } from "@/lib/cache";

interface Email {
  id: string;
  to: string[];
  from: string;
  subject: string;
  created_at: string;
  status?: string;
  html?: string;
  text?: string;
}

interface EmailDetailProps {
  email: Email | null;
  onBack: () => void;
  onReply?: (
    email: Email & {
      originalHtml?: string;
      originalText?: string;
      originalFrom?: string;
      originalDate?: string;
    }
  ) => void;
}

export function EmailDetail({ email, onBack, onReply }: EmailDetailProps) {
  const [fullEmail, setFullEmail] = useState<Email | null>(email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const currentEmailIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (email && email.id !== currentEmailIdRef.current) {
      currentEmailIdRef.current = email.id;
      // Set initial email immediately
      setFullEmail(email);
      // Fetch full email details including content
      fetchEmailDetails(email.id);
    } else if (!email) {
      currentEmailIdRef.current = null;
      setFullEmail(null);
    }
  }, [email?.id]);

  const fetchEmailDetails = async (emailId: string, forceRefresh = false) => {
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
        setError("Please configure your API key in settings");
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      const cacheKey = `email-${emailId}-${settings.apiKey}`;

      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = apiCache.get<Email>(cacheKey);
        if (cached) {
          setFullEmail(cached);
          setLoading(false);
          fetchingRef.current = false;
          return;
        }
      }

      // Determine if this is a received email or sent email
      // We'll try received first, then fall back to sent
      let response = await fetch(
        `/api/emails/received/${emailId}?apiKey=${encodeURIComponent(
          settings.apiKey
        )}`
      );
      let result = await response.json();

      // If received email fails, try sent email
      if (!result.success) {
        response = await fetch(
          `/api/emails/${emailId}?apiKey=${encodeURIComponent(settings.apiKey)}`
        );
        result = await response.json();
      }

      if (result.success) {
        setFullEmail(result.data);
        // Cache for 5 minutes (email content doesn't change)
        apiCache.set(cacheKey, result.data, 300000);
      } else {
        setError(result.error || "Failed to fetch email details");
        // Fallback to the email from list if fetch fails
        if (email) {
          setFullEmail(email);
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      // Fallback to the email from list if fetch fails
      if (email) {
        setFullEmail(email);
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  if (!email) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select an email to view details</p>
      </div>
    );
  }

  const displayEmail = fullEmail || email;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusColors: Record<string, string> = {
      sent: "bg-green-500",
      delivered: "bg-blue-500",
      bounced: "bg-red-500",
      failed: "bg-red-500",
    };
    return (
      <Badge className={statusColors[status] || "bg-gray-500"}>{status}</Badge>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="border-b bg-card/50 backdrop-blur-sm p-3 md:p-4 flex items-center gap-2 md:gap-4 sticky top-0 z-10 shadow-sm shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="hover:bg-accent shrink-0 h-9 w-9 md:h-10 md:w-10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base md:text-xl font-semibold truncate mb-1">
            {displayEmail.subject || "(No subject)"}
          </h2>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
            <span className="truncate">{displayEmail.from}</span>
            <span className="hidden md:inline">→</span>
            <span className="truncate">
              {Array.isArray(displayEmail.to)
                ? displayEmail.to.join(", ")
                : displayEmail.to}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {loading && (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {displayEmail.status && (
            <div className="hidden md:block">
              {getStatusBadge(displayEmail.status)}
            </div>
          )}
          {onReply && (
            <Button
              variant="default"
              size="sm"
              onClick={() =>
                onReply({
                  ...displayEmail,
                  originalHtml: displayEmail.html,
                  originalText: displayEmail.text,
                  originalFrom: displayEmail.from,
                  originalDate: formatDate(displayEmail.created_at),
                })
              }
              className="gap-1 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3"
            >
              <Reply className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Reply</span>
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="border-b p-3 bg-yellow-50 dark:bg-yellow-900/20 shrink-0">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            {error}
          </p>
        </div>
      )}

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl mx-auto">
          <div className="space-y-2 md:space-y-3 bg-muted/30 rounded-lg p-3 md:p-4 border">
            <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-3 text-xs md:text-sm">
              <span className="font-semibold text-muted-foreground md:min-w-[60px]">
                From:
              </span>
              <span className="break-all">{displayEmail.from}</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-3 text-xs md:text-sm">
              <span className="font-semibold text-muted-foreground md:min-w-[60px]">
                To:
              </span>
              <span className="break-all">
                {Array.isArray(displayEmail.to)
                  ? displayEmail.to.join(", ")
                  : displayEmail.to}
              </span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-xs md:text-sm">
              <span className="font-semibold text-muted-foreground md:min-w-[60px]">
                Date:
              </span>
              <span>{formatDate(displayEmail.created_at)}</span>
            </div>
            {displayEmail.status && (
              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-xs md:text-sm md:hidden">
                <span className="font-semibold text-muted-foreground md:min-w-[60px]">
                  Status:
                </span>
                <span>{getStatusBadge(displayEmail.status)}</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              {displayEmail.html ? (
                <div dangerouslySetInnerHTML={{ __html: displayEmail.html }} />
              ) : displayEmail.text ? (
                <pre className="whitespace-pre-wrap font-sans">
                  {displayEmail.text}
                </pre>
              ) : (
                <p className="text-muted-foreground">(No content available)</p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
