// Read figma-variables.json and generate CSS variables (light/dark)
// Output: src/styles/tokens.css (create folder if missing)

import { readFile, mkdir, writeFile } from 'node:fs/promises';

function toCssVarName(name) {
  return '--' + String(name).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

async function main() {
  const raw = await readFile('design/tokens/figma-variables.json', 'utf8');
  const data = JSON.parse(raw);

  // Very simple mapper: flattens by variable name; treats "modes" as dark/light if present.
  const vars = data?.variables ?? [];
  const darkModeId = (data?.modes || []).find(m => /dark/i.test(m.name))?.modeId;

  const lightLines = [];
  const darkLines = [];

  for (const v of vars) {
    const name = v?.name || v?.resolvedName || v?.id;
    if (!name) continue;

    const cssName = toCssVarName(name);

    // valueForMode is subject to Figma response shape; fallback to value
    const lightVal = (v?.valuesByMode && Object.values(v.valuesByMode)[0]) ?? v?.value ?? v?.resolvedValue ?? null;
    const darkVal = (darkModeId && v?.valuesByMode?.[darkModeId]) ?? lightVal;

    if (lightVal != null) lightLines.push(`  ${cssName}: ${lightVal};`);
    if (darkVal != null) darkLines.push(`  ${cssName}: ${darkVal};`);
  }

  const css = `:root{\n${lightLines.join('\n')}\n}\n\n.dark{\n${darkLines.join('\n')}\n}\n`;

  await mkdir('src/styles', { recursive: true });
  await writeFile('src/styles/tokens.css', css, 'utf8');
  console.log('Wrote src/styles/tokens.css');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

