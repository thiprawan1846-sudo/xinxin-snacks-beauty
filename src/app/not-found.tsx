import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="grid h-24 w-24 place-items-center rounded-full bg-sakura-100 text-5xl animate-float">
        🌸
      </span>
      <h1 className="mt-6 font-display text-4xl font-bold text-gradient-sakura">
        404
      </h1>
      <p className="mt-2 font-display text-xl font-semibold text-ink">
        ไม่พบหน้าที่คุณกำลังมองหา
      </p>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        หน้านี้อาจถูกย้ายหรือไม่มีอยู่อีกต่อไป ลองกลับไปหน้าแรกดูนะ
      </p>
      <Link
        href="/"
        className="pill mt-6 h-12 bg-gradient-to-r from-sakura-500 to-peach-500 px-7 text-sm font-semibold text-white shadow-soft-lg transition-all hover:brightness-105 active:scale-95"
      >
        กลับหน้าแรก
      </Link>
    </div>
  );
}
