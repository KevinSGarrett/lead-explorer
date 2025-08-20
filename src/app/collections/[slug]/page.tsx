import client from '@/lib/directus';
import { readItems } from '@directus/sdk';
import DataGrid from '@/components/ui/DataGrid';
import Link from 'next/link';

type Props = { params: Promise<{ slug: string }> }; // Next 15 dynamic params must be awaited
const GOLD = '#d4af37';

export default async function CollectionDetail({ params }: Props) {
  const { slug } = await params;

  let rows: any[] = [];
  try {
    rows = await client.request(readItems(slug, { limit: 200 }));
  } catch {
    rows = []; // non-readable/system collections safely show empty
  }

  // Dynamic columns from data sample
  const sample = rows[0] ?? {};
  const fieldCols = Object.keys(sample).slice(0, 12).map((key) => ({
    header: key,
    accessorKey: key,
    cell: ({ getValue }: any) => {
      const v = getValue();
      return typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
    },
  }));

  // Prepend a "View" column linking to detail page
  const columns: any[] = [
    {
      header: 'View',
      cell: ({ row }: any) => (
        <Link
          href={`/collections/${encodeURIComponent(slug)}/${encodeURIComponent(row.original.id ?? '')}`}
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
        <h1 className="text-3xl font-bold" style={{ color: GOLD }}>
          {slug}
        </h1>
        <Link
          href="/collections"
          className="px-4 py-2 rounded-full border hover:bg-[#d4af37]/10"
          style={{ borderColor: GOLD, color: GOLD }}
        >
          ← Back
        </Link>
      </div>

      <DataGrid columns={columns} data={rows} title={`${slug} (first 200)`} />
    </main>
  );
}
