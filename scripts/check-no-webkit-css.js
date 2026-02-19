/**
 * Post-build cleanup: Remove -webkit-text-size-adjust from dist CSS
 * (avoids DevTools "parsing error" warning). Run after vite build.
 *
 * Usage: npm run check:css   OR   node scripts/check-no-webkit-css.js
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, "..", "dist");

function walk(dir) {
  if (!fs.existsSync(dir)) {
    console.warn("[cleanup-css] dist not found, skipping");
    return false;
  }
  let found = false;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (name.endsWith(".css")) {
      let content = fs.readFileSync(full, "utf8");
      if (content.includes("-webkit-text-size-adjust")) {
        found = true;
        // Remove -webkit-text-size-adjust: 100%; declaration
        content = content.replace(/-webkit-text-size-adjust:\s*100%\s*;?\s*/g, "");
        fs.writeFileSync(full, content, "utf8");
        console.log(`[cleanup-css] Removed -webkit-text-size-adjust from ${path.relative(process.cwd(), full)}`);
      }
    }
  }
  return !found;
}

if (walk(dist)) console.log("[cleanup-css] OK: no -webkit-text-size-adjust in dist CSS");
else console.log("[cleanup-css] Complete: -webkit-text-size-adjust removed from dist CSS");
