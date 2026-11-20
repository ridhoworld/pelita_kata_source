import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { publicFetch } from "@/lib/api";
import type { Category, SiteSettings } from "@/lib/types";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [catRes, setRes] = await Promise.all([
    publicFetch<Category[]>("/categories", { revalidate: 60 }),
    publicFetch<SiteSettings>("/settings", { revalidate: 60 }),
  ]);

  const categories = catRes?.data || [];
  const settings = setRes?.data || {};

  return (
    <>
      <PublicHeader
        categories={categories}
        siteName={settings.site_name || "Pelita Kata"}
        tagline={settings.site_tagline || "Jurnalisme Warga, Literasi, dan Liputan Mendalam"}
      />
      <main id="konten-utama" className="flex-1">
        {children}
      </main>
      <PublicFooter
        categories={categories}
        siteName={settings.site_name || "Pelita Kata"}
        tagline={settings.site_tagline || "Jurnalisme Warga, Literasi, dan Liputan Mendalam"}
      />
    </>
  );
}

