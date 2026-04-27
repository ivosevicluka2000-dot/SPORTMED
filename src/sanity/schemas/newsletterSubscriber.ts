import { defineField, defineType } from "sanity";

export const newsletterSubscriber = defineType({
  name: "newsletterSubscriber",
  title: "Newsletter Subscriber",
  type: "document",
  fields: [
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) =>
        Rule.required().email().error("A valid email is required"),
    }),
    defineField({
      name: "locale",
      title: "Locale",
      type: "string",
      options: {
        list: [
          { title: "Srpski", value: "sr" },
          { title: "English", value: "en" },
        ],
        layout: "radio",
      },
      initialValue: "sr",
    }),
    defineField({
      name: "createdAt",
      title: "Subscribed at",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "unsubscribed",
      title: "Unsubscribed",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      email: "email",
      locale: "locale",
      unsubscribed: "unsubscribed",
      createdAt: "createdAt",
    },
    prepare({ email, locale, unsubscribed, createdAt }) {
      const date = createdAt
        ? new Date(createdAt).toLocaleDateString("sr-RS")
        : "—";
      return {
        title: email || "(no email)",
        subtitle: `${locale || "?"} • ${date}${unsubscribed ? " • unsubscribed" : ""}`,
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
      title: "Email (A→Z)",
      name: "emailAsc",
      by: [{ field: "email", direction: "asc" }],
    },
  ],
});
