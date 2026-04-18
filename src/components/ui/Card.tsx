import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  variant?: "outlined" | "elevated";
}

export default function Card({
  children,
  className,
  hover = true,
  variant = "outlined",
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl p-6 md:p-8",
        variant === "outlined" && "border border-gray-100",
        variant === "elevated" && "shadow-[var(--shadow-soft)]",
        hover &&
          "transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:border-gray-200",
        className
      )}
    >
      {children}
    </div>
  );
}
