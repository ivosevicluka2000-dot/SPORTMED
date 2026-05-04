"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";

interface ImageUploaderProps {
  bucket: string;
  /** Hidden input name — receives the JSON array of URLs. */
  name: string;
  initial?: string[];
  multiple?: boolean;
}

/**
 * Uploads images to a Supabase Storage bucket and serializes the resulting
 * public URLs into a hidden input. Use inside a <form> so the parent action
 * picks up `name` as `JSON.stringify(string[])`.
 */
export default function ImageUploader({
  bucket,
  name,
  initial = [],
  multiple = true,
}: ImageUploaderProps) {
  const t = useTranslations("admin");
  const [urls, setUrls] = useState<string[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const supabase = createClient();
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });
      if (upErr) {
        setError(upErr.message);
        return;
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    startTransition(() => {
      setUrls((prev) => (multiple ? [...prev, ...uploaded] : uploaded.slice(0, 1)));
    });
  }

  function removeAt(i: number) {
    setUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(urls)} />
      {urls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {urls.map((url, i) => (
            <div
              key={url + i}
              className="relative aspect-square rounded-md overflow-hidden border border-gray-200 bg-white"
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 bg-white/90 text-red-600 text-xs px-2 py-0.5 rounded shadow"
              >
                {t("products.removeImage")}
              </button>
            </div>
          ))}
        </div>
      )}
      <div>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-sm cursor-pointer hover:border-gray-300">
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            disabled={pending}
            onChange={(e) => uploadFiles(e.target.files)}
          />
          {t("products.uploadImages")}
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
