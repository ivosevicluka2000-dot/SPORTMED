import { type SchemaTypeDefinition } from "sanity";
import { blogPost } from "./blogPost";
import { blogCategory } from "./blogCategory";
import { author } from "./author";
import { product } from "./product";
import { productCategory } from "./productCategory";
import { order } from "./order";

export const schemaTypes: SchemaTypeDefinition[] = [
  blogPost,
  blogCategory,
  author,
  product,
  productCategory,
  order,
];
