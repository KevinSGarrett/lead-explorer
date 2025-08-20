import client from '@/lib/directus';
import { readItem } from '@directus/sdk';
import Link from 'next/link';

type Props = { params: Promise<{ slug: string; id: string }> };
const GOLD = '#d4af37';

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
        <h1 className="text-3xl font-bold" style={{ color: GOLD }}>
          {slug} / {id}
        </h1>
        <Link
          href={`/collections/${encodeURIComponent(slug)}`}
          className="px-4 py-2 rounded-full border hover:bg-[#d4af37]/10"
          style={{ borderColor: GOLD, color: GOLD }}
        >
          ← Back to {slug}
        </Link>
      </div>

      {!data ? (
        <div className="text-white/70">No data found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data).map(([key, value]) => (
            <div
              key={key}
              className="rounded-2xl border p-4 bg-black"
              style={{ borderColor: GOLD }}
            >
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
