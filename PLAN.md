# Lead Capture: Problem-description field + PDF attachment via Resend

## Context
The "Free PDF protocol for your injury" popup ([LeadCapturePopup.tsx](src/components/sections/LeadCapturePopup.tsx)) currently collects name, email, body part and triggers an email with a **link** to `/public/protocols/{slug}.pdf` (see [sendProtocolEmail in src/lib/email.ts:292-326](src/lib/email.ts#L292-L326)).

Two changes:
1. Add an **optional** "describe your problem" textarea so the team gets context on what the lead is dealing with.
2. When the lead submits, **attach the matching PDF** to the email instead of linking to it. The user has multiple PDFs ready to drop into `/public/protocols/` named per the existing body-part slugs.

Resend is already integrated via raw HTTP (`https://api.resend.com/emails`) in [sendEmail at src/lib/email.ts:18-49](src/lib/email.ts#L18-L49). Resend's JSON API supports an `attachments: [{ filename, content }]` array with base64-encoded content — that's the path we'll use (no new SDK needed).

---

## Files to change

### 1. [src/components/sections/LeadCapturePopup.tsx](src/components/sections/LeadCapturePopup.tsx)
- Add `problemDescription` state (default `""`).
- Render a `<textarea>` between the body-part `<select>` (line 183) and the submit button (line 184). Mirror the existing input styling. Mark as optional (no `required` attribute). 3–4 rows.
- Use new translation key `t("problemDescription")` for the label and `t("problemDescriptionPlaceholder")` for the placeholder.
- Add `problemDescription` to the POST body at line 38 alongside `bodyPart`.
- Reset `problemDescription` to `""` in the success branch (lines 52-55).

### 2. [src/app/api/contact/route.ts](src/app/api/contact/route.ts)
- Extend Zod schema (lines 16-33): add `problemDescription: z.string().max(2000).optional()`.
- When `source === "lead-capture-popup"` or `"exit-intent"` and `problemDescription` is non-empty, **append it to the lead `message`** so it's persisted in Supabase alongside the existing auto-generated line, e.g.:
  ```
  Zahtev za besplatan PDF protokol — {label}

  Opis: {problemDescription}
  ```
  Build that on the server (line 67-ish) rather than trusting the client message verbatim.
- Pass `problemDescription` through to `sendProtocolEmail()` (line 84-89) so the email body can echo it back to the lead ("Vi ste nam rekli: …") — useful as a soft confirmation.

### 3. [src/lib/email.ts](src/lib/email.ts) — the main change
- Extend `SendArgs` (lines 1-6) with optional `attachments?: Array<{ filename: string; content: string /* base64 */ }>`.
- In `sendEmail()` (lines 18-49), forward `attachments` to the Resend payload (line 32-38). Resend expects exactly `{ filename, content }` where `content` is base64.
- Extend `sendProtocolEmail()` (lines 292-326):
  - Add `problemDescription?: string` to the args.
  - **Read the PDF from disk** before sending:
    ```ts
    import { readFile } from "node:fs/promises";
    import { join } from "node:path";
    const pdfPath = join(process.cwd(), "public", "protocols", `${args.bodyPart}.pdf`);
    let pdfBase64: string | undefined;
    try {
      const buf = await readFile(pdfPath);
      pdfBase64 = buf.toString("base64");
    } catch (err) {
      console.error("[email] PDF not found, falling back to link:", pdfPath, err);
    }
    ```
  - If `pdfBase64` is present, pass `attachments: [{ filename: `${args.bodyPart}.pdf`, content: pdfBase64 }]` to `sendEmail()`. Otherwise gracefully fall back to the current link-in-button behavior (so a missing file doesn't break the flow).
  - Adjust the email copy slightly: the CTA button is no longer needed when attached; instead say "PDF se nalazi u prilogu / The PDF is attached." Keep the link as a backup line in case the attachment fails.
  - If `problemDescription` is provided, render an italicized blockquote echoing it back to the user (Serbian: "Naveli ste:" / English: "You told us:").
- Confirm the function still never throws (catch-all already in place at lines 322-325).

### 4. [messages/sr.json](messages/sr.json) and [messages/en.json](messages/en.json)
Under `leadCapture` (line 330):
- **sr**: `"problemDescription": "Opišite problem (opciono)"`, `"problemDescriptionPlaceholder": "Kratko opišite šta vas muči, kada se javlja, koliko traje..."`
- **en**: `"problemDescription": "Describe your problem (optional)"`, `"problemDescriptionPlaceholder": "Briefly describe what's bothering you, when it happens, how long it's lasted..."`

---

## Reuse / not adding
- **No new email-sending library** — extend the existing raw-`fetch` Resend integration. Resend's REST API already accepts `attachments`.
- **No new validation library** — reuse existing Zod schema.
- **No change to [createLead](src/lib/leads.ts)** — the new info rides on the existing `message` field.

---

## What the user must do (outside code)
- Drop the six PDFs into `/public/protocols/` with these exact names:
  - `skocni-zglob.pdf`, `zglob-kolena.pdf`, `kicmeni-stub.pdf`, `zglob-ramena.pdf`, `misici-zadnje-loze.pdf`, `ostalo.pdf`
- Make sure `RESEND_API_KEY` and `EMAIL_FROM` are set in the deploy environment (Vercel etc.) — they're already wired in [email.ts:19-23](src/lib/email.ts#L19-L23).

---

## Verification (end-to-end)
1. `npm run dev` and open the site; click the floating "Free PDF protocol" CTA.
2. Confirm the new optional textarea appears beneath the body-part dropdown and the form still submits without it.
3. Submit with a real email + a body part you've placed a PDF for. Confirm:
   - Browser network tab: POST `/api/contact` returns `{ success: true }`.
   - Supabase `leads` row exists, with the problem description appended to `message`.
   - Inbox: receive the protocol email with the correct PDF attached (filename = `{slug}.pdf`).
4. Submit with a body part whose PDF is **missing** from `/public/protocols/`. Confirm:
   - Server logs the "PDF not found" warning.
   - Email still sends with the link-fallback CTA so the lead isn't left empty-handed.
5. Submit with the honeypot triggered (set hidden `website` input via devtools) and confirm no email is sent and the response still 200s (existing behavior at [route.ts:55-58](src/app/api/contact/route.ts#L55-L58)).
6. Toggle locale (`/en` vs `/sr`) and confirm both the label/placeholder and the email copy localize correctly.
