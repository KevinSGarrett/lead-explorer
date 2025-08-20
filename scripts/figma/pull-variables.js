// Fetch Figma Variables and write to design/tokens/figma-variables.json
// Requires FIGMA_TOKEN, FIGMA_FILE_KEY in env

import { writeFile, mkdir } from 'node:fs/promises';

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = process.env.FIGMA_FILE_KEY;

if (!FIGMA_TOKEN || !FILE_KEY) {
  console.error('Missing FIGMA_TOKEN or FIGMA_FILE_KEY');
  process.exit(1);
}

const headers = {
  'X-Figma-Token': FIGMA_TOKEN,
};

async function fetchJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma API ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  const url = `https://api.figma.com/v1/files/${FILE_KEY}/variables`;
  const data = await fetchJson(url);

  await mkdir('design/tokens', { recursive: true });
  await writeFile('design/tokens/figma-variables.json', JSON.stringify(data, null, 2), 'utf8');

  console.log('Wrote design/tokens/figma-variables.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

