import { defineField, defineType } from "sanity";

export const discountCode = defineType({
  name: "discountCode",
  title: "Discount Code",
  type: "document",
  fields: [
    defineField({
      name: "code",
      title: "Code",
      type: "string",
      description: "Stored uppercase. Customers type case-insensitively.",
      validation: (Rule) =>
        Rule.required()
          .min(2)
          .max(40)
          .regex(/^[A-Z0-9_-]+$/, {
            name: "uppercase alphanumeric",
            invert: false,
          }),
    }),
    defineField({
      name: "type",
      title: "Discount Type",
      type: "string",
      options: {
        list: [
          { title: "Percent (%)", value: "percent" },
          { title: "Fixed amount (RSD)", value: "fixed" },
        ],
        layout: "radio",
      },
      initialValue: "percent",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "value",
      title: "Value",
      type: "number",
      description:
        "For percent: 10 means 10%. For fixed: amount in RSD subtracted from subtotal.",
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: "validFrom",
      title: "Valid From",
      type: "datetime",
    }),
    defineField({
      name: "validUntil",
      title: "Valid Until",
      type: "datetime",
    }),
    defineField({
      name: "maxUses",
      title: "Max Uses",
      type: "number",
      description: "Leave empty for unlimited.",
      validation: (Rule) => Rule.min(1).integer(),
    }),
    defineField({
      name: "usedCount",
      title: "Used Count",
      type: "number",
      readOnly: true,
      initialValue: 0,
    }),
    defineField({
      name: "minOrderAmount",
      title: "Minimum Order Amount (RSD)",
      type: "number",
      description: "Subtotal must be >= this for the code to apply.",
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "code",
      type: "type",
      value: "value",
      active: "active",
      used: "usedCount",
      max: "maxUses",
    },
    prepare({ title, type, value, active, used, max }) {
      const valueLabel = type === "percent" ? `${value}%` : `${value} RSD`;
      const usage = max ? `${used ?? 0}/${max}` : `${used ?? 0}`;
      return {
        title: title || "(no code)",
        subtitle: `${valueLabel} • ${active ? "active" : "inactive"} • used ${usage}`,
      };
    },
  },
  orderings: [
    {
      title: "Code (A→Z)",
      name: "codeAsc",
      by: [{ field: "code", direction: "asc" }],
    },
    {
      title: "Active first",
      name: "activeFirst",
      by: [
        { field: "active", direction: "desc" },
        { field: "code", direction: "asc" },
      ],
    },
  ],
});
