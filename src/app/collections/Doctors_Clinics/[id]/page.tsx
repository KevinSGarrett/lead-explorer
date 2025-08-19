// src/app/collections/Doctors_Clinics/[id]/page.tsx
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
        <Link href={`/collections/${encodeURIComponent(slug)}`} className="underline hover:text-gold">← Back to table</Link>
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
