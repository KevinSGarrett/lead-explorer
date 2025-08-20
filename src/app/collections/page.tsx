import client from '@/lib/directus';
import { readCollections } from '@directus/sdk';
import Link from 'next/link';

const GOLD = '#d4af37';
const isCore = (name: string) => name.startsWith('directus_');

export default async function CollectionsPage() {
  const collections = await client.request(readCollections());
  const list = collections
    .map((c: any) => c.collection as string)
    .filter((n) => !isCore(n))
    .sort();

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: GOLD }}>
        Collections
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((name) => (
          <Link
            key={name}
            href={`/collections/${encodeURIComponent(name)}`}
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
