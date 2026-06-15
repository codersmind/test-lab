# MailBox - Gmail Clone

A responsive Gmail-style web app built with **Next.js**, using **AWS SES** for email delivery, **Firebase** (Auth + Firestore) for data, and **FCM** for push notifications.

## Features

- **Mail** – Inbox, Sent, Drafts, Starred, Scheduled, Trash
- **Compose** – To/Cc/Bcc, schedule send, save drafts, contact autocomplete
- **Calendar** – Month view, create/edit/delete events, reminders
- **Contacts** – Full CRUD, search, quick email from contact
- **Auth** – Admin-provisioned accounts only (`some@mydomain.com`); no public sign-up
- **Admin panel** – Create users, reset passwords, enable/disable accounts
- **Inbound mail** – Receive from Gmail/external senders into inbox (AWS SES + S3 + SNS)
- **PWA** – Install on mobile and desktop; offline app shell caching
- **Push notifications** – FCM alerts for new mail (background + foreground)
- **Responsive** – Mobile sidebar, split-pane mail on desktop

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React, Tailwind CSS |
| Auth & DB | Firebase Auth, Firestore |
| Email | AWS SES |
| Push & PWA | Firebase Cloud Messaging (FCM), Serwist service worker |

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill in .env.local — see full guide below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Documentation

| Document | Description |
|----------|-------------|
| **[Full Setup Guide](docs/SETUP.md)** | Complete step-by-step: Firebase, SES, FCM, admin, deploy |
| **[Gmail Parity](docs/GMAIL-PARITY.md)** | What's like Gmail vs what's still missing |
| **[Architecture](docs/ARCHITECTURE.md)** | System design, data model, API flows |

### Setup summary

1. Configure [Firebase](docs/SETUP.md#5-firebase-setup) (Auth, Firestore, FCM, Admin SDK)
2. Configure [AWS SES](docs/SETUP.md#8-aws-ses-email-sending) for sending mail
3. Set [environment variables](docs/SETUP.md#4-environment-variables) in `.env.local`
4. [Bootstrap first admin](docs/SETUP.md#72--bootstrap-first-admin)
5. Create users at `/admin` and share credentials
6. [Deploy](docs/SETUP.md#12-deploy-to-production) to Vercel or your host

## Project structure

```
src/
├── app/
│   ├── api/          # REST API routes
│   ├── admin/        # User management (admin only)
│   ├── mail/         # Mail pages
│   ├── calendar/     # Calendar page
│   └── contacts/     # Contacts page
├── components/       # UI components
├── hooks/            # Data hooks
├── lib/              # Firebase, SES, FCM
└── types/            # TypeScript types
docs/
├── SETUP.md          # Full setup guide
└── ARCHITECTURE.md   # Technical architecture
```

## License

MIT
