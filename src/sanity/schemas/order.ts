import { defineField, defineType } from "sanity";

export const order = defineType({
  name: "order",
  title: "Order",
  type: "document",
  fields: [
    defineField({
      name: "orderNumber",
      title: "Order Number",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "items",
      title: "Items",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "product",
              type: "reference",
              to: [{ type: "product" }],
            },
            { name: "productName", type: "string", title: "Product Name" },
            { name: "quantity", type: "number", title: "Quantity" },
            { name: "price", type: "number", title: "Price (RSD)" },
          ],
          preview: {
            select: {
              title: "productName",
              quantity: "quantity",
              price: "price",
            },
            prepare({ title, quantity, price }) {
              return {
                title: `${title} x${quantity}`,
                subtitle: `${price * quantity} RSD`,
              };
            },
          },
        },
      ],
      readOnly: true,
    }),
    defineField({
      name: "totalAmount",
      title: "Total Amount (RSD)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "shippingCost",
      title: "Shipping Cost (RSD)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "customer",
      title: "Customer",
      type: "object",
      fields: [
        { name: "name", type: "string", title: "Full Name" },
        { name: "email", type: "string", title: "Email" },
        { name: "phone", type: "string", title: "Phone" },
        { name: "address", type: "string", title: "Address" },
        { name: "city", type: "string", title: "City" },
        { name: "postalCode", type: "string", title: "Postal Code" },
      ],
      readOnly: true,
    }),
    defineField({
      name: "paymentMethod",
      title: "Payment Method",
      type: "string",
      options: {
        list: [
          { title: "Card Payment (RaiAccept)", value: "card" },
          { title: "Cash on Delivery", value: "cod" },
        ],
      },
      readOnly: true,
    }),
    defineField({
      name: "raiAcceptOrderId",
      title: "RaiAccept Order ID",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "status",
      title: "Order Status",
      type: "string",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Confirmed", value: "confirmed" },
          { title: "Processing", value: "processing" },
          { title: "Shipped", value: "shipped" },
          { title: "Delivered", value: "delivered" },
          { title: "Cancelled", value: "cancelled" },
        ],
      },
      initialValue: "pending",
    }),
    defineField({
      name: "notes",
      title: "Notes",
      type: "text",
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: "orderNumber",
      subtitle: "status",
      customer: "customer.name",
      total: "totalAmount",
    },
    prepare({ title, subtitle, customer, total }) {
      return {
        title: `${title} — ${customer || "Unknown"}`,
        subtitle: `${subtitle} | ${total} RSD`,
      };
    },
  },
  orderings: [
    {
      title: "Created At (newest)",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
  ],
});
