import { Suspense } from "react";
import { CatalogClient } from "./CatalogClient";

export const metadata = { title: "Catalog, Sandbox Portal" };

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="wrap py-20 text-center text-faint">Loading catalog…</div>}>
      <CatalogClient />
    </Suspense>
  );
}
