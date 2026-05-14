"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  RefreshCw,
  Reply,
  Paperclip,
  DownloadIcon,
} from "lucide-react";
import { getSettings } from "@/lib/settings";
import { apiCache } from "@/lib/cache";
import { formatSize } from "@/lib/utils";

interface Attachment {
  id: string;
  filename?: string;
  name?: string;
  content_type: string;
  size: number;
  content?: string; // base64
  download_url?: string;
}

interface Email {
  id: string;
  to: string[];
  from: string;
  subject: string;
  created_at: string;
  status?: string;
  html?: string;
  text?: string;
  attachments?: Attachment[];
  folder?: "sent" | "received";
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
    },
  ) => void;
}

function EmailContent({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        try {
          const body = iframe.contentWindow.document.body;
          const docElement = iframe.contentWindow.document.documentElement;
          const height = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            docElement.clientHeight,
            docElement.scrollHeight,
            docElement.offsetHeight,
          );
          iframe.style.height = `${height}px`;
        } catch {
          // Cross-origin issues or other errors
        }
      }
    };

    // Initial update
    const timeout = setTimeout(updateHeight, 100);

    // Add load listener
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener("load", updateHeight);
    }

    return () => {
      clearTimeout(timeout);
      if (iframe) {
        iframe.removeEventListener("load", updateHeight);
      }
    };
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 0;
                line-height: 1.5;
                color: inherit;
              }
              img { max-width: 100%; height: auto; }
              @media (prefers-color-scheme: dark) {
                body { color: #e5e7eb; }
              }
            </style>
          </head>
          <body>${html}</body>
        </html>
      `}
      className="w-full border-none overflow-hidden transition-all duration-200"
      title="Email Content"
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
    />
  );
}

export function EmailDetail({ email, onBack, onReply }: EmailDetailProps) {
  const [fullEmail, setFullEmail] = useState<Email | null>(email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevEmailId, setPrevEmailId] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const handleResult = useCallback(
    (
      result: { success: boolean; data: Email; error?: string },
      cacheKey: string,
    ) => {
      if (result.success) {
        console.log("Fetched email detail:", result.data);
        setFullEmail(result.data);
        apiCache.set(cacheKey, result.data, 300000);
      } else {
        setError(result.error || "Failed to fetch email details");
        if (email) setFullEmail(email);
      }
    },
    [email],
  );

  const fetchEmailDetails = useCallback(
    async (emailId: string, forceRefresh = false) => {
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

        // Use folder-specific endpoint if available, otherwise fall back to trying both
        let response;
        const folder = email?.folder;
        if (folder === "received") {
          response = await fetch(
            `/api/emails/received/${emailId}?apiKey=${encodeURIComponent(
              settings.apiKey,
            )}`,
          );
        } else if (folder === "sent") {
          response = await fetch(
            `/api/emails/sent/${emailId}?apiKey=${encodeURIComponent(
              settings.apiKey,
            )}`,
          );
        } else {
          // Fallback logic if folder is not specified
          const responseFallback = await fetch(
            `/api/emails/received/${emailId}?apiKey=${encodeURIComponent(
              settings.apiKey,
            )}`,
          );
          const resultFallback = await responseFallback.json();
          if (resultFallback.success) {
            handleResult(resultFallback, cacheKey);
            return;
          }

          response = await fetch(
            `/api/emails/sent/${emailId}?apiKey=${encodeURIComponent(
              settings.apiKey,
            )}`,
          );
          if (!response.ok) {
            response = await fetch(
              `/api/emails/${emailId}?apiKey=${encodeURIComponent(
                settings.apiKey,
              )}`,
            );
          }
        }

        if (response) {
          const resultFinal = await response.json();
          handleResult(resultFinal, cacheKey);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        if (email) setFullEmail(email);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [email, handleResult],
  );

  // Reset state when email ID changes - handle in render to avoid race conditions and lint warnings
  if (email && email.id !== prevEmailId) {
    setPrevEmailId(email.id);
    setFullEmail(email);
    // The fetch will be triggered by the useEffect below
  }

  useEffect(() => {
    if (email && prevEmailId === email.id) {
      const timer = setTimeout(() => fetchEmailDetails(email.id), 0);
      return () => clearTimeout(timer);
    } else if (!email && prevEmailId !== null) {
      const timer = setTimeout(() => {
        setPrevEmailId(null);
        setFullEmail(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [email, prevEmailId, fetchEmailDetails]);

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
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchEmailDetails(displayEmail.id, true)}
              className="h-9 w-9"
              title="Refresh email details"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
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
            <div className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                {displayEmail.html ? (
                  <EmailContent html={displayEmail.html} />
                ) : displayEmail.text ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm md:text-base">
                    {displayEmail.text}
                  </pre>
                ) : (
                  <p className="text-muted-foreground">
                    (No content available)
                  </p>
                )}
              </div>

              {displayEmail.attachments &&
                displayEmail.attachments.length > 0 && (
                  <div className="pt-6 border-t">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachments ({displayEmail.attachments.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {displayEmail.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded bg-primary/10 flex items-center justify-center shrink-0">
                              <Paperclip className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium truncate">
                                {attachment.filename || attachment.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatSize(attachment.size)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {attachment.download_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 transition-opacity"
                              >
                                <a
                                  href={attachment.download_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View attachment"
                                >
                                  <DownloadIcon className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
