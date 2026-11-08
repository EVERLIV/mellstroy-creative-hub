# RhinoFit Firebase backend

Project: **rihnofit**

## What’s included

- Auth (email / Google / Facebook) via Firebase Auth
- Local **mock store** (seeded trainers, classes, venues, waitlist, bookings, packages, notifications) so you can test without Console setup
- Optional sync to Cloud Firestore (`Sync` on the floating Dev panel)
- Cloud Functions stubs: `createBookingPayment`, `marketplaceLifecycle`
- Old `supabase` imports are shimmed to the Firebase mock client

## Quick test

1. `npm run dev`
2. Auth screen → **Demo student** or **Demo trainer**
3. Or use the floating **Firebase mock backend** panel (bottom-right)

### Student checklist

- Explore coaches / classes (seed data)
- Open Boxing Conditioning (full) → Join waitlist
- Bookings → Waitlist tab
- Notifications bell

### Trainer checklist

- Demo trainer → Bookings → Waitlist
- See Alex waiting → Notify spot / Message

## Deploy rules / functions

```bash
firebase login
firebase use rihnofit
firebase deploy --only firestore:rules
cd functions && npm i && npm run build && cd ..
firebase deploy --only functions
```

## Env

Copy `.env.example` → `.env.local` (already filled with the web app config).
