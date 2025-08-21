"use client";

import * as React from "react";

export type KeyOf<T extends Record<string, unknown>> = Extract<keyof T, string>;

export type ColumnDef<T extends Record<string, unknown>> = {
  /** Key in row to display (string because rows may be Record<string, unknown>) */
  key: KeyOf<T> | string;
  /** Column header label */
  header: string;
  /** Optional custom cell renderer */
  render?: (value: unknown, row: T) => React.ReactNode;
};

export type DataGridProps<T extends Record<string, unknown>> = {
  /** Rows to render */
  rows: T[];
  /** Optional explicit columns. If omitted, columns are inferred from the first row's keys */
  columns?: Array<ColumnDef<T>>;
  /** Optional row key extractor (defaults to index) */
  getRowKey?: (row: T, index: number) => string;
  /** Optional empty-state message */
  emptyMessage?: string;
  /** Optional className for outer wrapper */
  className?: string;
};

function inferColumns<T extends Record<string, unknown>>(rows: T[]): Array<ColumnDef<T>> {
  const first = rows[0];
  if (!first) return [];
  const keys = Object.keys(first) as Array<KeyOf<T>>;
  return keys.map((k) => ({ key: k, header: String(k) }));
}

export function DataGrid<T extends Record<string, unknown>>(props: DataGridProps<T>) {
  const {
    rows,
    columns: explicitColumns,
    getRowKey,
    emptyMessage = "No data",
    className,
  } = props;

  const columns = React.useMemo(
    () => explicitColumns ?? inferColumns(rows),
    [explicitColumns, rows]
  );

  if (!rows.length) {
    return (
      <div className={className}>
        <div className="text-sm text-muted-foreground border rounded-md p-6">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="w-full overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} className="text-left font-medium px-3 py-2 whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rowKey = getRowKey ? getRowKey(row, idx) : String(idx);
              return (
                <tr key={rowKey} className="border-t hover:bg-muted/20">
                  {columns.map((col) => {
                    const value: unknown =
                      typeof col.key === "string" ? (row as Record<string, unknown>)[col.key] : row[col.key];
                    return (
                      <td key={String(col.key)} className="px-3 py-2 align-top">
                        {col.render ? col.render(value, row) : renderCell(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderCell(value: unknown): React.ReactNode {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  if (Array.isArray(value)) {
    return <span>{value.map((v) => stringifySafe(v)).join(", ")}</span>;
  }
  if (typeof value === "object") {
    try {
      return <code className="text-xs">{JSON.stringify(value)}</code>;
    } catch {
      return <span className="text-muted-foreground">[object]</span>;
    }
  }
  return <span>{String(value)}</span>;
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

export default DataGrid;

