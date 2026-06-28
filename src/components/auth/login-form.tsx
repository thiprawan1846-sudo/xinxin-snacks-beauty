"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

export function LoginForm({
  heroImages = [],
}: {
  heroImages?: { url: string; alt: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/";

  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res =
      mode === "login"
        ? await login(email, password)
        : await register({ name, email, password });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "เกิดข้อผิดพลาด");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── Brand wall (desktop only) ── */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-sakura-200 via-peach-200 to-cream-300 lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* floating product collage — same featured images as homepage/admin */}
        <div className="pointer-events-none absolute inset-0">
          <FloatTile
            image={heroImages[0]}
            className="left-[8%] top-[14%] h-32 w-32 -rotate-6"
            delay="0s"
          />
          <FloatTile
            image={heroImages[1]}
            className="right-[12%] top-[10%] h-28 w-28 rotate-6"
            delay="1.2s"
          />
          <FloatTile
            image={heroImages[2]}
            className="left-[16%] bottom-[20%] h-36 w-36 rotate-3"
            delay="0.6s"
          />
          <FloatTile
            image={heroImages[3]}
            className="right-[8%] bottom-[16%] h-32 w-32 -rotate-3"
            delay="1.8s"
          />
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/80 text-xl shadow-soft backdrop-blur">
            🌸
          </span>
          <span className="font-display text-lg font-bold text-ink">
            XinXin
          </span>
        </Link>

        <div className="relative z-10 max-w-sm">
          <p className="mb-3 inline-block rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-sakura-600 backdrop-blur">
            เพื่อนแนะนำของดีจากจีน 🇨🇳
          </p>
          <h1 className="font-display text-4xl font-bold leading-tight text-ink xl:text-5xl">
            ขนม &amp; สุขภาพผิว
            <br />
            ที่คุณจะรัก
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-soft">
            สมัครสมาชิกเพื่อสั่งซื้อขนมจีนฮิตและเครื่องสำอางยอดนิยม
            ส่งตรงถึงมือคุณในไทย
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-xs text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span className="text-base">🚚</span> ส่งไวทั่วไทย
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-base">💝</span> ราคาใจ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-base">⭐</span> คัดสรรแล้ว
          </span>
        </div>
      </aside>

      {/* ── Form side ── */}
      <main className="flex flex-1 items-center justify-center bg-gradient-to-b from-cream-50 to-white px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* mobile logo */}
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2 lg:hidden"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sakura-100 text-xl">
              🌸
            </span>
            <span className="font-display text-lg font-bold text-ink">
              XinXin
            </span>
          </Link>

          {/* mode toggle */}
          <div className="mb-6 flex rounded-full bg-cream-100 p-1">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={cn(
                  "flex-1 rounded-full py-2.5 text-sm font-semibold transition-all",
                  mode === m
                    ? "bg-white text-sakura-600 shadow-soft"
                    : "text-ink-muted hover:text-ink-soft",
                )}
              >
                {m === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
              </button>
            ))}
          </div>

          <h2 className="mb-1 font-display text-2xl font-bold text-ink">
            {mode === "login" ? "ยินดีต้อนรับกลับ 💕" : "มาเป็นเพื่อนกันเถอะ 🌸"}
          </h2>
          <p className="mb-6 text-sm text-ink-muted">
            {mode === "login"
              ? "เข้าสู่ระบบเพื่อดำเนินการต่อ"
              : "สร้างบัญชีเพื่อเริ่มช้อปปิ้ง"}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <Field label="ชื่อ">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ชื่อของคุณ"
                  className="h-12 w-full rounded-2xl border border-cream-300 bg-white px-4 text-sm text-ink outline-none transition-all placeholder:text-ink-muted/60 focus:border-sakura-400 focus:ring-4 focus:ring-sakura-100"
                />
              </Field>
            )}
            <Field label="อีเมล">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="h-12 w-full rounded-2xl border border-cream-300 bg-white px-4 text-sm text-ink outline-none transition-all placeholder:text-ink-muted/60 focus:border-sakura-400 focus:ring-4 focus:ring-sakura-100"
              />
            </Field>
            <Field label="รหัสผ่าน">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                className="h-12 w-full rounded-2xl border border-cream-300 bg-white px-4 text-sm text-ink outline-none transition-all placeholder:text-ink-muted/60 focus:border-sakura-400 focus:ring-4 focus:ring-sakura-100"
              />
            </Field>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-sakura-500 to-peach-500 text-sm font-bold text-white shadow-soft transition-all hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting
                ? "กำลังดำเนินการ..."
                : mode === "login"
                  ? "เข้าสู่ระบบ"
                  : "สมัครสมาชิก"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-muted">
            {mode === "login" ? "ยังไม่มีบัญชี? " : "มีบัญชีแล้ว? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
              className="font-semibold text-sakura-600 underline-offset-2 hover:underline"
            >
              {mode === "login" ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-soft">
        {label}
      </span>
      {children}
    </label>
  );
}

function FloatTile({
  image,
  className,
  delay,
}: {
  image?: { url: string; alt: string };
  className?: string;
  delay?: string;
}) {
  return (
    <div className={cn("absolute", className)}>
      <div
        className="relative h-full w-full overflow-hidden rounded-3xl border-4 border-white/70 shadow-float"
        style={{
          animation: "floaty 6s ease-in-out infinite",
          animationDelay: delay,
        }}
      >
        <SafeImage
          src={image?.url ?? ""}
          alt={image?.alt ?? "สินค้าแนะนำ"}
          fill
          sizes="160px"
          className="object-cover"
        />
      </div>
    </div>
  );
}
