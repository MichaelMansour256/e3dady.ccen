# E3dady Youth Meeting

### Faith • Friendship • Growth

A modern, mobile-first Progressive Web App for the **E3dady Youth Meeting** at **Christ Church – Ezbet El Nakhl (كنيسة المسيح – عزبة النخل)**.

The platform brings together weekly meeting information, Bible content, games, event photos, prayer requests, push notifications, and administrative tools in one centralized experience.

**Live Website:** https://e3dady-ccen.vercel.app/

---

## ✨ Overview

**E3dady Youth Meeting** is designed as a digital hub for the youth meeting, providing members with an engaging and accessible way to stay connected with the meeting throughout the week.

The application supports both **Arabic and English**, with a fully responsive **RTL/LTR interface** and a mobile-first design optimized for use as a Progressive Web App.

The platform includes:

- 📅 Weekly and special events
- 📖 Bible verses and resources
- 🎮 Bible-based games
- 🖼️ Event photo galleries
- 🙏 Community prayer wall
- 🔔 Push notifications
- 👥 Servants directory
- ℹ️ Meeting information and contact details
- 🔐 Administrative dashboard

---

## 🚀 Features

### 🏠 Home

The home page provides a central entry point to the meeting platform.

- Animated hero section
- Meeting branding and logo
- Quick-access navigation
- Social media links
- Mobile-first navigation
- Arabic and English support

---

### 📅 Events

Keep track of upcoming meetings and special activities.

#### Weekly Meeting

The application provides a live countdown to the next regular meeting.

#### Event Calendar

A horizontally scrollable date strip highlights:

- Fridays
- Upcoming meeting dates
- Special events
- Past events

Administrators can create and manage special events with Arabic and English titles, dates, and times.

---

### 📖 Bible

The Bible section provides weekly spiritual content and resources.

#### Verse of the Week

Administrators can select a weekly Bible verse by:

- Book
- Chapter
- Verse

An optional servant note can also be added.

The application retrieves the Arabic verse text dynamically using the **Smith & Van Dyke** translation through the GetBible API.

#### Studies & Resources

The application architecture also provides dedicated sections for Bible studies and additional resources.

---

### 🎮 Games

The platform integrates **Verse Up Arena**, a collection of Bible-themed games designed to make Scripture learning more interactive and engaging.

The game platform is embedded directly into the website and provides a dedicated full-screen experience.

**Verse Up Arena:** https://verse-up-arena.vercel.app/

---

### 🖼️ Gallery

The gallery organizes meeting photography by event.

Features include:

- Event-based photo organization
- Cloudinary-powered image storage
- Drag-and-drop administration uploads
- Event filtering
- Responsive photo grid
- Full-screen slideshow
- Swipe gestures
- Keyboard navigation
- Auto-play
- Thumbnail navigation

---

### 🙏 Prayer Wall

The Prayer Wall allows members to share prayer requests with the community.

Users can submit requests:

- Anonymously
- With their name

Prayer requests are placed into a moderation queue before appearing publicly.

Community members can also use the **pray counter** to indicate that they are praying for a request.

The Prayer Wall uses Supabase for data storage and real-time functionality.

---

### 🔔 Push Notifications

The platform uses **OneSignal** to deliver web push notifications.

Administrators can send notifications directly from the admin dashboard.

Each notification can include:

- Title
- Message
- Destination URL
- Optional image

Supported destination shortcuts include:

- 🏠 Home
- 📅 Events
- ✨ Verse
- 🔗 Custom URL

The system also records notification metadata and delivery information in Supabase for administrative history and auditing.

---

### 🔐 Admin Dashboard

The `/admin` dashboard provides centralized management for the platform.

Access is protected using an environment-configured administrator password.

| Section | Capabilities |
|---|---|
| 🖼️ Gallery | Create event folders, upload photos, delete photos |
| 📅 Events | Create and delete special events |
| ✨ Verse | Manage the Verse of the Week |
| 🔔 Notify | Send push notifications |
| 📜 History | View notification history and recipient counts |
| 🙏 Prayer | Approve, reject, and delete prayer requests |

---

## 🌍 Internationalization

The application supports both:

- 🇪🇬 Arabic
- 🇬🇧 English

The interface automatically supports the appropriate text direction:

- **RTL** for Arabic
- **LTR** for English

Internationalization is implemented using [`next-intl`](https://next-intl-docs.vercel.app/).

Translation resources are maintained in:

```text
messages/
├── ar.json
└── en.json
```

---

## 📱 Progressive Web App

E3dady is built as a **Progressive Web App (PWA)**, allowing users to access the meeting platform like a native application.

The project includes:

- Web App Manifest
- PWA icons
- Mobile-optimized layouts
- Installable experience
- Push notification support
- Responsive navigation

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 |
| Architecture | App Router |
| Language | TypeScript |
| UI | React 19 |
| Styling | Tailwind CSS 4 |
| Internationalization | next-intl |
| PWA | next-pwa |
| Database | Supabase / PostgreSQL |
| Image Storage | Cloudinary |
| Push Notifications | OneSignal |
| Deployment | Vercel |

The project dependencies include Next.js, React, TypeScript, Tailwind CSS, Supabase, Cloudinary, `next-intl`, `next-pwa`, and `react-dropzone`.

---

## 🏗️ Project Structure

```text
e3dady.ccen/
│
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── page.tsx
│   │   │   ├── events/
│   │   │   ├── bible/
│   │   │   ├── games/
│   │   │   └── more/
│   │   │       ├── about/
│   │   │       ├── gallery/
│   │   │       ├── servants/
│   │   │       ├── prayer-wall/
│   │   │       └── contact/
│   │   │
│   │   ├── admin/
│   │   │
│   │   ├── api/
│   │   │   ├── gallery/
│   │   │   ├── events/
│   │   │   ├── verse/
│   │   │   ├── prayer/
│   │   │   └── admin/
│   │   │
│   │   └── globals.css
│   │
│   ├── components/
│   ├── hooks/
│   ├── i18n/
│   ├── lib/
│   └── proxy.ts
│
├── messages/
│   ├── ar.json
│   └── en.json
│
├── public/
│   ├── logo.png
│   ├── verse-up-logo.png
│   ├── manifest.json
│   ├── appstore-images/
│   └── servants images/
│
├── scripts/
├── supabase-notifications-history.sql
├── next.config.ts
├── tailwind.config.*
├── tsconfig.json
├── vercel.json
└── package.json
```

The repository currently separates localized user-facing pages from the administrative interface and API routes, with shared components and service utilities under `src`.

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have:

- Node.js
- npm
- A Supabase project
- A Cloudinary account
- A OneSignal application

---

### 1. Clone the Repository

```bash
git clone https://github.com/MichaelMansour256/e3dady.ccen.git
cd e3dady.ccen
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_ONESIGNAL_APP_ID=
ONESIGNAL_API_KEY=

ADMIN_PASSWORD=
```

### Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API access |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public API key |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | OneSignal application ID |
| `ONESIGNAL_API_KEY` | OneSignal REST API key |
| `ADMIN_PASSWORD` | Admin dashboard password |

> **Security:** Never commit `.env.local` or expose private API keys such as `CLOUDINARY_API_SECRET` or `ONESIGNAL_API_KEY`.

---

### 4. Configure Supabase

The project uses Supabase for persistent application data.

The main database features include:

- Prayer requests
- Notification history
- Moderation status
- Prayer counters
- Notification metadata

The repository includes:

```text
supabase-notifications-history.sql
```

for configuring the notification history table.

Make sure Row Level Security policies are configured appropriately for your deployment.

---

### 5. Run the Development Server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## 🧪 Available Scripts

```bash
npm run dev
```

Starts the Next.js development server.

```bash
npm run build
```

Creates a production build.

```bash
npm run start
```

Starts the production server.

```bash
npm run lint
```

Runs ESLint.

These scripts are defined in the project's `package.json`.

---

## ☁️ Deployment

The application is deployed using **Vercel**.

Production deployments are connected to the repository's `main` branch.

To deploy successfully, make sure all required environment variables are configured in:

**Vercel → Project Settings → Environment Variables**

The application is currently available at:

https://e3dady-ccen.vercel.app/

---

## 🔒 Security

The application contains several server-side integrations and therefore requires careful handling of secrets.

### Never expose:

```text
CLOUDINARY_API_SECRET
ONESIGNAL_API_KEY
ADMIN_PASSWORD
```

Public client-side configuration may include:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_ONESIGNAL_APP_ID
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```

Supabase Row Level Security should remain enabled for tables containing user-generated content or administrative data.

---

## 🎨 Design Philosophy

The platform is built around three central values:

### Faith

Encouraging young people to grow in their relationship with God and engage with Scripture.

### Friendship

Creating a digital space that strengthens community and connection within the meeting.

### Growth

Providing resources, activities, games, and opportunities that encourage spiritual and personal growth.

> **إيمان • أصحاب • نمو**

---

## 🤝 Contributing

This project is primarily developed for the E3dady Youth Meeting.

For significant changes:

1. Create a feature branch.
2. Make your changes.
3. Run linting and build checks.
4. Test the application locally.
5. Open a pull request for review.

Please avoid committing secrets, generated files, or production credentials.

---

## 📄 License

This project is maintained for the E3dady Youth Meeting at Christ Church – Ezbet El Nakhl.

Unless otherwise specified, the source code and original assets are not intended for redistribution or commercial use without permission from the project maintainers.

---

## 🙏 Acknowledgements

This project makes use of several open-source and third-party services:

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [next-intl](https://next-intl-docs.vercel.app/)
- [Supabase](https://supabase.com/)
- [Cloudinary](https://cloudinary.com/)
- [OneSignal](https://onesignal.com/)
- [Vercel](https://vercel.com/)
- [GetBible API](https://api.getbible.net/)

---

## 📬 Contact

For questions, suggestions, or information about the E3dady Youth Meeting, use the contact and social links available on the website.

**E3dady Youth Meeting**  
Christ Church – Ezbet El Nakhl

**Faith • Friendship • Growth**