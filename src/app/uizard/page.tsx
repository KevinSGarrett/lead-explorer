"use client";
import Link from "next/link";

const items = [
  "BusinessDetail",
  "CollectionsList",
  "ExportModal",
  "Login2FA",
  "SortableTable",
];

export default function UizardIndex() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Uizard Previews</h1>
      <ul className="list-disc pl-5 space-y-1">
        {items.map((name) => (
          <li key={name}>
            <Link className="underline" href={`/uizard/${name}`}>{name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
