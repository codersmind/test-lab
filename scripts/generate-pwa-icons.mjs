import { readFileSync, mkdirSync } from "fs";
import sharp from "sharp";

const svg = readFileSync("public/icon.svg");
mkdirSync("public/icons", { recursive: true });

const sizes = [180, 192, 512];

for (const size of sizes) {
  await sharp(svg).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
}

await sharp(svg)
  .resize(512, 512)
  .extend({
    top: 64,
    bottom: 64,
    left: 64,
    right: 64,
    background: { r: 234, g: 67, b: 53, alpha: 1 },
  })
  .png()
  .toFile("public/icons/icon-maskable-512.png");

console.log("PWA icons generated in public/icons/");
