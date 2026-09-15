import sharp from "sharp";
import { MAX_CLUB_LOGO_BYTES } from "./branding.ts";

export async function prepareClubLogo(file: File): Promise<Buffer> {
  if (!file.size || file.size > MAX_CLUB_LOGO_BYTES ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("invalidClubLogo");
  }
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 16_000_000 });
    const metadata = await image.metadata();
    if (!metadata.format || !["png", "jpeg", "webp"].includes(metadata.format) || (metadata.pages ?? 1) > 1)
      throw new Error("invalidClubLogo");
    // Decode and re-encode the pixels; preserve transparency and aspect ratio.
    return await image.rotate().resize(800, 800, { fit: "inside", withoutEnlargement: true }).png().toBuffer();
  } catch {
    throw new Error("invalidClubLogo");
  }
}
