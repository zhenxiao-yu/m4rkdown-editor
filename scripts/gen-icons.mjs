/**
 * Generates PNG icons for PWA from the SVG source.
 * Requires: npm install sharp (dev dependency)
 * Run via: node scripts/gen-icons.mjs
 * Called automatically by `npm run build`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.warn('⚠ sharp not installed — skipping PNG icon generation (SVG fallback used)');
  process.exit(0);
}

const svg = readFileSync('public/icons/icon.svg');
const sizes = [192, 512];

for (const size of sizes) {
  await sharp(svg).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
  console.log(`✓ public/icons/icon-${size}.png`);
}
