# Sport Care Med — Admin Guide

A quick walkthrough of the admin panel (Sanity Studio) at `/studio`.

---

## 1. Logging in

1. Open `https://your-domain.tld/studio` in your browser.
2. Click **"Continue with Google"** (or "Continue with email" for a magic-link).
3. Use the email address that was invited as **Administrator** in
   [sanity.io/manage](https://sanity.io/manage).
   - If you do not have an invitation yet, ask the developer to add you.
4. After login the sidebar shows: **Blog posts**, **Authors**, **Blog
   categories**, **Discount codes**, **Leads**, **Newsletter**. That is the
   entire admin surface — there is no separate user database to maintain.

> 💡 Visitors of the public site never see the login screen. Studio is only
> reachable at `/studio` and is excluded from search engines (`robots.ts`
> + `noindex`).

---

## 2. Writing a blog post (Serbian + English)

1. Sidebar → **Blog posts** → **Create new** (top-right ✚).
2. Fill in for **Serbian** (default tab):
   - **Title (sr)** — appears in `/blog`
   - **Slug (sr)** — auto-generated, edit if you want a custom URL
   - **Excerpt (sr)** — short summary used on listings and SEO
   - **Body (sr)** — the article content (rich text)
3. Switch to the **English** tab (or scroll to the English fields) and fill
   the same fields in English. Both languages are required for the post to
   appear on `/en/blog`.
4. Pick a **Category** and **Author** from the dropdowns.
5. Upload a **Cover image** (recommended ≥ 1600×900, JPG or PNG).
6. Click **Publish** in the bottom-right.
7. Verify:
   - Serbian: open `https://your-domain.tld/blog/<slug-sr>`
   - English: open `https://your-domain.tld/en/blog/<slug-en>`

> Drafts are saved automatically. Use **Publish** when the post is ready
> for the public site. **Unpublish** removes it from the live site without
> deleting it.

---

## 3. Adding a discount code

1. Sidebar → **Discount codes** → ✚.
2. Fill in:
   - **Code** — what the customer types at checkout (e.g. `SUMMER10`).
     Always uppercase, no spaces.
   - **Type** — `percent` (e.g. 10 = 10% off) or `fixed` (e.g. 500 = 500 RSD off).
   - **Value** — the number itself.
   - **Active** — toggle **on** to enable the code immediately.
   - *(Optional)* **Valid from / Valid until** — schedule the code.
   - *(Optional)* **Max uses** — total number of orders that may use this
     code. Leave empty for unlimited.
   - *(Optional)* **Min order amount** — minimum subtotal (RSD) required.
3. **Publish**.
4. Test on the storefront: add an item to cart → go to checkout → enter the
   code. You should see the discount applied.
5. Each successful order automatically increments **Used count** so you can
   see how popular a code is. When **Used count ≥ Max uses**, the server
   rejects further attempts even if the customer types it correctly.

> To deactivate a code without deleting it, set **Active** → off and
> publish again.

---

## 4. Viewing leads (contact, B2B, popups)

The **Leads** section is the spreadsheet-style inbox for every form on the
site (contact form, B2B inquiry, lead-capture popup, exit-intent popup).
There are **no email notifications** for leads — open this list to check.

Sidebar → **Leads** opens a sub-menu:

| View | What it shows |
| ---- | ------------- |
| **New** | Leads you have not handled yet (status = `new`). Start here. |
| **Contacted** | Leads you reached out to but did not close yet. |
| **Closed** | Done deals or rejections — kept for the record. |
| **All leads** | Everything, newest first. |
| **By source: Contact form** | Only leads coming from the main contact form. |
| **By source: B2B** | Only B2B inquiries. |
| **By source: Popups** | Lead-capture + exit-intent popups. |
| **⬇ Export to CSV** | Downloads every lead as a UTF-8 CSV (opens in Excel & Google Sheets). |

### Marking a lead as contacted

1. Open the lead by clicking its row.
2. Add any context in **Internal notes**.
3. Change **Status** from `New` → `Contacted` (or `Closed`).
4. Click **Publish**.

The lead now disappears from the **New** view and shows up under
**Contacted**/**Closed**.

> Tip: The badge of available leads is the count under the **New** view —
> click it once a day to see the new requests.

---

## 5. Newsletter subscribers

Sidebar → **Newsletter** opens a sub-menu:

| View | What it shows |
| ---- | ------------- |
| **Active subscribers** | People currently receiving the newsletter. |
| **Unsubscribed** | People who opted out (kept on file to avoid re-adding). |
| **All subscribers** | Everything. |
| **⬇ Export to CSV** | Download the full list (use this to import into your email tool). |

You receive a notification email *every time* somebody subscribes, so you
do not need to refresh this page constantly. To remove a subscriber
permanently, open them and click **Delete** (top-right ⋯ menu) — but
prefer toggling **Unsubscribed** = on so you keep an audit trail.

---

## 6. CSV export tips

- Both **Leads** and **Newsletter** have a **⬇ Export to CSV** entry as the
  last item in the sub-menu.
- Click it, then press **Download CSV**. The file downloads as
  `leads-YYYY-MM-DD.csv` (or `newsletter-subscribers-YYYY-MM-DD.csv`).
- The file is UTF-8 with a BOM, so Cyrillic and special characters open
  correctly in Excel and Google Sheets.
- The CSV always reflects the latest data — there is no stale cache.

---

## 7. Quick troubleshooting

| Symptom | What to do |
| ------- | ---------- |
| Login button does nothing | Make sure your email is invited in [sanity.io/manage](https://sanity.io/manage) → Members. |
| Blog post not visible on site | Confirm it is **Published** (not draft) and that **both** Serbian and English fields are filled in. |
| Discount code rejected at checkout | Check **Active**, **Valid from/until**, **Used count < Max uses**, and **Min order amount**. |
| Form submitted but no lead in Studio | Hard-refresh Studio (Ctrl/Cmd-R). Then check **All leads**. If still missing, contact the developer. |
| CSV opens with garbled letters | You opened it via "Open" in old Excel. Use **Data → From Text/CSV → 65001: UTF-8** instead. |

---

## 8. Who to ask

- **Editorial / content questions** → marketing lead.
- **Technical issues** (errors, missing data, broken pages) → developer.
- **Sanity account / billing** → owner of the [sanity.io/manage](https://sanity.io/manage) workspace.
