import { supabase } from "@/integrations/supabase/client";

export const MAX_IMAGES = 10;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10; // 10 years

/** Downscale + re-encode to JPEG in the browser to keep mobile uploads fast. */
export async function compressImage(file: File, maxSide = 1600, quality = 0.75): Promise<Blob> {
  if (typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/** Uploads compressed images to the listing-images bucket and links them to an ad. */
export async function uploadAdImages(adId: string, userId: string, files: File[]) {
  const urls: string[] = [];
  for (const [index, file] of files.slice(0, MAX_IMAGES).entries()) {
    const blob = await compressImage(file);
    const path = `${userId}/${adId}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage
      .from("listing-images")
      .upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) throw error;

    const { data: signed, error: signError } = await supabase.storage
      .from("listing-images")
      .createSignedUrl(path, SIGNED_URL_TTL);
    if (signError) throw signError;

    urls.push(signed.signedUrl);
    const { error: rowError } = await supabase
      .from("ad_images")
      .insert({ ad_id: adId, url: signed.signedUrl, sort_order: index });
    if (rowError) throw rowError;
  }
  return urls;
}

export function validateImageFile(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) return "type";
  if (file.size > MAX_FILE_BYTES) return "size";
  return null;
}
