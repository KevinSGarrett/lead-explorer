import * as React from "react";
import Link from "next/link";

type Row = Record<string, unknown>;
type DirectusItemResponse<T> = { data: T };
type RouteParams = { slug: string; id: string };

const DIRECTUS_URL =
  process.env.NEXT_PUBLIC_DIRECTUS_URL ??
  process.env.DIRECTUS_URL ??
  "http://localhost:8055";

async function fetchItem(slug: string, id: string): Promise<Row> {
  const url = `${DIRECTUS_URL}/items/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${slug}/${id} (${res.status})`);
  const json = (await res.json()) as DirectusItemResponse<Row>;
  return json.data;
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug, id } = await params;

  const item = await fetchItem(slug, id);

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {slug} / <span className="text-muted-foreground">{id}</span>
        </h1>
        <div className="flex gap-3 text-sm">
          <Link href={`/collections/${encodeURIComponent(slug)}`} className="underline underline-offset-2">
            Back to list
          </Link>
          <Link href="/collections" className="underline underline-offset-2">
            All collections
          </Link>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(item).map(([key, value]) => (
          <div key={key} className="border rounded-lg p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{key}</div>
            <div className="mt-1 text-sm break-words">{renderValue(value)}</div>
          </div>
        ))}
      </section>
    </main>
  );
}

function renderValue(v: unknown): React.ReactNode {
  if (v == null) return <span className="text-muted-foreground">—</span>;
  if (Array.isArray(v)) return <span>{v.map((x) => stringifySafe(x)).join(", ")}</span>;
  if (typeof v === "object") {
    try {
      return <code className="text-xs">{JSON.stringify(v, null, 2)}</code>;
    } catch {
      return <span className="text-muted-foreground">[object]</span>;
    }
  }
  return <span>{String(v)}</span>;
}

function stringifySafe(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return "[object]";
    }
  }
  return String(v);
}

