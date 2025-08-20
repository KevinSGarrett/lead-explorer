'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Input } from './input';
import { Button } from './button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

const GOLD = '#d4af37';

type Props<TData extends Record<string, any>> = {
  title?: string;
  /** raw rows from Directus */
  data: TData[];
  /** which keys to show as columns (strings only) */
  columnKeys: string[];
  /** collection slug so we can render the “Open” link */
  slug: string;
};

export default function DataGrid<TData extends Record<string, any>>({
  title,
  data,
  columnKeys,
  slug,
}: Props<TData>) {
  const [sorting, setSorting] = React.useState<any>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  // Build the column defs **on the client** (allowed to contain functions)
  const columns = React.useMemo<ColumnDef<TData, any>[]>(() => {
    const fieldCols: ColumnDef<TData, any>[] = columnKeys.map((key) => ({
      header: key,
      accessorKey: key,
      cell: ({ getValue }) => {
        const v = getValue();
        return typeof v === 'object' ? JSON.stringify(v) : String(v ?? '');
      },
    }));

    return [
      {
        header: 'View',
        cell: ({ row }) => (
          <Link
            href={`/collections/${encodeURIComponent(slug)}/${encodeURIComponent(row.original?.id ?? '')}`}
            className="underline"
            style={{ color: GOLD }}
          >
            Open
          </Link>
        ),
      },
      ...fieldCols,
    ];
  }, [columnKeys, slug]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold" style={{ color: GOLD }}>
          {title ?? 'Data'}
        </h2>
        <Input
          placeholder="Search…"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs bg-black/40 border"
          style={{ borderColor: GOLD, color: 'white' }}
        />
      </div>

      <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: GOLD }}>
        <Table className="[&_th]:bg-background [&_td]:bg-background">
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-white">
                    {header.isPlaceholder ? null : (
                      <button
                        className="hover:underline"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' ▲',
                          desc: ' ▼',
                        }[header.column.getIsSorted() as string] ?? null}
                      </button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-white/90">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="text-center text-white/60">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          style={{ borderColor: GOLD, color: GOLD, background: 'transparent' }}
        >
          Prev
        </Button>
        <div className="text-white/70 text-sm">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </div>
        <Button
          variant="outline"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          style={{ borderColor: GOLD, color: GOLD, background: 'transparent' }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

