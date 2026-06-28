"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  defaultValue?: string;
  variant?: "default" | "hero";
}

export function SearchBar({
  className,
  placeholder = "ค้นหาขนม ลิปสติก ชานม...",
  defaultValue = "",
  variant = "default",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "relative flex w-full items-center",
        variant === "hero"
          ? "h-14 rounded-full bg-white/90 shadow-soft-lg ring-1 ring-sakura-100 backdrop-blur"
          : "h-11 rounded-full bg-white/80 ring-1 ring-inset ring-sakura-200",
        className,
      )}
    >
      <Search className="ml-5 h-5 w-5 shrink-0 text-sakura-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="h-full w-full bg-transparent px-4 text-sm text-ink outline-none placeholder:text-ink-muted/70"
      />
      <button
        type="submit"
        className={cn(
          "mr-1.5 h-9 shrink-0 rounded-full px-5 text-sm font-semibold text-white transition-all active:scale-95",
          variant === "hero"
            ? "bg-gradient-to-r from-sakura-500 to-peach-500 shadow-soft hover:brightness-105"
            : "bg-sakura-500 hover:bg-sakura-600",
        )}
      >
        ค้นหา
      </button>
    </form>
  );
}
