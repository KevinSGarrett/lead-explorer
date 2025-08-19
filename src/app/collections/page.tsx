// src/app/collections/page.tsx
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
          <Link key={c.collection} href={`/collections/${encodeURIComponent(c.collection)}`}
            className="block border border-gold/60 rounded-xl p-4 hover:bg-gold hover:text-black transition">
            <div className="text-lg font-semibold">{c.collection}</div>
            {c?.meta?.note && <div className="text-sm opacity-80">{c.meta.note}</div>}
          </Link>
        ))}
      </div>
    </main>
  );
}
