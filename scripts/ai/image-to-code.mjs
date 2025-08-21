import fs from "node:fs";
import path from "node:path";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20240620";

const INPUT_DIR = "design/uizard";
const OUT_DIR = "generated/uizard";

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
}

function toPascalCase(name) {
  return name
    .replace(/\.[^.]+$/, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(s => s[0].toUpperCase() + s.slice(1))
    .join("");
}

function extractCodeTSX(text) {
  // Try to extract a fenced TSX/JSX block; otherwise return the whole text.
  const match = text.match(/```(?:t|j)sx?\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : text.trim();
}

function writeTSX(outPath, componentName, tsx) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const file = `// Auto-generated from Uizard PNG via AI
/* eslint-disable @next/next/no-img-element */
${tsx.includes("export default") ? tsx : `export default function ${componentName}(){\n${tsx}\n}`}\n`;
  fs.writeFileSync(outPath, file, "utf8");
  console.log("Wrote", outPath);
}

async function openaiImageToCode({ b64, mime, componentName }) {
  const body = {
    model: OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a senior frontend engineer. Generate clean, accessible React + Tailwind code (TSX) for Next.js App Router. No external UI libs. Prefer semantic HTML. Keep styles Tailwind-only. Return only code in one fenced block."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Generate a single file React component named "${componentName}" that reproduces the UI layout from the image.
- Use Tailwind classes, responsive where obvious.
- Provide placeholder data for tables/lists.
- Self-contained; export default the component.
- Do NOT import images.`
          },
          { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } }
        ]
      }
    ],
    temperature: 0.2
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content || "";
  return extractCodeTSX(text);
}

async function anthropicImageToCode({ b64, mime, componentName }) {
  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: 4000,
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Generate a single file React component named "${componentName}" that reproduces the UI layout from the image.
- Use Tailwind classes; no external UI libs.
- Provide placeholder data where needed.
- Self-contained; export default the component.
Return ONLY code in a single fenced block.`
          },
          { type: "image", source: { type: "base64", media_type: mime, data: b64 } }
        ]
      }
    ]
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json();
  const text = (json.content || []).map(p => p.text).join("\n");
  return extractCodeTSX(text);
}

async function main() {
  const images = listImages(INPUT_DIR);
  if (!images.length) {
    console.log("No Uizard exports found in", INPUT_DIR);
    return;
  }

  const provider = OPENAI_API_KEY ? "openai" : ANTHROPIC_API_KEY ? "anthropic" : "stub";
  console.log("Image-to-code provider:", provider);

  for (const file of images) {
    const p = path.join(INPUT_DIR, file);
    const buf = fs.readFileSync(p);
    const b64 = buf.toString("base64");
    const ext = path.extname(file).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".webp"
        ? "image/webp"
        : "application/octet-stream";
    const componentName = toPascalCase(path.basename(file));
    const outPath = path.join(OUT_DIR, `${componentName}.tsx`);

    try {
      let tsx;
      if (provider === "openai") {
        tsx = await openaiImageToCode({ b64, mime, componentName });
      } else if (provider === "anthropic") {
        tsx = await anthropicImageToCode({ b64, mime, componentName });
      } else {
        tsx = `  return (
    <main className="p-6">
      <div className="text-sm text-muted-foreground">Stub for ${componentName}. Add API key to generate real code.</div>
      <div className="mt-4 border rounded-lg p-6 bg-white">
        <p className="font-medium">Replace this with AI-generated layout for <code>${file}</code>.</p>
      </div>
    </main>
  );`;
      }
      writeTSX(outPath, componentName, tsx);
    } catch (e) {
      console.error("Failed to generate", file, e?.message || e);
      writeTSX(
        outPath,
        componentName,
        `  return <div className="p-6 text-red-600">Generation failed for ${file}</div>;`
      );
    }
  }
}

await main();

