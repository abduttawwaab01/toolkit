# ToolKit — Free-Forever Architecture Plan

## Free Stack (All have generous free tiers)

| Service | Why | Free Tier |
|---------|-----|-----------|
| **Vercel** | Deploy frontend + API routes | 100GB bandwidth, 100hrs build/mo |
| **Neon** | Serverless PostgreSQL | 500MB DB, 100hr compute/mo |
| **Upstash** | Redis for rate limiting + cache | 100MB, 10k commands/day |
| **Cloudflare R2** | File storage, S3-compatible | 10GB storage, free egress |
| **Auth.js** | Auth with 70+ providers | Free, open source |
| **Inngest** | Background job queues | 100k steps/mo free |
| **FFmpeg WASM** | Browser-side video processing | Free, runs on client |
| **GitHub Actions** | CI/CD | 2000 min/mo free |
| **OpenAI API** | AI features | $5 free credits |
| **Replicate** | ML models API | Free tier with rate limits |

## Architecture (Zero Servers)

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Edge Network)                      │
│                                                              │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │  Next.js Frontend    │  │  Next.js API Routes          │  │
│  │  (Edge + SSR)        │  │  (Serverless Functions)      │  │
│  │                      │  │  /api/auth/*                 │  │
│  │  - Landing Page      │  │  /api/media/*               │  │
│  │  - Editor Workspace  │  │  /api/ai/*                   │  │
│  │  - Admin Dashboard   │  │  /api/admin/*               │  │
│  └─────────────────────┘  │  /api/webhooks/*             │  │
│                           └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           │                        │              │
     ┌─────▼──────┐        ┌───────▼───────┐     ┌▼──────────┐
     │   Neon DB   │        │  Upstash      │     │ R2 Object │
     │ (Postgres)  │        │  Redis        │     │  Storage  │
     │  - Users    │        │  - Sessions   │     │  - Videos │
     │  - Projects │        │  - Rate limits│     │  - Audio  │
     │  - Files    │        │  - Queue msgs │     │  - Images │
     │  - Credits  │        │  - Cache      │     │  - Exports│
     └─────────────┘        └───────────────┘     └───────────┘
                                     │
                              ┌──────▼──────┐
                              │   Inngest    │
                              │  Background  │
                              │  Jobs        │
                              │  - AI tasks  │
                              │  - Cleanup   │
                              │  - Exports   │
                              └─────────────┘
```

## Why This Stack for Your Prompt Requirements

| Requirement | How We Solve It |
|-------------|----------------|
| **Mobile-first** | Next.js with responsive Tailwind, touch gestures |
| **Amazing animations** | Framer Motion + Three.js + GSAP (all client-side) |
| **Storage not overused** | Auto-delete scheduler via Inngest cron + R2 lifecycle policies |
| **Admin file timer** | Per-role TTL in Neon DB, configurable from admin dashboard |
| **Backend not overused** | Upstash rate limiting + AI credit system + Inngest backpressure |
| **Free forever** | All services have generous free tiers, no server costs |

## Project Structure (Monorepo, single Vercel deploy)

```
toolkit/
├── src/
│   ├── app/                    # Next.js App Router pages + API
│   │   ├── page.tsx            # Landing page
│   │   ├── api/                # API routes (replaces NestJS)
│   │   │   ├── auth/           # Auth.js endpoints
│   │   │   ├── media/          # Upload/download
│   │   │   ├── ai/             # AI feature endpoints
│   │   │   └── admin/          # Admin dashboard API
│   │   ├── editor/             # Editor page
│   │   ├── admin/              # Admin dashboard page
│   │   └── auth/               # Login/signup pages
│   ├── components/
│   │   ├── ui/                 # Reusable primitives
│   │   ├── landing/            # Landing page sections
│   │   ├── editor/             # Editor components
│   │   └── admin/              # Admin dashboard components
│   ├── lib/                    # Shared utilities
│   │   ├── db.ts               # Neon DB client
│   │   ├── redis.ts            # Upstash Redis client
│   │   ├── r2.ts               # Cloudflare R2 client
│   │   ├── ai-router.ts        # AI provider abstraction
│   │   └── rate-limit.ts       # Rate limiting
│   ├── inngest/                # Background job definitions
│   └── types/                  # TypeScript types
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
├── vercel.json                 # Vercel config (cron jobs)
└── package.json                # Dependencies
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Next.js 15 + App Router setup
- Neon DB + Prisma schema
- Auth.js (Google, GitHub, email)
- Deploy to Vercel
- Upstash Redis integration

### Phase 2: Landing Page (Week 1-2) ← Mostly done
- Hero with Three.js particles
- Interactive feature showcase
- Pricing, FAQ, CTA
- Admin dashboard UI

### Phase 3: Storage & Auto-Delete (Week 2)
- Cloudflare R2 file upload
- Inngest cron for auto-delete
- Admin TTL configuration
- Storage usage tracking

### Phase 4: Rate Limiting & Backend Protection (Week 2-3)
- Upstash rate limiter
- AI credit system
- Per-role quotas
- Queue backpressure via Inngest

### Phase 5: Core Editor (Week 3-5)
- FFmpeg WASM integration
- Timeline component
- Drag & drop layers
- Video preview player
- Audio waveform
- Undo/redo system

### Phase 6: AI Pipeline (Week 5-7)
- Connect AI providers via abstraction layer
- Background processing via Inngest
- AI Co-Pilot chat
- One-click enhancement

### Phase 7: Export & Polish (Week 7-8)
- Multi-format export
- PWA support
- Performance optimization
- Testing