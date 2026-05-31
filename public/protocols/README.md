# Free PDF protocols

These PDFs are emailed to leads who request a free protocol from the
lead capture popup or contact form. Emails use the submitted locale:
English leads get files from `/protocols/en/`, and Serbian/default leads
get files from `/protocols/sr/`.

The body-part values in the forms stay stable, but the public PDF file
names differ by language:

| Body-part value | English PDF | Serbian PDF |
| --- | --- | --- |
| `misici-zadnje-loze` | `/protocols/en/hamstring-strain.pdf` | `/protocols/sr/istegnuce-zadnje-loze.pdf` |
| `skocni-zglob` | `/protocols/en/ankle-sprain.pdf` | `/protocols/sr/skocni-zglob.pdf` |
| `zglob-kolena` | `/protocols/en/knee-pain.pdf` | `/protocols/sr/zglob-kolena.pdf` |
| `zglob-ramena` | `/protocols/en/shoulder-pain.pdf` | `/protocols/sr/zglob-ramena.pdf` |
| `kicmeni-stub` | `/protocols/en/lower-back-pain.pdf` | `/protocols/sr/kicmeni-stub.pdf` |

The mapping is defined in `src/lib/email.ts` and is checked by
`src/app/api/contact/route.ts` before sending. `ostalo` is not sent as a
protocol email unless a dedicated file and form/API support are added.
