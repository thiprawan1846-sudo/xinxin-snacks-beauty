import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  action,
  className,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-4",
        align === "center" ? "justify-center text-center" : "justify-between",
        className,
      )}
    >
      <div className={cn(align === "center" && "mx-auto max-w-2xl")}>
        {eyebrow && (
          <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-sakura-500">
            {eyebrow}
          </span>
        )}
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-ink-soft md:text-base">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
