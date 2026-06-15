# MailBox vs Gmail — Feature Parity

Honest comparison after the professional upgrade pass.

## Gmail-like (implemented)

| Feature | Gmail | MailBox |
|---------|-------|---------|
| Inbox / Sent / Drafts / Starred / Trash | Yes | Yes |
| Archive | Yes | Yes (`/mail/archive`) |
| Compose To/Cc/Bcc | Yes | Yes |
| Schedule send | Yes | Yes |
| Reply | Yes | Yes (quoted body, subject `Re:`) |
| Reply all | Yes | Yes |
| Forward | Yes | Yes (`Fwd:` + forwarded block) |
| Draft edit | Yes | Yes (click draft → compose) |
| Conversation threading | Yes | Yes (grouped by `threadId`, count badge) |
| Star / delete | Yes | Yes |
| Search | Yes | Yes (server search via header) |
| Load more | Yes | Yes (pagination cursor) |
| Unread counts | Yes | Yes (sidebar badges) |
| Email signature | Yes | Yes (`/settings`) |
| Contacts | Yes | Yes |
| Calendar | Yes | Basic month view |
| Push notifications | Yes | Yes (FCM) |
| Per-user From address | Yes | Yes (`john@mycompany.com`) |
| Receive external mail | Yes | Yes (SES inbound → inbox) |
| Attachments (send/receive) | Yes | Yes (up to 5 files, 5 MB each) |
| HTML sanitization | Yes | Yes (DOMPurify) |
| Admin-created accounts | Workspace | Yes |

## Still not Gmail (gaps)

| Feature | Status |
|---------|--------|
| Rich text editor (bold, links, images) | Plain textarea |
| Custom labels | Schema only, no UI |
| Spam folder / filters | Not yet |
| Snooze | Not yet |
| Undo send | Not yet |
| Keyboard shortcuts (`c`, `r`, `/`) | Not yet |
| Bulk select actions | Not yet |
| Multiple inboxes / aliases | Not yet |
| Calendar week/day/agenda | Not yet |
| Recurring events | Not yet |
| Meet / video | Not yet |
| Dark mode | Not yet |
| Offline mode | Not yet |
| Mobile swipe actions | Not yet |

## What changed in the professional upgrade

1. **Reply / Reply all / Forward** — fully wired with quoted content
2. **Threading** — messages grouped; `In-Reply-To` / `References` on send
3. **Archive** — real archive folder (was mislabeled read toggle)
4. **Drafts** — open in compose editor, not read-only view
5. **Search** — server-side across subject, from, body, to
6. **Pagination** — Load more (50 per page)
7. **Settings** — signature + default reply behavior
8. **Unread badges** — inbox, drafts, scheduled counts
9. **Sidebar** — "Folders" not "Labels"; Archive added
10. **Contacts** — Send mail prefills recipient
11. **Security** — sanitized HTML when reading mail
12. **Scheduled sends** — now deliver to internal inboxes too

## Verdict

MailBox now covers **core professional email workflows** similar to Gmail for daily use: read, reply, forward, archive, search, schedule, threading, signatures, and inbound/outbound on your domain.

It is **not** a full Gmail clone. Rich compose, labels, spam, and advanced calendar remain the biggest gaps for full parity.
