import Image from "next/image";
import type { Author } from "@/types";

interface AuthorCardProps {
  author: Author;
  label: string;
}

export default function AuthorCard({ author, label }: AuthorCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-ivory rounded-xl border border-gray-100">
      {author.image ? (
        <Image
          src={author.image}
          alt={author.name}
          width={48}
          height={48}
          className="w-12 h-12 rounded-full object-cover"
        />
      ) : (
        <div className="w-12 h-12 rounded-full border border-teal/30 flex items-center justify-center">
          <span className="text-lg font-heading font-semibold text-teal">
            {author.name.charAt(0)}
          </span>
        </div>
      )}
      <div>
        <p className="text-[10px] uppercase tracking-wider text-gray-400">{label}</p>
        <p className="font-heading font-semibold text-navy">{author.name}</p>
        {author.role && (
          <p className="text-xs text-gray-400">{author.role}</p>
        )}
      </div>
    </div>
  );
}
