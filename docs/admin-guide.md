# Sport Care Med — Admin Guide

The admin panel lives at `/admin` (e.g. `https://your-domain.tld/sr/admin`).
It is fully bilingual (Serbian + English) and backed by Supabase.

---

## 1. First-time setup

1. Sign up for an account at `/sr/nalog/registracija` (or `/en/nalog/registracija`).
2. Confirm your email by clicking the link sent by Supabase.
3. Promote your account to **admin** by running this in the Supabase SQL editor:

   ```sql
   update profiles set role = 'admin' where id = '<YOUR_USER_ID>';
   ```

   You can find your user id under Supabase → **Authentication → Users**.
4. Log in at `/sr/nalog/prijava`. You will now see an **Admin** link in the
   header menu, and `/sr/admin` will load the dashboard.

> ⚠️ Anyone without `role='admin'` will see a *Forbidden* page on `/admin`.

---

## 2. Dashboard (`/admin`)

Shows quick counts: products, orders, blog posts, new leads. Use the
sidebar to jump into any section.

---

## 3. Products (`/admin/products`)

- **New product** → bilingual name + description, slug, price, optional
  compare-at price, stock count, category, type (physical / PDF), images
  uploaded directly to Supabase Storage (`product-images` bucket),
  Featured / Active toggles.
- Edit any product by clicking it in the list. **Delete** appears at the
  bottom of the edit page (with a confirm prompt).
- All bilingual fields have **SR** / **EN** tabs — both are saved on every
  submit, so you cannot accidentally clear the other language.

## 4. Categories (`/admin/categories`)

Same pattern as products — bilingual title and description, single image,
sort order. Categories drive the storefront filter sidebar.

## 5. Discount codes (`/admin/discounts`)

Create % or fixed-amount codes with optional date window, max uses, and
minimum order amount. The `used_count` is updated automatically when an
order is confirmed.

## 6. Orders (`/admin/orders`)

Read-only list of all orders. Open any order to see the customer info,
line items, payment method, totals, and **change the status**:
`pending → awaiting_payment → confirmed → paid → processing → shipped →
delivered`, or `cancelled` / `failed`.

Status changes are reflected in the customer's account dashboard
(`/sr/nalog`) and trigger discount usage tracking on first confirmation.

## 7. Blog posts (`/admin/blog`)

Each blog post is a **single language** (SR or EN) row. To publish the
same article in both languages:

1. Create the SR version first.
2. Open it for editing — top-right shows **+ Translation group (EN)**.
3. Click it → the EN editor opens pre-linked via the same
   `translation_group` UUID. Public language switcher will swap to it.

**Body** is Markdown. Use the **Preview** toggle to see rendered output.
Headings (`##`), lists, links, images and code blocks are all supported.

`Publish date` empty = draft (not visible publicly).

## 8. Authors (`/admin/authors`)

Author profile with bilingual bio, role label, and avatar (uploaded to
`blog-images` bucket). Linked to blog posts via the **Author** dropdown.

## 9. Leads (`/admin/leads`)

All form submissions (contact, B2B inquiries, popups). Expand any row to
see the message, set status (`new` / `contacted` / `closed`) and add
internal notes. Use **Export CSV** for bulk download.

## 10. Newsletter (`/admin/newsletter`)

Subscribers list + CSV export.

---

## Tips

- **Storefront updates immediately** — every save calls
  `revalidatePath('/', 'layout')`.
- **Image uploads** go straight to Supabase Storage. URLs are stored on
  the row; you can swap or remove images at any time.
- **Bilingual content is stored as `jsonb {sr, en}`** on a single row for
  products / categories / authors. Blog posts use one row per language
  joined by `translation_group`.
- **All admin routes are server-side guarded** by `requireAdmin()` and
  RLS policies. Even with the service role key, no admin action runs
  without verifying the caller's profile role.
