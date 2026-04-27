import { defineConfig } from "sanity";
import { structureTool, type StructureResolver } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./src/sanity/schemas";
import CsvExportPane from "./src/sanity/components/CsvExportPane";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

// Schemas surfaced in the Studio sidebar. Other schemas (product,
// productCategory, order) remain registered so the existing shop keeps
// working, but they are hidden from the admin's day-to-day view.
const VISIBLE_DOC_TYPES = new Set([
  "blogPost",
  "blogCategory",
  "author",
  "discountCode",
  "lead",
  "newsletterSubscriber",
]);

// ----- Phase 4: Leads + Newsletter polish -----

const LEADS_COLUMNS = [
  "createdAt",
  "source",
  "name",
  "phone",
  "email",
  "service",
  "status",
  "message",
];

const LEADS_HEADERS = [
  "Created at",
  "Source",
  "Name",
  "Phone",
  "Email",
  "Service",
  "Status",
  "Message",
];

const LEADS_EXPORT_QUERY = `*[_type == "lead"] | order(coalesce(createdAt, _createdAt) desc){
  "createdAt": coalesce(createdAt, _createdAt),
  source,
  name,
  phone,
  email,
  service,
  status,
  message
}`;

const NEWSLETTER_EXPORT_QUERY = `*[_type == "newsletterSubscriber"] | order(coalesce(createdAt, _createdAt) desc){
  "createdAt": coalesce(createdAt, _createdAt),
  email,
  locale,
  unsubscribed
}`;

const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      // ----- Blog -----
      S.listItem()
        .title("Blog posts")
        .schemaType("blogPost")
        .child(S.documentTypeList("blogPost").title("Blog posts")),
      S.listItem()
        .title("Authors")
        .schemaType("author")
        .child(S.documentTypeList("author").title("Authors")),
      S.listItem()
        .title("Blog categories")
        .schemaType("blogCategory")
        .child(S.documentTypeList("blogCategory").title("Blog categories")),

      S.divider(),

      // ----- Discount codes -----
      S.listItem()
        .title("Discount codes")
        .schemaType("discountCode")
        .child(
          S.documentTypeList("discountCode")
            .title("Discount codes")
            .defaultOrdering([{ field: "code", direction: "asc" }]),
        ),

      S.divider(),

      // ----- Leads (spreadsheet-like, with status filter chips) -----
      S.listItem()
        .title("Leads")
        .child(
          S.list()
            .title("Leads")
            .items([
              S.listItem()
                .title("New")
                .child(
                  S.documentList()
                    .title("New leads")
                    .schemaType("lead")
                    .filter('_type == "lead" && status == "new"')
                    .defaultOrdering([
                      { field: "createdAt", direction: "desc" },
                    ]),
                ),
              S.listItem()
                .title("Contacted")
                .child(
                  S.documentList()
                    .title("Contacted leads")
                    .schemaType("lead")
                    .filter('_type == "lead" && status == "contacted"')
                    .defaultOrdering([
                      { field: "createdAt", direction: "desc" },
                    ]),
                ),
              S.listItem()
                .title("Closed")
                .child(
                  S.documentList()
                    .title("Closed leads")
                    .schemaType("lead")
                    .filter('_type == "lead" && status == "closed"')
                    .defaultOrdering([
                      { field: "createdAt", direction: "desc" },
                    ]),
                ),
              S.divider(),
              S.listItem()
                .title("All leads")
                .child(
                  S.documentTypeList("lead")
                    .title("All leads")
                    .defaultOrdering([
                      { field: "createdAt", direction: "desc" },
                    ]),
                ),
              S.listItem()
                .title("By source: Contact form")
                .child(
                  S.documentList()
                    .title("Contact form leads")
                    .schemaType("lead")
                    .filter('_type == "lead" && source == "contact"')
                    .defaultOrdering([
                      { field: "createdAt", direction: "desc" },
                    ]),
                ),
              S.listItem()
                .title("By source: B2B")
                .child(
                  S.documentList()
                    .title("B2B inquiries")
                    .schemaType("lead")
                    .filter('_type == "lead" && source == "b2b"')
                    .defaultOrdering([
                      { field: "createdAt", direction: "desc" },
                    ]),
                ),
              S.listItem()
                .title("By source: Popups")
                .child(
                  S.documentList()
                    .title("Popup leads")
                    .schemaType("lead")
                    .filter(
                      '_type == "lead" && source in ["lead-capture-popup", "exit-intent"]',
                    )
                    .defaultOrdering([
                      { field: "createdAt", direction: "desc" },
                    ]),
                ),
              S.divider(),
              S.listItem()
                .title("⬇ Export to CSV")
                .child(
                  S.component(CsvExportPane)
                    .title("Export leads to CSV")
                    .options({
                      query: LEADS_EXPORT_QUERY,
                      columns: LEADS_COLUMNS,
                      headers: LEADS_HEADERS,
                      fileName: "leads",
                      title: "Export leads to CSV",
                      description:
                        "Downloads every lead in the dataset as a UTF-8 CSV file (opens cleanly in Excel and Google Sheets).",
                    }),
                ),
            ]),
        ),

      S.divider(),

      // ----- Newsletter subscribers -----
      S.listItem()
        .title("Newsletter")
        .child(
          S.list()
            .title("Newsletter")
            .items([
              S.listItem()
                .title("Active subscribers")
                .child(
                  S.documentList()
                    .title("Active subscribers")
                    .schemaType("newsletterSubscriber")
                    .filter(
                      '_type == "newsletterSubscriber" && !(unsubscribed == true)',
                    )
                    .defaultOrdering([
                      { field: "createdAt", direction: "desc" },
                    ]),
                ),
              S.listItem()
                .title("Unsubscribed")
                .child(
                  S.documentList()
                    .title("Unsubscribed")
                    .schemaType("newsletterSubscriber")
                    .filter(
                      '_type == "newsletterSubscriber" && unsubscribed == true',
                    )
                    .defaultOrdering([
                      { field: "createdAt", direction: "desc" },
                    ]),
                ),
              S.divider(),
              S.listItem()
                .title("All subscribers")
                .child(
                  S.documentTypeList("newsletterSubscriber")
                    .title("All subscribers")
                    .defaultOrdering([
                      { field: "createdAt", direction: "desc" },
                    ]),
                ),
              S.divider(),
              S.listItem()
                .title("⬇ Export to CSV")
                .child(
                  S.component(CsvExportPane)
                    .title("Export subscribers to CSV")
                    .options({
                      query: NEWSLETTER_EXPORT_QUERY,
                      columns: ["createdAt", "email", "locale", "unsubscribed"],
                      headers: [
                        "Subscribed at",
                        "Email",
                        "Locale",
                        "Unsubscribed",
                      ],
                      fileName: "newsletter-subscribers",
                      title: "Export newsletter subscribers",
                      description:
                        "Downloads every newsletter subscriber as a UTF-8 CSV file.",
                    }),
                ),
            ]),
        ),
    ]);

export default defineConfig({
  name: "sport-care-med",
  title: "Sport Care Med CMS",
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    // Hide shop schemas from "create new document" menus and global search
    // surfaces while keeping them registered for the storefront code.
    templates: (prev) =>
      prev.filter((tpl) => VISIBLE_DOC_TYPES.has(tpl.schemaType)),
  },
});
