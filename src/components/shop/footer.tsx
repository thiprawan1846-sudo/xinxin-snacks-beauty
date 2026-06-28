import Link from "next/link";

const FOOTER_LINKS = [
  {
    title: "ร้านค้า",
    links: [
      { href: "/products", label: "สินค้าทั้งหมด" },
      { href: "/products?category=snacks", label: "ขนมจีน" },
      { href: "/products?category=beauty", label: "เครื่องสำอางจีน" },
      { href: "/orders", label: "คำสั่งซื้อของฉัน" },
    ],
  },
  {
    title: "ช่วยเหลือ",
    links: [
      { href: "#", label: "วิธีสั่งซื้อ" },
      { href: "#", label: "การจัดส่ง" },
      { href: "#", label: "คำถามที่พบบ่อย" },
      { href: "#", label: "ติดต่อเรา" },
    ],
  },
  {
    title: "เกี่ยวกับ",
    links: [
      { href: "#", label: "เรื่องราว XinXin" },
      { href: "/admin", label: "จัดการร้าน" },
      { href: "#", label: "นโยบายความเป็นส่วนตัว" },
      { href: "#", label: "เงื่อนไขการใช้งาน" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-sakura-100/70 bg-white/60 backdrop-blur-sm">
      <div className="container-x py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sakura-400 to-peach-400 text-lg shadow-soft">
                🌸
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-xl font-bold text-gradient-sakura">
                  XinXin
                </span>
                <span className="text-xs text-ink-muted">
                  Snacks & Beauty
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
              ร้านขนมและเครื่องสำอางจีนส่งตรงจากจีน 🌸 คัดสรรสินค้ายอดนิยมจาก
              Xiaohongshu และ TikTok ส่งถึงบ้านคุณทั่วประเทศไทย
            </p>
            <div className="mt-5 flex gap-2">
              {["📱", "💬", "📷", "🎵"].map((emoji, i) => (
                <span
                  key={i}
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-2xl bg-sakura-50 text-lg transition-all hover:-translate-y-0.5 hover:bg-sakura-100 hover:shadow-soft"
                >
                  {emoji}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold text-ink">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-soft transition-colors hover:text-sakura-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-sakura-100/60 pt-6 text-sm text-ink-muted md:flex-row">
          <p>© 2026 XinXin Snacks & Beauty · สงวนลิขสิทธิ์</p>
          <p className="flex items-center gap-1.5">
            ทำด้วย <span className="text-sakura-500">❤</span> สำหรับคนรักของจีน
          </p>
        </div>
      </div>
    </footer>
  );
}
