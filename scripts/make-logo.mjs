/**
 * Derives the logo assets in public/ and app/ from one source image.
 *
 * Only needed if the logo artwork changes — the outputs are committed, so the
 * app itself has no image dependency. `sharp` is deliberately NOT in
 * package.json, since it is a heavy native module used once:
 *
 *   npm i --no-save sharp
 *   node scripts/make-logo.mjs path/to/new-logo.png
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(process.argv[2] ?? join(PROJECT, "public", "logo.png"));

mkdirSync(`${PROJECT}/public`, { recursive: true });

const src = sharp(SRC);
const { width, height } = await src.metadata();
const { data, info } = await src.raw().toBuffer({ resolveWithObject: true });
const ch = info.channels;

// Background colour = top-left corner.
const bg = [data[0], data[1], data[2]];
const hex = `#${bg.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
console.log(`source ${width}x${height}, ${ch} channels, background ${hex}`);

/*
 * Two-tone artwork: project every pixel onto the line running from the orange
 * background to black. t=0 is background (fully transparent), t=1 is the mark
 * (fully opaque). Doing this before any resize keeps the edges smooth.
 */
const len2 = bg[0] ** 2 + bg[1] ** 2 + bg[2] ** 2;
const out = Buffer.alloc(width * height * 4);
for (let i = 0, o = 0; i < data.length; i += ch, o += 4) {
  const dr = data[i] - bg[0];
  const dg = data[i + 1] - bg[1];
  const db = data[i + 2] - bg[2];
  const t = Math.min(1, Math.max(0, -(dr * bg[0] + dg * bg[1] + db * bg[2]) / len2));
  out[o] = 0;
  out[o + 1] = 0;
  out[o + 2] = 0;
  out[o + 3] = Math.round(t * 255);
}

const mark = sharp(out, { raw: { width, height, channels: 4 } });

// Transparent black mark — sits on any glass surface.
await mark
  .clone()
  .resize(512, 512, { kernel: "lanczos3" })
  .png({ compressionLevel: 9 })
  .toFile(`${PROJECT}/public/logo-mark.png`);

// Full-colour tile, for places that want the logo exactly as supplied.
await sharp(SRC).resize(512, 512, { kernel: "lanczos3" }).png({ compressionLevel: 9 })
  .toFile(`${PROJECT}/public/logo.png`);

// Favicon + apple touch icon (Next.js serves these from app/).
await sharp(SRC).resize(256, 256, { kernel: "lanczos3" }).png({ compressionLevel: 9 })
  .toFile(`${PROJECT}/app/icon.png`);
await sharp(SRC).resize(180, 180, { kernel: "lanczos3" }).png({ compressionLevel: 9 })
  .toFile(`${PROJECT}/app/apple-icon.png`);

console.log("wrote public/logo-mark.png, public/logo.png, app/icon.png, app/apple-icon.png");
