# MailBox — Architecture

## System diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (User)                          │
│  Next.js pages: /mail, /calendar, /contacts, /admin, /login     │
└───────────────┬─────────────────────────────┬───────────────────┘
                │ Firebase Auth (client)       │ REST API + Bearer token
                ▼                              ▼
┌───────────────────────┐          ┌──────────────────────────────┐
│   Firebase Auth       │          │   Next.js API Routes         │
│   (sign in only)      │          │   /api/emails, /contacts...  │
└───────────────────────┘          └───────────┬──────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
           ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
           │  Firestore   │          │   AWS SES    │          │  FCM Admin   │
           │  (database)  │          │  (send mail) │          │  (push)      │
           └──────────────┘          └──────────────┘          └──────────────┘
```

## Auth flow

1. **Admin** creates user via `/api/admin/users` → Firebase Admin `createUser()` + Firestore `users` doc
2. **User** signs in with Firebase client `signInWithEmailAndPassword`
3. App calls `/api/auth/me` → verifies Firestore `users` doc exists and `active: true`
4. If not provisioned → sign out immediately

Public `createUserWithEmailAndPassword` is not exposed in the UI.

## Data model

### `users`
```typescript
{
  email: string;
  displayName: string;
  role: "admin" | "user";
  active: boolean;
  fcmToken?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}
```

### `emails`
```typescript
{
  userId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;        // HTML
  folder: "inbox" | "sent" | "drafts" | "starred" | "trash" | "scheduled";
  read: boolean;
  starred: boolean;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### `scheduled_emails`
```typescript
{
  userId: string;
  emailId: string;
  scheduledAt: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  createdAt: string;
}
```

### `contacts`
```typescript
{
  userId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### `calendar_events`
```typescript
{
  userId: string;
  title: string;
  description?: string;
  start: string;       // ISO datetime
  end: string;
  allDay: boolean;
  location?: string;
  attendees?: string[];
  color?: string;
  reminderMinutes?: number;
  createdAt: string;
  updatedAt: string;
}
```

## Email send flow

1. User composes email in UI
2. `POST /api/emails` with optional `scheduledAt`
3. **If scheduled:** save to Firestore with `folder: scheduled`, create `scheduled_emails` doc
4. **If immediate:** call AWS SES `SendEmail`, save to `sent`, create inbox copies for recipients
5. FCM notification to sender on success

## Scheduled email flow

1. Cron hits `GET /api/schedule/process` every minute
2. Query pending emails where `scheduledAt <= now`
3. Send via SES, update folders, notify via FCM

## Folder structure

```
src/
├── app/
│   ├── admin/              Admin user management page
│   ├── api/                Server API routes
│   ├── calendar/           Calendar page
│   ├── contacts/           Contacts page
│   ├── login/              Login page
│   └── mail/               Mail inbox + folders
├── components/
│   ├── admin/              UsersManager
│   ├── auth/               AuthProvider, guards, login
│   ├── calendar/           CalendarView, EventModal
│   ├── contacts/           ContactsView
│   ├── layout/             AppShell, Sidebar, Header
│   ├── mail/               Compose, list, detail
│   └── providers/          FCMProvider
├── hooks/                  useApi, useEmails, useContacts, useCalendar
├── lib/
│   ├── auth/               verify, config, admin checks
│   ├── aws/                SES client
│   ├── firebase/           client + admin SDK
│   └── fcm/                client + server push
├── store/                  UI state (Zustand)
└── types/                  TypeScript interfaces
```
