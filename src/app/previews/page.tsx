import Link from "next/link";

// If you want this to be fully automatic, we can later add a small script that
// scans /generated/uizard and writes a static list; for now, hand-list common ones.
const samples = [
  "BusinessDetail",
  "CollectionsList",
  "ExportModal",
  "Login2FA",
  "SortableTable",
];

export default function PreviewsIndex() {
  return (
    <main className="p-8 space-y-6">
      <h1 className="text-xl font-bold">Uizard Previews</h1>
      <ul className="list-disc pl-6 space-y-2">
        {samples.map((name) => (
          <li key={name}>
            <Link className="underline" href={`/previews/${name}`}>
              {name}
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Components are read from <code>generated/uizard/*.tsx</code>.
      </p>
    </main>
  );
}
