import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import fs from "fs/promises";
import path from "path";
import { execSync } from "node:child_process";

// === Config ===
const DIRECTUS_URL   = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL;
const DIRECTUS_TOKEN = process.env.DIRECTUS_STATIC_TOKEN || process.env.DIRECTUS_TOKEN;
const USE_ANTHROPIC  = (process.env.USE_ANTHROPIC ?? "0") !== "0"; // currently ignored, OpenAI-only

if (!DIRECTUS_URL || !DIRECTUS_TOKEN) {
  console.error("❌ Missing DIRECTUS_URL or DIRECTUS_TOKEN in .env.local");
  process.exit(1);
}

const GOLD = "#d4af37";
const isCore = (name) => name.startsWith("directus_");

// Utilities
async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }
async function writeIfMissing(file, contents) {
  try { await fs.access(file); return false; } catch {}
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, contents, "utf8");
  return true;
}
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${DIRECTUS_TOKEN}` },
    ...opts,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${res.status} ${res.statusText} for ${url}\n${t}`);
  }
  return res.json();
}

// Page templates
const collectionsPage = `import client from '@/lib/directus';
import { readCollections } from '@directus/sdk';
import Link from 'next/link';

const GOLD = '${GOLD}';
const isCore = (name: string) => name.startsWith('directus_');

export default async function CollectionsPage() {
  const collections = await client.request(readCollections());
  const list = collections
    .map((c: any) => c.collection as string)
    .filter((n) => !isCore(n))
    .sort();

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: GOLD }}>Collections</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((name) => (
          <Link
            key={name}
            href={\`/collections/\${encodeURIComponent(name)}\`}
            className="block p-5 rounded-2xl border transition-colors hover:bg-[#d4af37]/10"
            style={{ borderColor: GOLD }}
          >
            <div className="text-lg font-semibold">{name}</div>
            <div className="text-white/60 text-sm mt-1">Click to view rows</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
`;

const collectionDetailPage = `import client from '@/lib/directus';
import { readItems } from '@directus/sdk';
import DataGrid from '@/components/ui/DataGrid';
import Link from 'next/link';

type Props = { params: Promise<{ slug: string }> };
const GOLD = '${GOLD}';

export default async function CollectionDetail({ params }: Props) {
  const { slug } = await params;

  let rows: any[] = [];
  try {
    rows = await client.request(readItems(slug, { limit: 200 }));
  } catch {
    rows = [];
  }

  const sample = rows[0] ?? {};
  const fieldCols = Object.keys(sample).slice(0, 12).map((key) => ({
    header: key,
    accessorKey: key,
    cell: ({ getValue }: any) => {
      const v = getValue();
      return typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
    },
  }));

  const columns: any[] = [
    {
      header: 'View',
      cell: ({ row }: any) => (
        <Link
          href={\`/collections/\${encodeURIComponent(slug)}/\${encodeURIComponent(row.original.id ?? '')}\`}
          className="underline"
          style={{ color: GOLD }}
        >
          Open
        </Link>
      ),
    },
    ...fieldCols,
  ];

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: GOLD }}>{slug}</h1>
        <Link href="/collections" className="px-4 py-2 rounded-full border hover:bg-[#d4af37]/10" style={{ borderColor: GOLD, color: GOLD }}>
          ← Back
        </Link>
      </div>
      <DataGrid columns={columns} data={rows} title={\`\${slug} (first 200)\`} />
    </main>
  );
}
`;

const recordDetailPage = `import client from '@/lib/directus';
import { readItem } from '@directus/sdk';
import Link from 'next/link';

type Props = { params: Promise<{ slug: string; id: string }> };
const GOLD = '${GOLD}';

export default async function RecordDetail({ params }: Props) {
  const { slug, id } = await params;

  let data: any = null;
  try {
    data = await client.request(readItem(slug, id));
  } catch {
    data = null;
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ color: GOLD }}>{slug} / {id}</h1>
        <Link href={\`/collections/\${encodeURIComponent(slug)}\`} className="px-4 py-2 rounded-full border hover:bg-[#d4af37]/10" style={{ borderColor: GOLD, color: GOLD }}>
          ← Back to {slug}
        </Link>
      </div>

      {!data ? (
        <div className="text-white/70">No data found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="rounded-2xl border p-4 bg-black" style={{ borderColor: GOLD }}>
              <div className="text-sm uppercase tracking-wide text-white/60">{key}</div>
              <div className="mt-1 text-base">
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '')}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
`;

// Main
async function main() {
  console.log("🚀 Auto-build: reading Directus schema…");
  const colRes = await fetchJSON(`${DIRECTUS_URL}/collections`);
  const userCollections = (colRes.data || [])
    .map((c) => c.collection)
    .filter((n) => !isCore(n));

  // Ensure the page shells exist (idempotent)
  const wroteIndex = await writeIfMissing("src/app/collections/page.tsx", collectionsPage);
  for (const col of userCollections) {
    const detailPath = `src/app/collections/[slug]/page.tsx`;
    const recordPath = `src/app/collections/[slug]/[id]/page.tsx`;
    await writeIfMissing(detailPath, collectionDetailPage);
    await writeIfMissing(recordPath, recordDetailPage);
    console.log(`✅ ${col}: pages present`);
  }

  // Git add/commit/push if a remote exists
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
    execSync("git add -A", { stdio: "inherit" });
    try {
      execSync('git commit -m "autobuild: ensure pages present"', { stdio: "inherit" });
    } catch {
      // no changes
    }
    // push only if origin exists
    try {
      execSync("git remote get-url origin", { stdio: "ignore" });
      execSync("git push -u origin main", { stdio: "inherit" });
    } catch {
      console.log("ℹ️ No remote 'origin' configured — skipping push.");
    }
  } catch {
    console.log("ℹ️ Not a git repo — skipping commit/push.");
  }

  console.log("🎉 Auto-build complete.");
}

main().catch((e) => {
  console.error("💥 Auto-build error:", e);
  process.exit(1);
});
