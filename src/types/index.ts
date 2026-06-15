export type MailFolder =
  | "inbox"
  | "sent"
  | "drafts"
  | "starred"
  | "trash"
  | "scheduled"
  | "archive";

export type ComposeMode = "new" | "reply" | "reply-all" | "forward" | "draft";

export interface ComposeState {
  mode: ComposeMode;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  draftId?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  fcmToken?: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  s3Key: string;
}

export interface Email {
  id: string;
  userId: string;
  from: string;
  fromName?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  folder: MailFolder;
  read: boolean;
  starred: boolean;
  labels: string[];
  threadId?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: EmailAttachment[];
  scheduledAt?: string;
  sentAt?: string;
  sesMessageId?: string;
  external?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  attendees?: string[];
  color?: string;
  reminderMinutes?: number;
  linkedEmailId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledEmail {
  id: string;
  userId: string;
  emailId: string;
  scheduledAt: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  createdAt: string;
}

export interface UserSettings {
  signature: string;
  replyBehavior: "reply" | "reply-all";
}

export interface ComposeEmailPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  scheduledAt?: string;
  draftId?: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: EmailAttachment[];
}
