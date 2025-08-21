// src/components/directus/DataGridPro.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Primitive = string | number | boolean | null;
type Json = Primitive | Json[] | { [key: string]: Json };

export type FieldKind =
  | "string"
  | "text"
  | "integer"
  | "float"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "timestamp"
  | "json"
  | "file"
  | "relation";

export interface ColumnMeta {
  key: string;
  label?: string;
  kind?: FieldKind;
  // For relations/files we can specify how to show
  relationDisplayKey?: string;
}

export interface DataGridProProps<T extends Record<string, unknown>> {
  rows: T[];
  columns: ColumnMeta[];
  className?: string;
  pageSize?: number;
}

function formatDate(v: unknown) {
  if (!v) return "";
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
}

function BooleanPill({ value }: { value: boolean | null | undefined }) {
  const truthy = value === true;
  const falsy = value === false;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
        truthy && "bg-emerald-100 text-emerald-800",
        falsy && "bg-rose-100 text-rose-800",
        value == null && "bg-gray-100 text-gray-700"
      )}
    >
      {truthy ? "True" : falsy ? "False" : "—"}
    </span>
  );
}

function FileThumb({ value }: { value: unknown }) {
  if (!value) return <span className="text-gray-500">—</span>;
  // Directus file could be an object or an id; render minimally without assumptions.
  if (typeof value === "string") return <span className="truncate">{value}</span>;
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    const filename = (v.filename_download || v.filename || v.title || v.id) as string | undefined;
    return <span className="truncate">{filename ?? "[file]"}</span>;
  }
  return <span className="truncate">{String(value)}</span>;
}

function RelationChip({ value, displayKey }: { value: unknown; displayKey?: string }) {
  if (!value) return <span className="text-gray-500">—</span>;
  const many = Array.isArray(value) ? value : [value];
  return (
    <span className="flex flex-wrap gap-1">
      {many.map((item, i) => {
        const label =
          (displayKey && typeof item === "object" && item && (item as any)[displayKey]) ||
          (typeof item === "object" && item && ((item as any).title || (item as any).name || (item as any).id)) ||
          String(item);
        return (
          <span
            key={i}
            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-800"
            title={String(label)}
          >
            {String(label)}
          </span>
        );
      })}
    </span>
  );
}

function renderCell(kind: FieldKind | undefined, v: unknown, col: ColumnMeta) {
  switch (kind) {
    case "boolean":
      return <BooleanPill value={typeof v === "boolean" ? v : null} />;
    case "date":
    case "datetime":
    case "timestamp":
      return <span>{formatDate(v)}</span>;
    case "json":
      return <code className="text-xs">{v ? JSON.stringify(v) : "—"}</code>;
    case "file":
      return <FileThumb value={v} />;
    case "relation":
      return <RelationChip value={v} displayKey={col.relationDisplayKey} />;
    default:
      return <span className="truncate">{v == null || v === "" ? "—" : String(v)}</span>;
  }
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

export function DataGridPro<T extends Record<string, unknown>>({
  rows,
  columns,
  className,
  pageSize = 25,
}: DataGridProProps<T>) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortState>(null);
  const [page, setPage] = React.useState(0);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => {
        const v = r[c.key] as unknown;
        if (v == null) return false;
        try {
          const s =
            typeof v === "string"
              ? v
              : typeof v === "number" || typeof v === "boolean"
              ? String(v)
              : JSON.stringify(v);
          return s.toLowerCase().includes(q);
        } catch {
          return false;
        }
      })
    );
  }, [rows, columns, query]);

  const sorted = React.useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = a[key] as unknown;
      const vb = b[key] as unknown;
      const sa = va == null ? "" : typeof va === "string" ? va : JSON.stringify(va);
      const sb = vb == null ? "" : typeof vb === "string" ? vb : JSON.stringify(vb);
      return dir === "asc" ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
    return copy;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = React.useMemo(() => {
    const start = page * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  React.useEffect(() => {
    // Reset to page 0 on new filter/sort
    setPage(0);
  }, [query, sort]);

  function toggleSort(key: string) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter…"
          className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring"
        />
        <div className="text-sm text-slate-600">
          {filtered.length} match{filtered.length === 1 ? "" : "es"}
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              {columns.map((c) => {
                const isActive = sort?.key === c.key;
                const arrow =
                  isActive ? (sort?.dir === "asc" ? " ▲" : " ▼") : "";
                return (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    className="cursor-pointer whitespace-nowrap px-3 py-2 text-left font-semibold"
                    title={`Sort by ${c.label || c.key}`}
                  >
                    {(c.label || c.key) + arrow}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-center text-slate-500" colSpan={columns.length}>
                  No rows
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr key={i} className="even:bg-white odd:bg-slate-50/50">
                  {columns.map((c) => (
                    <td key={c.key} className="max-w-[320px] px-3 py-2">
                      {renderCell(c.kind, row[c.key] as unknown, c)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          className="rounded-md border border-slate-300 px-2.5 py-1 text-sm disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Prev
        </button>
        <span className="text-sm">
          Page {page + 1} / {totalPages}
        </span>
        <button
          className="rounded-md border border-slate-300 px-2.5 py-1 text-sm disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page + 1 >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

