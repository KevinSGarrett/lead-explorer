import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { exec as _exec } from 'child_process';
import { promisify } from 'util';

const exec = promisify(_exec);

// ---------- CONFIG ----------
const DIRECTUS_URL = process.env.DIRECTUS_URL || process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://3.85.34.51:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN || process.env.DIRECTUS_STATIC_TOKEN || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20240620';
const ROOT = process.cwd();
// ----------------------------

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function ensureDir(p){ await fs.mkdir(p,{recursive:true}); }
async function writeFileIfDiff(file, content){
  try{
    const cur = await fs.readFile(file,'utf8');
    if(cur === content) return false;
  }catch{}
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, content, 'utf8');
  return true;
}

async function fetchJSON(url){
  const res = await fetch(url, {
    headers: DIRECTUS_TOKEN ? { Authorization: `Bearer ${DIRECTUS_TOKEN}` } : {}
  });
  if(!res.ok){ throw new Error(`${res.status} ${res.statusText} for ${url}`); }
  return res.json();
}

function systemCollections(name){
  return name.startsWith('directus_');
}

function baseDirectusClient(){
  return `// src/lib/directus.ts
import { createDirectus, rest, staticToken } from '@directus/sdk';

const URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || '${DIRECTUS_URL}';
const TOKEN = process.env.DIRECTUS_STATIC_TOKEN || '${DIRECTUS_TOKEN}';

const client = createDirectus(URL).with(rest()).with(staticToken(TOKEN));
export default client;
`;
}

function goldUtilities(){
  return `/* gold helpers */
.text-gold { color: #D4AF37; }
.bg-gold { background-color: #D4AF37; }
.border-gold { border-color: #D4AF37; }`;
}

function collectionsListPage(){
  return `// src/app/collections/page.tsx
import client from '@/lib/directus';
import { readCollections } from '@directus/sdk';
import Link from 'next/link';

export default async function CollectionsPage(){
  const collections = await client.request(readCollections());
  const user = collections.filter((c: any) => !c?.meta?.system && !String(c.collection).startsWith('directus_'));

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-gold mb-6">Collections</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {user.map((c:any)=>(
          <Link key={c.collection} href={\`/collections/\${encodeURIComponent(c.collection)}\`}
            className="block border border-gold/60 rounded-xl p-4 hover:bg-gold hover:text-black transition">
            <div className="text-lg font-semibold">{c.collection}</div>
            {c?.meta?.note && <div className="text-sm opacity-80">{c.meta.note}</div>}
          </Link>
        ))}
      </div>
    </main>
  );
}
`;
}

function fallbackCollectionPage(slug, columns){
  const cols = columns.slice(0,12);
  return `// src/app/collections/${slug}/page.tsx
import client from '@/lib/directus';
import { readItems, readFields } from '@directus/sdk';
import Link from 'next/link';

type Props = { params: Promise<{ slug: string }> };

export default async function CollectionDetail({ params }: Props){
  const { slug } = await params;
  const [rows, fields] = await Promise.all([
    client.request(readItems(slug as any, { limit: 50 }) as any),
    client.request(readFields(slug as any) as any),
  ]);

  const columns = ${JSON.stringify(cols)};

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gold">{slug}</h1>
        <Link href="/collections" className="underline hover:text-gold">← Back</Link>
      </div>
      <div className="overflow-auto rounded-xl border border-gold/60">
        <table className="min-w-full text-left">
          <thead className="bg-gold text-black">
            <tr>{columns.map((c) => <th key={c} className="px-4 py-2 whitespace-nowrap">{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row:any)=>(
              <tr key={row.id ?? JSON.stringify(row)} className="border-t border-gold/40 hover:bg-gold hover:text-black transition">
                {columns.map((col)=>(
                  <td key={col} className="px-4 py-2 whitespace-nowrap">
                    <Link href={\`/collections/\${encodeURIComponent(slug)}/\${encodeURIComponent(row.id)}\`}>
                      {row[col] === null || row[col] === undefined
                        ? '—'
                        : typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                    </Link>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
`;
}

function fallbackRecordPage(slug){
  return `// src/app/collections/${slug}/[id]/page.tsx
import client from '@/lib/directus';
import { readItem } from '@directus/sdk';
import Link from 'next/link';

type Props = { params: Promise<{ slug: string; id: string }> };

export default async function RecordDetail({ params }: Props){
  const { slug, id } = await params;
  const record = await client.request(readItem(slug as any, id as any) as any);
  const entries = Object.entries(record ?? {});

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gold">{slug} · {id}</h1>
        <Link href={\`/collections/\${encodeURIComponent(slug)}\`} className="underline hover:text-gold">← Back to table</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {entries.map(([k,v])=>(
          <div key={k} className="rounded-xl border border-gold/60 p-4">
            <div className="text-sm uppercase tracking-wide opacity-70">{k}</div>
            <div className="text-lg">
              {v === null || v === undefined ? '—' : typeof v === 'object'
                ? <pre className="whitespace-pre-wrap break-all">{JSON.stringify(v, null, 2)}</pre>
                : String(v)}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
`;
}

async function aiGenerate(collection, fields, samples){
  const schema = {
    name: collection.collection,
    fields: fields.map(f=>({ field: f.field, type: f.type, interface: f?.meta?.interface }))
  };

  const userMessage = `
Build TWO Next.js 15 app routes for a Directus collection:
- Spreadsheet list: /src/app/collections/${collection.collection}/page.tsx
- Detail page:      /src/app/collections/${collection.collection}/[id]/page.tsx

Requirements:
- Use black background, white text, gold accents (#D4AF37).
- Import client from "@/lib/directus".
- Use "@directus/sdk": readItems, readFields, readItem.
- Next 15 dynamic params are PROMISES; example:
  type Props = { params: Promise<{ slug: string; id?: string }> };
  const { slug, id } = await params;
- Spreadsheet view shows first ~12 visible fields as columns.
- Detail page renders all fields in clean cards.
- Link each row to its detail page.
- No client-side fetch; render on server.
- Return a JSON object with keys "list" and "detail" whose values are the FULL file contents.

Context:
SCHEMA: ${JSON.stringify(schema)}
SAMPLE ROWS (trimmed): ${JSON.stringify(samples?.slice(0,3) ?? [])}
`;

  // 1) OpenAI drafts
  const gpt = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: 'You generate production-grade Next.js files.' },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.2
  });

  let draft;
  try {
    draft = JSON.parse(gpt.choices?.[0]?.message?.content ?? '{}');
  } catch {
    draft = {};
  }

  // 2) Claude reviews/refines
  const claude = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Improve these two files if needed. Return JSON {"list":"...","detail":"..."} ONLY.\n` +
               `FILES JSON:\n${JSON.stringify(draft)}`
    }]
  });

  let finalJSON;
  try {
    finalJSON = JSON.parse(claude.content?.[0]?.text ?? '{}');
  } catch {
    finalJSON = draft;
  }

  return finalJSON;
}

async function main(){
  console.log('🚀 Auto-build: reading Directus schema…');
  const all = await fetchJSON(`${DIRECTUS_URL}/collections`);
  const collections = all.data.filter(c => !c?.meta?.system && !systemCollections(c.collection));

  // Ensure src/app + lib + gold utilities + directus client exist
  await ensureDir(path.join(ROOT, 'src/app/collections'));
  await writeFileIfDiff(path.join(ROOT, 'src/lib/directus.ts'), baseDirectusClient());

  // gold utilities
  const globalsPath = path.join(ROOT, 'src/app/globals.css');
  try{
    const cur = await fs.readFile(globalsPath,'utf8');
    if(!cur.includes('.text-gold')) {
      await fs.writeFile(globalsPath, cur + '\n' + goldUtilities(), 'utf8');
    }
  }catch{
    await ensureDir(path.dirname(globalsPath));
    await fs.writeFile(globalsPath, goldUtilities(), 'utf8');
  }

  // Collections index
  await writeFileIfDiff(path.join(ROOT, 'src/app/collections/page.tsx'), collectionsListPage());

  let changed = false;

  for(const collection of collections){
    const [fieldsRes, itemsRes] = await Promise.all([
      fetchJSON(`${DIRECTUS_URL}/fields/${encodeURIComponent(collection.collection)}`),
      fetchJSON(`${DIRECTUS_URL}/items/${encodeURIComponent(collection.collection)}?limit=3`)
    ]);
    const fields = fieldsRes.data || [];
    const samples = itemsRes.data || [];

    console.log(`🧩 ${collection.collection}: generating with OpenAI + Claude…`);
    let gen = {};
    try{
      gen = await aiGenerate(collection, fields, samples);
    }catch(e){
      console.error('AI generation failed, using fallbacks:', e.message);
    }

    // choose up to 12 visible fields
    const cols = fields.filter((f)=>!f?.meta?.hidden).map(f=>f.field);

    const listPath = path.join(ROOT, `src/app/collections/${collection.collection}/page.tsx`);
    const detailPath = path.join(ROOT, `src/app/collections/${collection.collection}/[id]/page.tsx`);

    const listContent = typeof gen.list === 'string' && gen.list.includes('export default') 
      ? gen.list 
      : fallbackCollectionPage(collection.collection, cols);

    const detailContent = typeof gen.detail === 'string' && gen.detail.includes('export default')
      ? gen.detail
      : fallbackRecordPage(collection.collection);

    const a = await writeFileIfDiff(listPath, listContent);
    const b = await writeFileIfDiff(detailPath, detailContent);
    changed = changed || a || b;

    console.log(`✅ ${collection.collection}: pages ${(a||b)?'written/updated':'already up-to-date'}`);
  }

  // Git commit & push (uses your SSH or PAT config already set up)
  if (changed){
    console.log('📝 Committing & pushing…');
    try{
      await exec('git add .');
      await exec('git commit -m "🤖 Auto-build: regenerate pages from Directus" || true');
      await exec('git push origin main');
      console.log('🚢 Pushed to origin/main');
    }catch(e){
      console.error('⚠️ git push failed:', e.message);
    }
  }else{
    console.log('ℹ️ No changes detected.');
  }

  console.log('🎉 Auto-build complete.');
}

main().catch(e=>{ console.error('💥 Auto-build error:', e); process.exit(1); });
