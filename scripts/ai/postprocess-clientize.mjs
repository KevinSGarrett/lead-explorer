// scripts/ai/postprocess-clientize.mjs
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIR = path.join(ROOT, "generated", "uizard");

const HOOK_REGEX =
  /\buse(State|Effect|Memo|Callback|Ref|LayoutEffect|Transition|Optimistic|FormState|FormStatus)\b/;
const REACT_IMPORT_REGEX =
  /import\s+{[^}]*\buse(State|Effect|Memo|Callback|Ref|LayoutEffect|Transition|Optimistic|FormState|FormStatus)\b[^}]*}\s+from\s+['"]react['"]/;

async function listTsxFiles(dir) {
  const out = [];
  async function walk(d) {
    let entries;
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.isFile() && p.endsWith(".tsx")) out.push(p);
    }
  }
  await walk(dir);
  return out;
}

function hasClientDirective(src) {
  return /^\s*['"]use client['"];/m.test(src);
}
function hasServerDirective(src) {
  return /^\s*['"]use server['"];/m.test(src);
}

function shouldClientize(src) {
  if (hasClientDirective(src) || hasServerDirective(src)) return false;
  if (REACT_IMPORT_REGEX.test(src)) return true;
  // Fallback: if we see hooks anywhere (e.g., re-exported), still clientize.
  if (HOOK_REGEX.test(src)) return true;
  return false;
}

function injectUseClient(src) {
  // Preserve top-of-file license/eslint comments if present.
  // If file starts with // or /* */ comment blocks, place directive after them.
  const lines = src.split(/\r?\n/);

  let idx = 0;
  // Skip shebangs (rare in TSX) and blank lines
  while (idx < lines.length && lines[idx].trim() === "") idx++;

  // Skip line comments
  while (idx < lines.length && lines[idx].trim().startsWith("//")) idx++;

  // Skip block comment at very top (/** ... */ or /* ... */)
  if (idx < lines.length && lines[idx].trim().startsWith("/*")) {
    while (idx < lines.length && !lines[idx].includes("*/")) idx++;
    if (idx < lines.length) idx++; // move past the closing */
    // Skip any blank lines after the block
    while (idx < lines.length && lines[idx].trim() === "") idx++;
  }

  const prefix = lines.slice(0, idx).join("\n");
  const rest = lines.slice(idx).join("\n");
  const injected = `${prefix}${prefix ? "\n" : ""}"use client";\n\n${rest}`;
  return injected;
}

async function main() {
  const files = await listTsxFiles(TARGET_DIR);
  let changed = 0;

  for (const file of files) {
    let src = await fs.readFile(file, "utf8");
    if (shouldClientize(src)) {
      const updated = injectUseClient(src);
      if (updated !== src) {
        await fs.writeFile(file, updated, "utf8");
        changed++;
        console.log(`clientized: ${path.relative(ROOT, file)}`);
      }
    }
  }

  console.log(`Clientization done. Files updated: ${changed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

