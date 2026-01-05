'use client';

import { useState } from 'react';
import { EmailClientLayout } from '@/components/email-client-layout';
import { EmailList } from '@/components/email-list';
import { EmailDetail } from '@/components/email-detail';
import { ComposePanel } from '@/components/compose-panel';

interface Email {
  id: string;
  to: string[];
  from: string;
  subject: string;
  created_at: string;
  status?: string;
  html?: string;
  text?: string;
  message_id?: string;
}

export default function InboxPage() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [replyEmail, setReplyEmail] = useState<Email | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
  };

  const handleBackToList = () => {
    setSelectedEmail(null);
  };

  const handleReply = (email: Email) => {
    setReplyEmail(email);
    setComposeOpen(true);
  };

  return (
    <>
      <EmailClientLayout activeView="inbox">
        {selectedEmail ? (
          <EmailDetail
            email={selectedEmail}
            onBack={handleBackToList}
            onReply={handleReply}
          />
        ) : (
          <EmailList type="received" onEmailSelect={handleEmailSelect} />
        )}
      </EmailClientLayout>
      {replyEmail && (
        <ComposePanel
          open={composeOpen}
          onOpenChange={(open) => {
            setComposeOpen(open);
            if (!open) setReplyEmail(null);
          }}
          replyTo={{
            to: replyEmail.from ? [replyEmail.from] : [],
            from: Array.isArray(replyEmail.to) ? replyEmail.to[0] : replyEmail.to,
            subject: replyEmail.subject || '',
            messageId: replyEmail.message_id,
            originalHtml: replyEmail.html,
            originalText: replyEmail.text,
            originalFrom: replyEmail.from,
            originalDate: new Date(replyEmail.created_at).toLocaleString(),
          }}
        />
      )}
    </>
  );
}

