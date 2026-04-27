/**
 * Generates favicon, app icons, PWA manifest icons, and social share images
 * from public/brand/logo-mark.svg (square mark) and public/logo.png (wordmark).
 *
 * Run with: npm run generate:icons
 */
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const APP = path.join(ROOT, "src", "app");

const MARK_SVG = path.join(PUBLIC, "brand", "logo-mark.svg");
const WORDMARK = path.join(PUBLIC, "logo.png");

const NAVY = { r: 11, g: 42, b: 74, alpha: 1 };
const TAGLINE_SR =
  "Recovery kit, suplementi i protokoli — brži povratak na teren.";

async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

async function pngFromMark(size, outPath, { padding = 0 } = {}) {
  const svg = await readFile(MARK_SVG);
  if (padding === 0) {
    await sharp(svg, { density: 384 })
      .resize(size, size)
      .png()
      .toFile(outPath);
    return;
  }
  // Maskable: render mark smaller inside a navy square so safe-area is respected.
  const inner = Math.round(size * (1 - padding * 2));
  const markBuf = await sharp(svg, { density: 384 })
    .resize(inner, inner)
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: NAVY,
    },
  })
    .composite([{ input: markBuf, gravity: "center" }])
    .png()
    .toFile(outPath);
}

async function generateFavicon() {
  // ICO: pack 16/32/48 PNGs. Sharp doesn't write ICO directly, but most browsers
  // accept a single 32x32 PNG renamed to .ico. We write a 48x48 PNG as favicon.ico
  // for crispness on high-DPI tabs — Next.js / browsers tolerate this.
  const out = path.join(APP, "favicon.ico");
  const svg = await readFile(MARK_SVG);
  await sharp(svg, { density: 384 }).resize(48, 48).png().toFile(out);
  console.log("✓ favicon.ico (48x48 png)");
}

async function generateAppIcons() {
  await pngFromMark(32, path.join(APP, "icon.png"));
  console.log("✓ src/app/icon.png (32)");
  await pngFromMark(180, path.join(APP, "apple-icon.png"));
  console.log("✓ src/app/apple-icon.png (180)");
  await pngFromMark(192, path.join(PUBLIC, "icon-192.png"));
  console.log("✓ public/icon-192.png");
  await pngFromMark(512, path.join(PUBLIC, "icon-512.png"));
  console.log("✓ public/icon-512.png");
  await pngFromMark(512, path.join(PUBLIC, "icon-512-maskable.png"), {
    padding: 0.1,
  });
  console.log("✓ public/icon-512-maskable.png (with safe area)");
}

/**
 * Recolor an RGBA image: keep its alpha mask, replace all RGB with the given
 * solid color. Returns a PNG buffer.
 */
async function recolor(srcPath, color) {
  const meta = await sharp(srcPath).metadata();
  const width = meta.width ?? 1;
  const height = meta.height ?? 1;
  const colorRect = await sharp({
    create: { width, height, channels: 4, background: color },
  })
    .png()
    .toBuffer();
  // dest-in: keep destination (color rect) only where source (logo) is opaque.
  return sharp(colorRect)
    .composite([{ input: srcPath, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function generateLogoLight() {
  const buf = await recolor(WORDMARK, { r: 255, g: 255, b: 255, alpha: 1 });
  await sharp(buf).toFile(path.join(PUBLIC, "logo-light.png"));
  console.log("✓ public/logo-light.png (white variant for dark bg)");
}

async function generateOgImage() {
  const W = 1200;
  const H = 630;

  // Recolor wordmark to white, then resize to ~600px wide.
  const whiteWordmark = await recolor(WORDMARK, {
    r: 255,
    g: 255,
    b: 255,
    alpha: 1,
  });
  const whiteLogo = await sharp(whiteWordmark)
    .resize({ width: 600, withoutEnlargement: false })
    .png()
    .toBuffer();
  const logoMeta = await sharp(whiteLogo).metadata();
  const logoH = logoMeta.height ?? 150;
  const logoW = logoMeta.width ?? 600;

  // Tagline as SVG
  const taglineSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="120">
      <style>
        .t { fill: #E5E7EB; font-family: 'Segoe UI', Arial, sans-serif;
             font-size: 30px; font-weight: 400; }
        .accent { fill: #14B8A6; }
      </style>
      <text x="${W / 2}" y="60" text-anchor="middle" class="t">${TAGLINE_SR}</text>
      <rect x="${W / 2 - 40}" y="92" width="80" height="3" class="accent"/>
    </svg>
  `);

  // Composite: navy background + centered logo + tagline below
  const logoY = Math.round(H / 2 - logoH / 2 - 60);
  const taglineY = logoY + logoH + 40;

  await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: NAVY,
    },
  })
    .composite([
      { input: whiteLogo, left: Math.round((W - logoW) / 2), top: logoY },
      { input: taglineSvg, left: 0, top: taglineY },
    ])
    .png()
    .toFile(path.join(APP, "opengraph-image.png"));
  console.log("✓ src/app/opengraph-image.png (1200x630)");

  // Twitter image — same asset
  await sharp(path.join(APP, "opengraph-image.png"))
    .png()
    .toFile(path.join(APP, "twitter-image.png"));
  console.log("✓ src/app/twitter-image.png (1200x630)");
}

async function main() {
  await ensureDir(path.join(PUBLIC, "brand"));
  await generateFavicon();
  await generateAppIcons();
  await generateLogoLight();
  await generateOgImage();
  console.log("\nAll assets generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
