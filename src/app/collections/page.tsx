import * as React from "react";
import Link from "next/link";

type CollectionSummary = {
  collection: string;
  meta?: {
    icon?: string | null;
    note?: string | null;
    display_template?: string | null;
  } | null;
  schema?: unknown;
};

type DirectusListResponse<T> = {
  data: T[];
};

const DIRECTUS_URL =
  process.env.NEXT_PUBLIC_DIRECTUS_URL ??
  process.env.DIRECTUS_URL ??
  "http://localhost:8055";

/** Fetch all collections from Directus */
async function fetchCollections(): Promise<CollectionSummary[]> {
  const res = await fetch(`${DIRECTUS_URL}/collections`, {
    // App Router: server component fetch; avoid caching for freshness while iterating
    cache: "no-store",
    headers: {
      // If you need auth, inject a token through env and add: Authorization: `Bearer ${TOKEN}`
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to load collections (${res.status})`);
  }
  const json = (await res.json()) as DirectusListResponse<CollectionSummary>;
  return json.data;
}

export default async function CollectionsPage() {
  const collections = await fetchCollections();

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Collections</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collections.map((c) => (
          <Link
            key={c.collection}
            href={`/collections/${encodeURIComponent(c.collection)}`}
            className="border rounded-lg p-4 hover:shadow-sm transition"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-md border flex items-center justify-center text-xs">
                {c.meta?.icon ?? "📦"}
              </div>
              <div>
                <div className="font-medium">{c.collection}</div>
                {c.meta?.note ? (
                  <div className="text-xs text-muted-foreground line-clamp-2">{c.meta.note}</div>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!collections.length && (
        <p className="text-muted-foreground">No collections found.</p>
      )}
    </main>
  );
}

