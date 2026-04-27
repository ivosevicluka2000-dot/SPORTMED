import { type SchemaTypeDefinition } from "sanity";
import { blogPost } from "./blogPost";
import { blogCategory } from "./blogCategory";
import { author } from "./author";
import { product } from "./product";
import { productCategory } from "./productCategory";
import { order } from "./order";
import { discountCode } from "./discountCode";
import { lead } from "./lead";
import { newsletterSubscriber } from "./newsletterSubscriber";

export const schemaTypes: SchemaTypeDefinition[] = [
  blogPost,
  blogCategory,
  author,
  product,
  productCategory,
  order,
  discountCode,
  lead,
  newsletterSubscriber,
];
