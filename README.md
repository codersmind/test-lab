# MailBox - Gmail Clone

A responsive Gmail-style web app built with **Next.js**, using **AWS SES** for email delivery, **Firebase** (Auth + Firestore) for data, and **FCM** for push notifications.

## Features

- **Mail** – Inbox, Sent, Drafts, Starred, Scheduled, Trash
- **Compose** – To/Cc/Bcc, schedule send, save drafts, contact autocomplete
- **Calendar** – Month view, create/edit/delete events, reminders
- **Contacts** – Full CRUD, search, quick email from contact
- **Auth** – Email/password + Google sign-in (Firebase Auth)
- **Notifications** – FCM push for sent/scheduled emails
- **Responsive** – Mobile sidebar, split-pane mail on desktop

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React, Tailwind CSS |
| Auth & DB | Firebase Auth, Firestore |
| Email | AWS SES |
| Push | Firebase Cloud Messaging (FCM) |

## Setup

### 1. Clone and install

```bash
npm install
cp .env.example .env.local
```

### 2. Firebase

1. Create a project at [Firebase Console](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password + Google)
3. Create a **Firestore** database
4. Enable **Cloud Messaging** and generate a Web Push certificate (VAPID key)
5. Download a service account JSON for Admin SDK
6. Fill in all `NEXT_PUBLIC_FIREBASE_*` and `FIREBASE_*` vars in `.env.local`

**Firestore indexes** – Create composite indexes for:
- `emails`: `userId` + `folder` + `createdAt`
- `scheduled_emails`: `status` + `scheduledAt`
- `calendar_events`: `userId` + `start`
- `contacts`: `userId` + `name`

### 3. AWS SES

1. Verify your domain/email in [AWS SES](https://console.aws.amazon.com/ses)
2. Move out of sandbox for production sending
3. Create IAM credentials with `ses:SendEmail` permission
4. Set `AWS_*` and `AWS_SES_FROM_EMAIL` in `.env.local`

### 4. FCM Service Worker

Register the service worker in your app (already configured). Place `icon-192.png` in `/public`.

### 5. Scheduled Email Cron

Call `POST /api/schedule/process` every minute with header:

```
x-cron-secret: your-cron-secret
```

Use Vercel Cron, AWS EventBridge, or any scheduler.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/          # REST API routes
│   ├── mail/         # Mail pages
│   ├── calendar/     # Calendar page
│   └── contacts/     # Contacts page
├── components/       # UI components
├── hooks/            # Data hooks
├── lib/              # Firebase, SES, FCM
└── types/            # TypeScript types
```

## License

MIT
