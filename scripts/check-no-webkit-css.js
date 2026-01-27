/**
 * Post-build check: dist CSS must not contain -webkit-text-size-adjust
 * (avoids DevTools "parsing error" warning). Run after vite build.
 *
 * Usage: npm run check:css   OR   node scripts/check-no-webkit-css.js
 * Manual grep (PowerShell): Get-ChildItem -Path dist -Recurse -Filter *.css | Select-String "webkit-text-size-adjust"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, "..", "dist");

function walk(dir) {
  if (!fs.existsSync(dir)) {
    console.warn("[check-no-webkit-css] dist not found, skipping");
    return false;
  }
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (name.endsWith(".css")) {
      const content = fs.readFileSync(full, "utf8");
      if (content.includes("-webkit-text-size-adjust")) {
        console.error(`[check-no-webkit-css] Found -webkit-text-size-adjust in ${path.relative(process.cwd(), full)}`);
        process.exit(1);
      }
    }
  }
  return true;
}

if (walk(dist)) console.log("[check-no-webkit-css] OK: no -webkit-text-size-adjust in dist CSS");
