# Free PDF protocols

These PDFs are emailed to leads who request a free protocol from the
Lead Capture popup. The link in the email points to
`/protocols/{bodyPart}.pdf` on the production site.

Drop the following files in this directory (replace placeholders with the
real protocol PDFs):

- `skocni-zglob.pdf` — Skočni zglob / Ankle
- `zglob-kolena.pdf` — Zglob kolena / Knee
- `kicmeni-stub.pdf` — Kičmeni stub / Spine
- `zglob-ramena.pdf` — Zglob ramena / Shoulder
- `misici-zadnje-loze.pdf` — Mišići zadnje lože / Hamstrings
- `ostalo.pdf` — Generic / Ostalo

File names must match the slugs above exactly — they are used by
`getProtocolPdfUrl()` in `src/lib/email.ts` and by the form in
`src/components/sections/LeadCapturePopup.tsx`.
