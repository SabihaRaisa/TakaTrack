# TakaTrack — Next.js + Supabase

A rebuilt personal-finance tracker using Next.js, TypeScript, Supabase Auth, PostgreSQL and row-level security. It replaces the original single HTML file and `localStorage`-based custom authentication.

## Included in this starter

- Supabase email/password sign-up and sign-in
- User-owned transaction records with date, type, category, payment method and note
- Monthly dashboard: income, expenses, net cash flow and category spending
- Six-month income/expense chart
- Transaction search and CSV export
- Monthly category budgets with progress and near/over-budget states
- Savings goals and contributions
- Rule-based spending insights and a transparent simple month-end estimate
- Responsive layout and validation for common input mistakes
- PostgreSQL constraints and Row Level Security (RLS)

## Not included yet

This is a practical first version, not a finished banking product. It does not include recurring transactions/reminders, transaction editing, a true AI/LLM assistant, natural-language entry, automatic bank sync, or a full audit/history log. The insights are rule-based. The forecast extrapolates the month-to-date daily average and is only an estimate.

## 1. Install

Install Node.js 20.9 or newer. Extract the ZIP, open the `takatrack-nextjs` folder in VS Code, then run:

```bash
npm install
```

## 2. Create Supabase project

1. Create a project in Supabase.
2. Open **SQL Editor** in your Supabase dashboard.
3. Copy and run the full `supabase/schema.sql` file.
4. In **Project Settings → API**, copy the Project URL and the public anon/publishable key.

Do not use a `service_role` key in the browser.

## 3. Environment variables

Copy `.env.example` to `.env.local` and replace the placeholders:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

Restart the dev server after editing `.env.local`.

## 4. Configure authentication

In Supabase → **Authentication → URL Configuration**, set your local Site URL to `http://localhost:3000`. For deployment, add your Vercel URL to the allowed redirect URLs. If email confirmation is enabled, sign-up will ask users to confirm their email before signing in.

## 5. Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## 6. Deploy to Vercel

1. Push the extracted project to a GitHub repository.
2. Import that repository in Vercel.
3. Add the same two environment variables in Vercel Project Settings → Environment Variables.
4. Deploy.
5. Add the deployed Vercel URL to Supabase Auth's Site URL / redirect allow list.
6. Run `npm run build` locally before relying on a deployment.

## Important security notes

- Authentication is handled by Supabase Auth, not a custom password hash.
- All database tables have RLS policies that restrict each query to rows whose `user_id` matches the signed-in user.
- Never disable RLS or expose a service-role key.
- This code is a starter implementation and has not been independently security-audited. Test with two separate accounts to confirm they cannot read or change one another's data.
- Do not enter bank login details, card numbers, or other secrets into transaction notes.
