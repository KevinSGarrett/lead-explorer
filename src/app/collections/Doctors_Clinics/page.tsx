// src/app/collections/Doctors_Clinics/page.tsx
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

  const columns = [];

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
                    <Link href={`/collections/${encodeURIComponent(slug)}/${encodeURIComponent(row.id)}`}>
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
