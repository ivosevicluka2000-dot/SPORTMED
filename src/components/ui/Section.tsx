import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export default function Section({ children, className, id }: SectionProps) {
  return (
    <section id={id} className={cn("py-20 md:py-32", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  label?: string;
  centered?: boolean;
  accent?: boolean;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  label,
  centered = true,
  accent = false,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-14 md:mb-20", centered && "text-center", className)}>
      {label && (
        <span className="inline-block text-xs font-medium uppercase tracking-[0.2em] text-teal mb-4">
          {label}
        </span>
      )}
      <h2 className="font-heading text-3xl md:text-4xl lg:text-[2.75rem] font-semibold text-navy leading-tight mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
      )}
      {accent && (
        <div className="mt-6 mx-auto h-px w-12 bg-gold" />
      )}
    </div>
  );
}
