import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase clients for XinXin Snacks & Beauty.
 *
 * Two clients are exposed:
 *   - `supabaseServer` — Route Handler / Server Component client that reads
 *     the auth cookie (for user-scoped Storage uploads later).
 *   - `supabaseAdmin`  — service-role client bypassing RLS; used only on the
 *     server for admin operations (product image uploads, DB maintenance).
 *
 * Env vars (see .env.example):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Route Handler / Server Component client (cookie-aware). */
export async function createServerSupabaseClient() {
  const store = await cookies();
  return createServerClient(URL!, ANON!, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(toSet) {
        toSet.forEach(({ name, value, options }) =>
          store.set(name, value, options),
        );
      },
    },
  });
}

/** Admin client with service role — bypasses RLS. Server-only. */
export const supabaseAdmin = SERVICE
  ? createClient(URL!, SERVICE, { auth: { persistSession: false } })
  : null;

/** True when Supabase env vars are configured. */
export const isSupabaseConfigured = Boolean(URL && ANON);

// ───────────────────── Storage helpers ─────────────────────

const PRODUCT_BUCKET = "products";

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload a product image to the `products` bucket.
 * Returns the public URL Supabase serves it from.
 *
 * Server-only; requires SUPABASE_SERVICE_ROLE_KEY.
 */
export async function uploadProductImage(
  file: File | Blob,
  filename: string,
): Promise<UploadResult> {
  if (!supabaseAdmin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  const path = `${Date.now()}-${filename}`;
  const { error } = await supabaseAdmin.storage
    .from(PRODUCT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;

  const { data } = supabaseAdmin.storage
    .from(PRODUCT_BUCKET)
    .getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Delete a product image by its storage path. */
export async function deleteProductImage(path: string): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin.storage.from(PRODUCT_BUCKET).remove([path]);
}
