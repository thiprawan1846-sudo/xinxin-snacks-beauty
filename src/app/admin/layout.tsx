import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  title: "Admin Console",
  description: "จัดการร้าน XinXin — สินค้า คลังสินค้า คำสั่งซื้อ",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-cream-100">
      <AdminSidebar />
      <div className="flex-1 overflow-x-hidden">
        <div className="container-x py-6 md:py-8">{children}</div>
      </div>
    </div>
  );
}
