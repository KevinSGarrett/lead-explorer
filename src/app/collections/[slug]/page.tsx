// app/collections/[slug]/page.tsx
import client from "@/lib/directus";
import { readItems } from "@directus/sdk";

interface Props {
  params: { slug: string };
}

export default async function CollectionDetail({ params }: Props) {
  const rows = await client.request(readItems(params.slug, { limit: 20 }));

  return (
    <main className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-3xl font-bold text-gold mb-6">{params.slug}</h1>
      <table className="min-w-full border border-gold text-left">
        <thead className="bg-gold text-black">
          <tr>
            {rows.length > 0 &&
              Object.keys(rows[0]).map((key) => (
                <th key={key} className="px-4 py-2">{key}</th>
              ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row: any) => (
            <tr key={row.id} className="border-t border-gold hover:bg-gold hover:text-black">
              {Object.values(row).map((val: any, i: number) => (
                <td key={i} className="px-4 py-2">{String(val)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

