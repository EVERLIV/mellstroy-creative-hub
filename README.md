<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1rr8EF1YcMoJgaSzLh6RBpPJ1ROWW6z_t

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` / Supabase keys in `.env` (or `.env.local`)
3. Run a frontend:
   - Students (port **8080**): `npm run dev` or `npm run dev:student`
   - Trainers (port **8081**): `npm run dev:trainer`
4. Build both: `npm run build` → `dist/student` and `dist/trainer`

### Admin preview

Promote an account with `scripts/make_hoaandrey_admin.sql` in the Supabase SQL editor. Admins get a Student / Trainer / Admin switcher in the shell to preview each experience.
