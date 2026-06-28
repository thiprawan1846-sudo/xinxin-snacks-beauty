import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

/**
 * POST /api/admin/upload
 * Body: multipart/form-data with `file` field
 * Uploads to Supabase Storage `products` bucket, returns the public URL.
 */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 },
    );
  }

  // Validate type
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPG/PNG/WebP/GIF allowed" },
      { status: 400 },
    );
  }

  // Validate size (max 4MB)
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large (max 4MB)" },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const buffer = await file.arrayBuffer();

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/products/${filename}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: buffer,
    },
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Upload failed: ${res.status} ${text}` },
      { status: 500 },
    );
  }

  // Public URL for objects in a public bucket
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/products/${filename}`;
  return NextResponse.json({ data: { url: publicUrl } }, { status: 201 });
}

/**
 * DELETE /api/admin/upload?url=<public url>
 * Removes an object from the `products` bucket. Safe to call even if the
 * object is already gone (Supabase returns 404 → we treat as success).
 */
export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 },
    );
  }

  const url = new URL(request.url).searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Extract the object path after `.../products/`
  const marker = "/storage/v1/object/public/products/";
  const idx = url.indexOf(marker);
  if (idx === -1) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }
  const path = decodeURIComponent(url.slice(idx + marker.length));

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/products/${path}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY },
    },
  );
  // 404 means already gone — treat as success for idempotency
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Delete failed: ${res.status} ${text}` },
      { status: 500 },
    );
  }
  return NextResponse.json({ data: { deleted: true } });
}
