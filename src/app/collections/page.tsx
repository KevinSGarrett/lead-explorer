import client from '@/lib/directus';
import { readCollections } from '@directus/sdk';
import Link from 'next/link';

const isCore = (name: string) => name.startsWith('directus_');

export default async function CollectionsPage() {
  const collections = await client.request(readCollections());
  const list = collections
    .map((c: any) => c.collection as string)
    .filter((n) => !isCore(n))
    .sort();

  return (
    <main className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-3xl font-bold text-gold mb-6">Collections</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((name) => (
          <Link
            key={name}
            href={`/collections/${encodeURIComponent(name)}`}
            className="card p-5 shadow-soft transition-colors hover:bg-gold/10"
          >
            <div className="text-lg font-semibold">{name}</div>
            <div className="text-foreground/60 text-sm mt-1">Click to view rows</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
