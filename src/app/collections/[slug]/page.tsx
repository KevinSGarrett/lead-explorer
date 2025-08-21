import * as React from "react";
import Link from "next/link";
import DataGrid, { ColumnDef } from "@/components/ui/DataGrid";

type DirectusListResponse<T> = { data: T[] };
type Row = Record<string, unknown>;
type RouteParams = { slug: string };

const DIRECTUS_URL =
  process.env.NEXT_PUBLIC_DIRECTUS_URL ??
  process.env.DIRECTUS_URL ??
  "http://localhost:8055";

async function fetchRows(slug: string): Promise<Row[]> {
  const url = new URL(`${DIRECTUS_URL}/items/${encodeURIComponent(slug)}`);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load rows for ${slug} (${res.status})`);
  const json = (await res.json()) as DirectusListResponse<Row>;
  return json.data;
}

function buildColumns(rows: Row[]): Array<ColumnDef<Row>> {
  const cols = new Set<string>();
  for (const r of rows) {
    Object.keys(r).forEach((k) => cols.add(k));
    if (cols.size >= 12) break;
  }
  return Array.from(cols).map((key) => ({
    key,
    header: key,
    render:
      key === "id"
        ? (value: unknown) =>
            typeof value === "string" || typeof value === "number" ? (
              <Link href={`./${value}`} className="underline underline-offset-2">
                {String(value)}
              </Link>
            ) : (
              String(value ?? "—")
            )
        : undefined,
  }));
}

export default async function CollectionRowsPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;

  const rows = await fetchRows(slug);
  const columns = buildColumns(rows);

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{slug}</h1>
        <Link href="/collections" className="text-sm underline underline-offset-2">
          All collections
        </Link>
      </div>

      <DataGrid<Row>
        rows={rows}
        columns={columns}
        getRowKey={(row: Row, i: number) => {
          const key = (row.id ??
            (row as Record<string, unknown>)._id ??
            (row as Record<string, unknown>).primary ??
            i) as unknown;
          return typeof key === "string" || typeof key === "number" ? String(key) : String(i);
        }}
        emptyMessage="No records found."
        className="mt-2"
      />
    </main>
  );
}

