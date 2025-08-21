import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

export const dynamic = "force-static"; // simple static listing

export default function Page() {
  const dir = path.join(process.cwd(), "generated/uizard");
  let items: string[] = [];
  try {
    items = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => f.replace(/\.tsx$/, ""));
  } catch (e) {
    items = [];
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Uizard previews</h1>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No generated components found.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((name) => (
            <li key={name} className="border rounded-lg p-3">
              <div className="font-medium">{name}</div>
              <Link className="text-blue-600 underline text-sm" href={`/uizard/${name}`}>
                Open preview →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
