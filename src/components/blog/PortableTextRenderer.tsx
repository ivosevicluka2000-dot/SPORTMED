"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import Image from "next/image";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-3xl font-bold text-navy mt-12 mb-5">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-bold text-navy mt-10 mb-4">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-bold text-navy mt-8 mb-3">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-lg font-semibold text-navy mt-6 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-gray-700 leading-relaxed mb-4">{children}</p>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-teal pl-6 py-2 my-6 bg-teal/5 rounded-r-lg italic text-gray-700">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-4 space-y-2 text-gray-700">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-teal underline hover:text-teal/80 transition-colors"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-navy">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  hr: () => <hr className="my-8 border-gray-200" />,
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-gray-200 px-4 py-2 bg-gray-50 text-left font-semibold text-navy">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-gray-200 px-4 py-2 text-gray-700">{children}</td>
  ),
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6 text-sm">
          <code className={className}>{children}</code>
        </pre>
      );
    }
    return (
      <code className="bg-gray-100 text-navy px-1.5 py-0.5 rounded text-sm">
        {children}
      </code>
    );
  },
  img: ({ src, alt }) => {
    if (!src || typeof src !== "string") return null;
    return (
      <figure className="my-8">
        <Image
          src={src}
          alt={alt ?? ""}
          width={1600}
          height={900}
          sizes="(max-width: 768px) 100vw, 800px"
          className="w-full h-auto rounded-xl"
        />
        {alt && (
          <figcaption className="text-center text-sm text-gray-500 mt-3">
            {alt}
          </figcaption>
        )}
      </figure>
    );
  },
};

interface PortableTextRendererProps {
  value: string;
}

/**
 * Renders Markdown content. Named "PortableTextRenderer" for backwards
 * compatibility with consumers; the Sanity Portable Text format has been
 * replaced by Markdown stored in Supabase `blog_posts.body_markdown`.
 */
export default function PortableTextRenderer({
  value,
}: PortableTextRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={components}
    >
      {value}
    </ReactMarkdown>
  );
}
