# DECISIONS — sport care

Status: quiet. Solo dev — direct pushes to main authorized. Written 2026-07-07.

1. **Resend is called via raw HTTP** (`src/lib/email.ts`, `https://api.resend.com/emails`) — deliberately no SDK. Keep new email features on the same path; attachments use Resend's JSON `attachments: [{ filename, content }]` with base64 content.
2. **Injury protocols are static PDFs in `public/protocols/` named by body-part slug** — the lead-capture popup maps its body-part select straight to a filename. New protocols = drop a correctly-named PDF, no code change.
3. Current planned change lives in `PLAN.md`: optional problem-description textarea + attach the PDF to the email instead of linking it.
4. Supabase for data, Next.js 16 App Router, `npm run build` is the verify gate.
