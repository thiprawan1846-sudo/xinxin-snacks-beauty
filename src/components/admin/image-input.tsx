"use client";

import { useRef, useState } from "react";
import { SafeImage as Image } from "@/components/ui/safe-image";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Trash2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

/**
 * Image input with upload-to-Supabase-Storage support.
 * - Upload → POST /api/admin/upload → fills URL
 * - Replace → uploading a new file supersedes the old one (old file is
 *   removed from Storage so orphans don't pile up)
 * - Remove (✕) → DELETE /api/admin/upload?url=… removes the Storage object
 * - Or paste a URL directly in the text field
 */
export function ImageInput({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** True when the url points at our own Supabase products bucket. */
  function isStorageUrl(url: string): boolean {
    return url.includes("/storage/v1/object/public/products/");
  }

  async function deleteFromStorage(url: string) {
    if (!isStorageUrl(url)) return;
    try {
      await fetch(`/api/admin/upload?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
      });
    } catch {
      // non-fatal — the DB value is the source of truth
    }
  }

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      // Replace: remove the previous storage object if it was uploaded here.
      if (value && isStorageUrl(value) && value !== json.data.url) {
        await deleteFromStorage(value);
      }
      onChange(json.data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    await deleteFromStorage(value);
    onChange("");
    setRemoving(false);
  }

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-sakura-200">
          <Image
            src={value}
            alt="preview"
            fill
            sizes="96px"
            className="object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-ink text-white shadow transition-colors hover:bg-rose-600 disabled:opacity-50"
            aria-label="Remove image"
            title="删除图片"
          >
            {removing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "上传中..." : value ? "替换图片" : "上传图片"}
        </Button>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="或粘贴图片 URL"
          className="flex-1 rounded-lg border border-sakura-200 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-sakura-400 focus:outline-none"
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
