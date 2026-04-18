import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "teal" | "navy" | "gray" | "green" | "gold";
  className?: string;
}

export default function Badge({
  children,
  variant = "teal",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider",
        {
          "bg-teal-50 text-teal-dark": variant === "teal",
          "bg-navy-50 text-navy": variant === "navy",
          "bg-gray-100 text-gray-500": variant === "gray",
          "bg-accent/10 text-green-700": variant === "green",
          "bg-gold/10 text-gold": variant === "gold",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
