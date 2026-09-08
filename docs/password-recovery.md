# Password recovery

Production Supabase project: `qinfkexssodtwxuspkku`.

Required Dashboard settings (not a database migration):

- Authentication / URL Configuration / Site URL: `https://www.sportcaremed.com` (no trailing slash).
- Exact allowed redirects: `https://www.sportcaremed.com/sr/nalog/nova-lozinka` and `https://www.sportcaremed.com/en/account/new-password`.
- Authentication / Emails / Reset password: use `supabase/templates/recovery.html`.
- Subject: `Nova lozinka | Sport Care & Med`.

The recovery template deliberately uses the canonical Site URL and Serbian path,
including for Dashboard-generated emails. The English page is also available.
The token is in the fragment so it is not sent to Next.js or in referrers. The page
removes it from browser history and verifies it only after the user clicks Continue,
not on a GET/email scanner visit. It uses Supabase `verifyOtp(type: recovery)` and
`updateUser`, never the service-role key. Recovery works without the requesting
browser's PKCE cookie. The recovery client is memory-only, separate from existing
site logins; refreshing the page requires requesting a new link.

The password entry and final confirmation must be performed by the account owner.
No admin/rehab permissions or patient data are changed by recovery.

Checks: `node --experimental-strip-types --test tests/password-recovery.test.mjs`,
`npm run test:rehab`, `npm run build`, then live checks of both localized routes,
missing/invalid tokens, the email template/redirect configuration, and owner-assisted
valid-link/password/login verification. Do not put real recovery URLs in logs or docs.

References: https://supabase.com/docs/reference/javascript/auth-verifyotp and
https://supabase.com/docs/guides/auth/auth-email-templates.
