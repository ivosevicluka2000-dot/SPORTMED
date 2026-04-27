import { defineField, defineType } from "sanity";

export const lead = defineType({
  name: "lead",
  title: "Lead",
  type: "document",
  fields: [
    defineField({
      name: "source",
      title: "Source",
      type: "string",
      options: {
        list: [
          { title: "Contact form", value: "contact" },
          { title: "B2B inquiry", value: "b2b" },
          { title: "Lead capture popup", value: "lead-capture-popup" },
          { title: "Exit intent popup", value: "exit-intent" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
    }),
    defineField({
      name: "service",
      title: "Service",
      type: "string",
      description: "Service of interest (contact form).",
    }),
    defineField({
      name: "message",
      title: "Message",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "metadata",
      title: "Metadata",
      type: "object",
      options: { collapsible: true, collapsed: true },
      fields: [
        { name: "page", type: "string", title: "Page" },
        { name: "locale", type: "string", title: "Locale" },
        { name: "userAgent", type: "string", title: "User agent" },
        { name: "referrer", type: "string", title: "Referrer" },
      ],
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Contacted", value: "contacted" },
          { title: "Closed", value: "closed" },
        ],
        layout: "radio",
      },
      initialValue: "new",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "notes",
      title: "Internal notes",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      name: "name",
      phone: "phone",
      email: "email",
      source: "source",
      status: "status",
      createdAt: "createdAt",
    },
    prepare({ name, phone, email, source, status, createdAt }) {
      const who = name || email || phone || "(no name)";
      const date = createdAt
        ? new Date(createdAt).toLocaleString("sr-RS", {
            dateStyle: "short",
            timeStyle: "short",
          })
        : "—";
      return {
        title: `${who} • ${source}`,
        subtitle: `${status} • ${date}${phone ? ` • ${phone}` : ""}`,
      };
    },
  },
  orderings: [
    {
      title: "Newest first",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
    {
      title: "Status (new first)",
      name: "statusNewFirst",
      by: [
        { field: "status", direction: "asc" },
        { field: "createdAt", direction: "desc" },
      ],
    },
  ],
});
