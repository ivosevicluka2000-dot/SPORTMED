# Free PDF protocols

These PDFs are emailed to leads who request a free protocol from the
lead capture popup or contact form. The link in the email points to
`/protocols/{bodyPart}.pdf` on the production site.

The protocol files in this directory must use the app's body-part slugs:

- `skocni-zglob.pdf` — Skočni zglob / Ankle
- `zglob-kolena.pdf` — Zglob kolena / Knee
- `kicmeni-stub.pdf` — Kičmeni stub / Spine
- `zglob-ramena.pdf` — Zglob ramena / Shoulder
- `misici-zadnje-loze.pdf` — Mišići zadnje lože / Hamstrings
- `ostalo.pdf` — Generic / Ostalo, optional

File names must match the slugs above exactly — they are used by
`getProtocolPdfUrl()` in `src/lib/email.ts` and by the form in
`src/components/sections/LeadCapturePopup.tsx`. The popup only shows
body parts with a dedicated PDF; `ostalo` is treated as a normal inquiry
unless a generic PDF is added later.
