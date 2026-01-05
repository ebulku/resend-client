"use client";

import { useState } from "react";
import { EmailClientLayout } from "@/components/email-client-layout";
import { EmailList } from "@/components/email-list";
import { EmailDetail } from "@/components/email-detail";

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

export default function SentPage() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
  };

  const handleBackToList = () => {
    setSelectedEmail(null);
  };

  return (
    <EmailClientLayout activeView="sent">
      {selectedEmail ? (
        <EmailDetail email={selectedEmail} onBack={handleBackToList} />
      ) : (
        <EmailList type="sent" onEmailSelect={handleEmailSelect} />
      )}
    </EmailClientLayout>
  );
}
