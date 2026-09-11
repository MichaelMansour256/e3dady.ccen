# E3dady Youth Meeting — إجتماع شباب إعدادي

> Christ Church – Ezbet El Nakhl · كنيسة المسيح – عزبة النخل

A mobile-first PWA built with **Next.js 16**, **TypeScript**, **Tailwind CSS**, with full Arabic/English support and RTL layout.

🌐 **Live:** [e3dady-ccen.vercel.app](https://e3dady-ccen.vercel.app)

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| i18n | next-intl (Arabic + English, RTL/LTR) |
| PWA | next-pwa |
| Images | Cloudinary |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |

---

## Features

### 🏠 Home
- Animated hero with circle logo and glow effects
- Quick navigation grid
- Social media links (Facebook, Instagram, TikTok, YouTube, Linktree)

### 📅 Events
- Weekly meeting card with live countdown to next Friday 12:30 PM
- 14-day horizontal date strip with Friday highlights and special event dots
- Special events (upcoming + past) managed by admin

### 📖 Bible
- **Verse of the Week** — fetches live Arabic text from [api.getbible.net](https://api.getbible.net) (Smith & Van Dyke translation), set weekly by admin with optional servant note
- Studies & Resources pages (placeholder)

### 🎮 Games
- **Verse Up Arena** — embedded full-screen iframe ([verse-up-arena.vercel.app](https://verse-up-arena.vercel.app))

### 🖼️ Gallery
- Photos grouped by event (Cloudinary folders)
- Filter by event or view all
- 3-column grid with fullscreen slideshow
- Slideshow: swipe gestures, keyboard navigation, auto-play, thumbnail strip

### 🙏 Prayer Wall
- Submit prayer requests (anonymous or named)
- Requests go to **pending** until admin approves
- 🙏 pray counter per request (once per device)
- Real-time via Supabase

### ℹ️ More
- **About Us** — mission and three pillars (إيمان، أصحاب، نمو)
- **Servants** — photo grid of all servants
- **Contact** — social links and church info
- **Prayer Wall** (see above)

---

## Admin Dashboard (`/admin`)

Password protected via `ADMIN_PASSWORD` env variable.

| Tab | Features |
|-----|----------|
| 🖼️ Gallery | Create event folders, drag & drop upload, delete photos |
| 📅 Events | Add/delete special events (Arabic + English, date/time) |
| ✨ Verse | Set verse of the week (book/chapter/verse + optional note) |
| 🙏 Prayer | Approve / Reject / Delete prayer requests with pending badge count |

---

## Environment Variables

Add to `.env.local` for local dev and to Vercel dashboard for production:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

ADMIN_PASSWORD=
```

---

## Supabase Setup

Run in Supabase SQL Editor:

```sql
create table prayer_requests (
  id uuid default gen_random_uuid() primary key,
  name text default 'مجهول',
  request text not null,
  pray_count integer default 0,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

alter table prayer_requests enable row level security;

create policy "Anyone can read approved" on prayer_requests
  for select using (status = 'approved');

create policy "Anyone can insert" on prayer_requests
  for insert with check (true);

create policy "Anyone can update pray_count" on prayer_requests
  for update using (status = 'approved')
  with check (status = 'approved');
```

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/           # All user-facing pages (ar/en)
│   │   ├── page.tsx        # Home
│   │   ├── events/
│   │   ├── bible/          # verse, studies, resources
│   │   ├── games/
│   │   └── more/           # about, gallery, servants, prayer-wall, contact
│   ├── admin/              # Admin dashboard (no locale)
│   ├── api/
│   │   ├── gallery/
│   │   ├── events/
│   │   ├── verse/
│   │   ├── prayer/
│   │   └── admin/          # auth, folder, upload, delete, events, verse, prayer
│   └── globals.css
├── components/
│   ├── BottomNav.tsx
│   ├── PageHeader.tsx
│   ├── WeeklyMeetingCard.tsx
│   ├── Slideshow.tsx
│   ├── SocialLinks.tsx
│   └── ComingSoon.tsx
├── hooks/
│   └── useNextMeeting.ts
├── i18n/
│   ├── routing.ts
│   └── request.ts
├── lib/
│   ├── cloudinary.ts
│   ├── supabase.ts
│   ├── auth.ts
│   ├── events.ts
│   ├── verse.ts
│   └── bibleBooks.ts
└── proxy.ts                # next-intl locale middleware
messages/
├── ar.json
└── en.json
public/
├── logo.png
├── verse-up-logo.png
├── manifest.json
├── appstore-images/        # PWA icons (android, ios, windows)
└── servants images/        # Servant photos
```

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

Deployed on Vercel. Push to `main` triggers auto-deploy.

Make sure all environment variables are set in the Vercel dashboard under **Settings → Environment Variables**.
