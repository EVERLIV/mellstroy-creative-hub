# RhinoFit Firebase backend

Project: **rihnofit** (Blaze)

## Stack

- **Auth** — Firebase Authentication (email/password, Google, Facebook)
- **Data** — Cloud Firestore (live; local mock store removed)
- **Storage** — Firebase Storage (avatars / media)
- App still uses a Supabase-shaped client API that talks to Firestore

## Seed real users + marketplace data

```bash
gcloud auth login
gcloud config set project rihnofit
node scripts/seed-firestore.mjs
firebase deploy --only firestore:rules
```

Seeded password for all demo accounts: `RhinoFit123!`

| Role    | Email             |
|---------|-------------------|
| student | alex@rhinofit.app |
| student | mai@rhinofit.app  |
| student | jordan@rhinofit.app |
| student | priya@rhinofit.app |
| trainer | minh@rhinofit.app |
| trainer | linh@rhinofit.app |
| trainer | kai@rhinofit.app  |

## Local run

```bash
npm run build:student
npm run preview -- --host 127.0.0.1 --port 4173
# or
npm run dev
```

Hard-refresh after seeding. Old `localStorage` mock keys are cleared automatically.
