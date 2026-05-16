import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, "node_modules", "@ffmpeg", "core", "dist", "umd");
const target = join(root, "public", "ffmpeg");

if (!existsSync(source)) {
  console.warn("ffmpeg core assets not found; run npm install first.");
  process.exit(0);
}

mkdirSync(target, { recursive: true });

for (const file of readdirSync(source)) {
  if (file.startsWith("ffmpeg-core.")) {
    copyFileSync(join(source, file), join(target, file));
  }
}
