# MailBox — Full Setup Guide

Complete step-by-step instructions to deploy MailBox from zero to production.

---

## Table of contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Local installation](#3-local-installation)
4. [Environment variables](#4-environment-variables)
5. [Firebase setup](#5-firebase-setup)
6. [Firestore database](#6-firestore-database)
7. [Admin accounts](#7-admin-accounts)
8. [AWS SES (email sending)](#8-aws-ses-email-sending)
9. [Push notifications (FCM)](#9-push-notifications-fcm)
10. [Scheduled email cron](#10-scheduled-email-cron)
11. [Run locally](#11-run-locally)
12. [Deploy to production](#12-deploy-to-production)
13. [Day-to-day operations](#13-day-to-day-operations)
14. [Troubleshooting](#14-troubleshooting)
15. [Production checklist](#15-production-checklist)

---

## 1. Overview

MailBox is a Gmail-style web app:

| Feature | Technology |
|---------|------------|
| Frontend | Next.js 16, React, Tailwind CSS |
| Auth & database | Firebase Auth + Firestore |
| Email delivery | AWS SES |
| Push notifications | Firebase Cloud Messaging (FCM) |
| Scheduled sends | Cron job → `/api/schedule/process` |

**Important:** Public sign-up is disabled. Only admins create accounts (e.g. `john@mydomain.com`). Users sign in with credentials the admin shares.

---

## 2. Prerequisites

Install before you start:

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | 20+ | Run the app |
| npm | 10+ | Package manager |
| Git | Any | Clone repo |
| Firebase account | Free tier OK | Auth, DB, FCM |
| AWS account | Free tier OK | SES email |
| Domain (recommended) | e.g. `mydomain.com` | SES + user emails |

Optional:

- [Vercel](https://vercel.com) account for deployment
- `curl` or Postman for bootstrap API call

---

## 3. Local installation

```bash
# Clone or open the project
cd test-lab

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

Edit `.env.local` with values from the sections below.

---

## 4. Environment variables

Copy `.env.example` to `.env.local` and fill every value.

### Firebase (client — browser)

| Variable | Where to find it |
|----------|------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project settings → Your apps → Web app |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same page (`project-id.firebaseapp.com`) |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Same page |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Same page |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same page |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Same page |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Firebase Console → Project settings → Cloud Messaging → Web Push certificates |

### Firebase (admin — server only)

| Variable | Where to find it |
|----------|------------------|
| `FIREBASE_PROJECT_ID` | Service account JSON → `project_id` |
| `FIREBASE_CLIENT_EMAIL` | Service account JSON → `client_email` |
| `FIREBASE_PRIVATE_KEY` | Service account JSON → `private_key` (keep `\n` as literal or use `\\n` in env) |

**Private key format in `.env.local`:**

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

### AWS SES

| Variable | Example | Description |
|----------|---------|-------------|
| `AWS_REGION` | `us-east-1` | SES region |
| `AWS_ACCESS_KEY_ID` | `AKIA...` | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | `wJalr...` | IAM secret |
| `AWS_SES_FROM_EMAIL` | `noreply@mydomain.com` | Verified sender address |

### Access control

| Variable | Example | Description |
|----------|---------|-------------|
| `ALLOWED_EMAIL_DOMAIN` | `mydomain.com` | Only `@mydomain.com` accounts allowed (server) |
| `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN` | `mydomain.com` | Shown on login page (client) |
| `ADMIN_EMAILS` | `admin@mydomain.com` | Comma-separated admin emails |

### First admin bootstrap (one-time)

| Variable | Example | Description |
|----------|---------|-------------|
| `ADMIN_BOOTSTRAP_SECRET` | `random-long-string` | Secret for bootstrap API |
| `ADMIN_EMAIL` | `admin@mydomain.com` | First admin email |
| `ADMIN_PASSWORD` | `SecurePass123!` | First admin password |
| `ADMIN_DISPLAY_NAME` | `Admin` | Display name |

Remove or rotate `ADMIN_BOOTSTRAP_SECRET` after bootstrap.

### Scheduler

| Variable | Example | Description |
|----------|---------|-------------|
| `CRON_SECRET` | `another-random-string` | Protects scheduled email processor |

### Example complete `.env.local`

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BEl...

# Firebase Admin
FIREBASE_PROJECT_ID=my-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@my-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_SES_FROM_EMAIL=noreply@mydomain.com

# Cron
CRON_SECRET=my-cron-secret-abc123

# Access control
ALLOWED_EMAIL_DOMAIN=mydomain.com
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=mydomain.com
ADMIN_EMAILS=admin@mydomain.com

# Bootstrap (remove secret after first admin created)
ADMIN_BOOTSTRAP_SECRET=bootstrap-secret-xyz789
ADMIN_EMAIL=admin@mydomain.com
ADMIN_PASSWORD=ChangeMe123!
ADMIN_DISPLAY_NAME=Admin
```

---

## 5. Firebase setup

### Step 5.1 — Create project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project**
3. Name it (e.g. `mailbox-prod`)
4. Disable Google Analytics if you don't need it
5. Click **Create project**

### Step 5.2 — Register web app

1. Project overview → **Web** (`</>`)
2. App nickname: `MailBox Web`
3. **Do not** enable Firebase Hosting (we use Vercel/Next.js)
4. Copy the `firebaseConfig` values into `.env.local`

### Step 5.3 — Enable Authentication

1. **Build** → **Authentication** → **Get started**
2. **Sign-in method** → **Email/Password** → Enable
3. **Disable** "Email link (passwordless sign-in)" if shown
4. **Do not** enable Google unless you extend the app — accounts are admin-created only

### Step 5.4 — Create service account (Admin SDK)

1. **Project settings** (gear) → **Service accounts**
2. Click **Generate new private key** → Download JSON
3. Copy into `.env.local`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

Keep this JSON file secure. Never commit it to Git.

### Step 5.5 — Authorized domains (production)

1. **Authentication** → **Settings** → **Authorized domains**
2. Add your production domain (e.g. `mailbox.mydomain.com`)
3. `localhost` is allowed by default for development

---

## 6. Firestore database

### Step 6.1 — Create database

1. **Build** → **Firestore Database** → **Create database**
2. Start in **production mode** (we use API routes, not direct client writes)
3. Choose a region close to your users

### Step 6.2 — Collections (created automatically)

The app creates documents in these collections:

| Collection | Purpose |
|------------|---------|
| `users` | Provisioned accounts (admin + users) |
| `emails` | Inbox, sent, drafts, scheduled, trash |
| `scheduled_emails` | Pending scheduled sends |
| `contacts` | User contacts |
| `calendar_events` | Calendar events |

### Step 6.3 — Composite indexes

Firebase will prompt for indexes when queries fail. Create these proactively:

**Collection: `emails`**

| Fields | Query scope |
|--------|-------------|
| `userId` Asc, `folder` Asc, `createdAt` Desc | Collection |
| `userId` Asc, `starred` Asc, `createdAt` Desc | Collection |

**Collection: `scheduled_emails`**

| Fields | Query scope |
|--------|-------------|
| `status` Asc, `scheduledAt` Asc | Collection |

**Collection: `calendar_events`**

| Fields | Query scope |
|--------|-------------|
| `userId` Asc, `start` Asc | Collection |

**Collection: `contacts`**

| Fields | Query scope |
|--------|-------------|
| `userId` Asc, `name` Asc | Collection |

**Collection: `users`**

| Fields | Query scope |
|--------|-------------|
| `createdAt` Desc | Collection |
| `role` Asc | Collection |

**How to create:**

1. Firestore → **Indexes** → **Composite** → **Create index**
2. Or click the link in the browser console error when a query fails

### Step 6.4 — Security rules (recommended)

Since the app uses Firebase Admin on the server, lock down direct client access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

All data access goes through Next.js API routes with verified Firebase ID tokens.

---

## 7. Admin accounts

### How it works

```
Admin creates account (some@mydomain.com + password)
        ↓
Admin shares credentials with user
        ↓
User signs in at /login
        ↓
Server verifies account exists in Firestore `users` collection
```

Random Firebase accounts cannot sign in — only admin-provisioned users.

### Step 7.1 — Configure domain

In `.env.local`:

```env
ALLOWED_EMAIL_DOMAIN=mydomain.com
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=mydomain.com
ADMIN_EMAILS=admin@mydomain.com
```

Replace `mydomain.com` with your real domain.

### Step 7.2 — Bootstrap first admin

1. Start the dev server (see [Section 11](#11-run-locally))
2. Run bootstrap **once**:

**Windows (PowerShell):**

```powershell
curl.exe -X POST http://localhost:3000/api/admin/bootstrap `
  -H "x-bootstrap-secret: your-bootstrap-secret"
```

**macOS / Linux:**

```bash
curl -X POST http://localhost:3000/api/admin/bootstrap \
  -H "x-bootstrap-secret: your-bootstrap-secret"
```

Expected response:

```json
{
  "success": true,
  "uid": "...",
  "email": "admin@mydomain.com",
  "message": "Admin created. Sign in and remove ADMIN_BOOTSTRAP_SECRET from env."
}
```

3. **Remove** `ADMIN_BOOTSTRAP_SECRET` from `.env.local` after success (or change it)

### Step 7.3 — Sign in as admin

1. Open [http://localhost:3000/login](http://localhost:3000/login)
2. Email: `admin@mydomain.com`
3. Password: value from `ADMIN_PASSWORD`

### Step 7.4 — Create user accounts

1. Sidebar → **Manage users** (admin only)
2. Click **Create account**
3. Enter name, email prefix (e.g. `john` → `john@mydomain.com`), password
4. Share email + password with the user securely

### Admin panel actions

| Action | Description |
|--------|-------------|
| Create account | New user on your domain |
| Reset password | Set new password and share with user |
| Disable / Enable | Block or restore login |
| Delete | Permanently remove Firebase + Firestore user |

---

## 8. AWS SES (email sending)

### Per-user From address

When **john@mydomain.com** logs in and sends mail, SES sends **as john@mydomain.com** — not a shared noreply address. This requires **domain-level verification** in SES so any `@mydomain.com` address is allowed.

### Step 8.1 — Verify your domain (required)

1. Open [AWS SES Console](https://console.aws.amazon.com/ses)
2. Select your region (must match `AWS_REGION`)
3. **Verified identities** → **Create identity** → **Domain**
4. Enter `mydomain.com`
5. Enable **Easy DKIM** (RSA 2048-bit)
6. Add all DNS records AWS provides to your domain registrar:

| Record | Purpose |
|--------|---------|
| 3× CNAME (DKIM) | Email authentication — stops spam folder |
| TXT (SPF) or include in existing SPF | Authorizes SES to send for your domain |

**SPF example** (add to existing TXT or create new):

```txt
v=spf1 include:amazonses.com ~all
```

### Step 8.2 — Custom MAIL FROM (strongly recommended for deliverability)

Default SES bounce domain (`amazonses.com`) can hurt spam scores. Set a custom MAIL FROM:

1. SES → your domain → **MAIL FROM domain**
2. Use e.g. `mail.mydomain.com`
3. Add the MX and TXT records AWS shows
4. Wait until status is **Successful**

This aligns SPF/DMARC so Gmail/Outlook trust mail from `john@mydomain.com`.

### Step 8.3 — DMARC (recommended)

Add a DMARC TXT record at `_dmarc.mydomain.com`:

```txt
v=DMARC1; p=none; rua=mailto:admin@mydomain.com; fo=1
```

Start with `p=none` to monitor, then move to `p=quarantine` or `p=reject` once deliverability is good.

### Step 8.4 — Sandbox vs production

New SES accounts are in **sandbox mode**:

- Can only send **to** verified addresses
- Limited sending volume

For real use:

1. SES → **Account dashboard** → **Request production access**
2. Fill out the form (use case: internal mail app for your domain)
3. Wait for AWS approval (usually 24–48 hours)

### Step 8.5 — IAM user for the app

1. IAM → **Users** → **Create user** (e.g. `mailbox-ses`)
2. Attach policy (minimal):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "s3:GetObject"
      ],
      "Resource": "*"
    }
  ]
}
```

3. **Security credentials** → **Create access key** → Application running outside AWS
4. Copy `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` to `.env.local`

### Step 8.6 — Optional configuration set

Create an SES **Configuration set** for bounce/complaint tracking and add to `.env.local`:

```env
AWS_SES_CONFIGURATION_SET=mailbox-tracking
```

### Step 8.7 — Test sending

1. Sign in as `john@mydomain.com`
2. **Compose** → send to a verified email (in sandbox) or any address (production)
3. Check recipient inbox — **From** should show `John <john@mydomain.com>`
4. Verify headers in Gmail: **Show original** → look for `dkim=pass`, `spf=pass`

### What the app does to avoid spam filters

| Technique | Description |
|-----------|-------------|
| Per-user From | `John Doe <john@mydomain.com>` from logged-in user |
| Reply-To | Matches sender email |
| Message-ID | Unique per message on your domain |
| Date header | RFC 2822 compliant |
| multipart/alternative | Both plain text and HTML parts |
| HTML wrapper | Valid `<!DOCTYPE html>` document |
| Domain validation | Only `@ALLOWED_EMAIL_DOMAIN` can send |

**DNS (your responsibility):** DKIM + SPF + custom MAIL FROM + DMARC must be configured in SES/DNS for best deliverability.

---

## 8.8 — Receive inbound email (Gmail → your inbox)

When `friend@gmail.com` sends to `john@mycompany.com`, mail arrives in John's **MailBox inbox** via AWS SES inbound.

### Flow

```
friend@gmail.com
       ↓
MX records → AWS SES Inbound
       ↓
S3 bucket (raw email stored)
       ↓
SNS topic → POST https://your-app.com/api/inbound/ses
       ↓
App parses email → Firestore inbox for john@mycompany.com
```

### Step 8.8.1 — Create S3 bucket

1. AWS S3 → **Create bucket** (e.g. `mycompany-mail-inbound`)
2. Same region as SES (`AWS_REGION`)
3. Block public access: **ON**
4. Add to `.env.local`:

```env
AWS_SES_INBOUND_BUCKET=mycompany-mail-inbound
AWS_SES_INBOUND_PREFIX=inbound/
```

### Step 8.8.2 — Create SNS topic

1. AWS SNS → **Topics** → **Create topic** (Standard)
2. Name: `mailbox-inbound`
3. Copy ARN to `.env.local`:

```env
AWS_SNS_INBOUND_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:mailbox-inbound
```

### Step 8.8.3 — SES receipt rule set

1. SES → **Email receiving** → **Rule sets**
2. Create rule set → **Set as active**
3. **Create rule**:
   - **Recipients**: `mycompany.com` (your domain)
   - **Action 1 — S3**:
     - Bucket: `mycompany-mail-inbound`
     - Object key prefix: `inbound/` (must match `AWS_SES_INBOUND_PREFIX`)
   - **Action 2 — SNS**:
     - Topic: `mailbox-inbound`
4. Save rule

### Step 8.8.4 — SNS HTTPS subscription

1. SNS → your topic → **Create subscription**
2. Protocol: **HTTPS**
3. Endpoint: `https://your-production-url.com/api/inbound/ses`
4. SNS sends a confirmation — the app auto-confirms on first POST
5. Status must show **Confirmed**

For local testing use [ngrok](https://ngrok.com) to expose `localhost:3000/api/inbound/ses`.

### Step 8.8.5 — MX records (critical)

SES → **Email receiving** → select your domain → copy **MX record**.

Add to your domain DNS (replace region if not us-east-1):

| Type | Host | Value | Priority |
|------|------|-------|----------|
| MX | `@` or `mycompany.com` | `inbound-smtp.us-east-1.amazonaws.com` | 10 |

**Important:** If you already use Google Workspace or another mail host, MX can only point to **one** provider. You must either:
- Use MailBox/SES as primary MX (receive all mail here), or
- Use subdomains (e.g. `mail.mycompany.com` for the app)

### Step 8.8.6 — IAM permissions (update)

Add S3 read access to your IAM user policy:

```json
{
  "Effect": "Allow",
  "Action": ["s3:GetObject"],
  "Resource": "arn:aws:s3:::mycompany-mail-inbound/inbound/*"
}
```

SES also needs permission to write to S3 (AWS usually prompts when creating the receipt rule).

### Step 8.8.7 — Test inbound

1. Ensure `john@mycompany.com` exists as a user in the app
2. From Gmail, send to `john@mycompany.com`
3. Check S3 bucket — file should appear under `inbound/`
4. Check SNS subscription deliveries (no errors)
5. Sign in as John → **Inbox** — email from Gmail should appear
6. Push notification if FCM is enabled

### Troubleshooting inbound

| Problem | Fix |
|---------|-----|
| Mail never arrives in S3 | Check MX records point to SES inbound |
| S3 has file but no inbox | Check SNS subscription is Confirmed |
| Webhook 403 | `AWS_SNS_INBOUND_TOPIC_ARN` must match topic ARN |
| Webhook 500 | Check `AWS_SES_INBOUND_BUCKET` and IAM `s3:GetObject` |
| User inbox empty | Recipient must exist in app (`john@mycompany.com` provisioned) |

---

## 9. Push notifications (FCM)

### Step 9.1 — VAPID key

1. Firebase Console → **Project settings** → **Cloud Messaging**
2. **Web configuration** → **Generate key pair**
3. Copy to `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

### Step 9.2 — Service worker

The file `public/firebase-messaging-sw.js` handles background notifications.

For production, you may need to inject Firebase config into the service worker. The app registers FCM when users sign in.

### Step 9.3 — Browser permission

Users must allow notifications when prompted. Notifications fire when:

- An email is sent successfully
- A scheduled email is delivered

### Step 9.4 — HTTPS requirement

FCM push requires **HTTPS** in production. `localhost` works for development.

---

## 10. Scheduled email cron

Scheduled emails are stored in Firestore and processed by `/api/schedule/process`.

### What it does

Every minute the cron job:

1. Finds `scheduled_emails` where `status = pending` and `scheduledAt <= now`
2. Sends via AWS SES
3. Moves email to **Sent**
4. Sends FCM notification

### Option A — Vercel Cron (included)

`vercel.json` already configures:

```json
{
  "crons": [
    {
      "path": "/api/schedule/process",
      "schedule": "* * * * *"
    }
  ]
}
```

Set `CRON_SECRET` in Vercel environment variables. Vercel sends:

```
Authorization: Bearer <CRON_SECRET>
```

### Option B — Manual / external cron

**GET or POST** every minute:

```bash
curl -X GET https://your-app.vercel.app/api/schedule/process \
  -H "x-cron-secret: your-cron-secret"
```

Or with Authorization header:

```bash
curl -X GET https://your-app.vercel.app/api/schedule/process \
  -H "Authorization: Bearer your-cron-secret"
```

### Option C — AWS EventBridge

Create a rule with schedule `rate(1 minute)` targeting an HTTP endpoint or Lambda that calls the API.

---

## 11. Run locally

```bash
npm run dev
```

| URL | Page |
|-----|------|
| [http://localhost:3000](http://localhost:3000) | Redirects to mail |
| [http://localhost:3000/login](http://localhost:3000/login) | Sign in |
| [http://localhost:3000/mail](http://localhost:3000/mail) | Inbox |
| [http://localhost:3000/admin](http://localhost:3000/admin) | User management |
| [http://localhost:3000/calendar](http://localhost:3000/calendar) | Calendar |
| [http://localhost:3000/contacts](http://localhost:3000/contacts) | Contacts |

**Production build test:**

```bash
npm run build
npm start
```

---

## 12. Deploy to production

### Vercel (recommended)

1. Push code to GitHub
2. [vercel.com](https://vercel.com) → **Import project**
3. Framework: **Next.js** (auto-detected)
4. Add **all** environment variables from `.env.local`
5. Deploy

**Important env vars for production:**

- All `NEXT_PUBLIC_*` variables (embedded at build time)
- All server secrets (`FIREBASE_PRIVATE_KEY`, `AWS_*`, `CRON_SECRET`, etc.)
- `ALLOWED_EMAIL_DOMAIN` and `ADMIN_EMAILS`
- Remove or unset `ADMIN_BOOTSTRAP_SECRET` after admin exists

### After deploy

1. Add production URL to Firebase **Authorized domains**
2. Re-run bootstrap on production **only if** no admin exists yet:
   ```bash
   curl -X POST https://your-app.vercel.app/api/admin/bootstrap \
     -H "x-bootstrap-secret: your-bootstrap-secret"
   ```
3. Verify SES sending from production
4. Confirm cron runs (Vercel → Project → Cron Jobs)

### Other hosts

Any Node.js host that supports Next.js:

```bash
npm run build
npm start
```

Set env vars on the host. Configure an external cron for scheduled emails if not using Vercel.

---

## 13. Day-to-day operations

### Add a new employee

1. Admin → **Manage users** → **Create account**
2. Email: `newuser@mydomain.com`, set password
3. Share credentials securely (password manager, in person, etc.)
4. User signs in at `/login`

### Reset forgotten password

1. Admin → **Manage users**
2. Click key icon next to user → enter new password
3. Share new password with user

### Disable leaver account

1. Admin → **Manage users** → disable (user icon with X)
2. Or delete the account permanently

### Schedule an email

1. **Compose** → write email
2. Click clock icon → pick date/time
3. Click **Schedule**
4. View under **Scheduled** folder

---

## 14. Troubleshooting

### `Firebase is not configured` on login page

- Check all `NEXT_PUBLIC_FIREBASE_*` vars in `.env.local`
- Restart dev server after changing env vars

### `auth/invalid-api-key`

- Wrong `NEXT_PUBLIC_FIREBASE_API_KEY`
- Re-copy from Firebase Console

### `Account not provisioned by admin`

- User exists in Firebase Auth but not in Firestore `users` collection
- Create account via admin panel, don't add users manually in Firebase Console alone

### `Email domain is not allowed`

- Email must end with `@ALLOWED_EMAIL_DOMAIN`
- Check `ALLOWED_EMAIL_DOMAIN` matches your domain

### `Admin access required`

- Your email must be in `ADMIN_EMAILS` or have `role: admin` in Firestore

### SES `MessageRejected` / emails go to spam

- Verify **domain** (not just one email) in SES
- Complete **DKIM** + **SPF** DNS records
- Set **custom MAIL FROM** subdomain in SES
- Add **DMARC** record
- Request **production access** (sandbox limits hurt reputation)
- In Gmail: open message → **Show original** → confirm `dkim=pass` and `spf=pass`
- Ensure `ALLOWED_EMAIL_DOMAIN` matches your verified SES domain

### SES `Email address is not verified`

- SES sandbox: verify recipient email too, or request production access
- Ensure sender domain is verified in SES (any `@mydomain.com` user can send after domain verify)

### Firestore `FAILED_PRECONDITION` / index required

- Click the link in the error to create the composite index
- Wait 2–5 minutes for index to build

### Scheduled emails not sending

- Confirm cron is running
- Check `CRON_SECRET` matches
- Call manually: `curl -H "x-cron-secret: ..." http://localhost:3000/api/schedule/process`
- Verify `scheduled_emails` collection has `status: pending`

### FCM notifications not appearing

- User must grant browser permission
- Requires HTTPS in production
- Check `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
- Verify `users` collection has `fcmToken` for the user

### `FIREBASE_PRIVATE_KEY` errors on server

- Ensure key is wrapped in quotes
- Use `\n` for newlines in `.env.local`
- On Vercel: paste full key including `-----BEGIN PRIVATE KEY-----`

---

## 15. Production checklist

Use this before going live:

- [ ] All `.env.local` values set on hosting platform
- [ ] Firebase Auth: Email/Password enabled
- [ ] Firebase authorized domains include production URL
- [ ] Firestore indexes created
- [ ] Firestore security rules deny direct client access
- [ ] First admin bootstrapped
- [ ] `ADMIN_BOOTSTRAP_SECRET` removed or rotated
- [ ] AWS SES **domain** verified with DKIM + SPF
- [ ] Custom MAIL FROM domain configured
- [ ] DMARC record added
- [ ] SES out of sandbox
- [ ] Test send shows `john@mydomain.com` as From (not noreply)
- [ ] `ALLOWED_EMAIL_DOMAIN` set to your domain
- [ ] `CRON_SECRET` set; cron job running every minute
- [ ] HTTPS enabled (required for FCM)
- [ ] Test: admin login, create user, user login, send email, schedule email
- [ ] Service account JSON **not** committed to Git

---

## API reference (quick)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/auth/me` | User | Verify provisioned session |
| POST | `/api/admin/bootstrap` | Bootstrap secret | Create first admin |
| GET/POST | `/api/admin/users` | Admin | List / create users |
| PATCH/DELETE | `/api/admin/users/[uid]` | Admin | Update / delete user |
| GET/POST | `/api/emails` | User | List / send emails |
| GET/PATCH/DELETE | `/api/emails/[id]` | User | Email detail / update / delete |
| POST | `/api/emails/draft` | User | Save draft |
| GET/POST | `/api/contacts` | User | Contacts CRUD |
| GET/POST | `/api/calendar` | User | Calendar events |
| GET/POST | `/api/schedule/process` | Cron secret | Process scheduled emails |
| POST | `/api/notifications/token` | User | Save FCM token |

---

## Support

For project structure and feature overview, see [README.md](../README.md).
