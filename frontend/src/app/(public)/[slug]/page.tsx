import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContactForm from "@/components/ContactForm";
import { formatDateWIB, publicFetch } from "@/lib/api";
import type { StaticPage } from "@/lib/types";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await publicFetch<StaticPage>(`/pages/${slug}`);
  if (!res?.data) return { title: "Halaman Tidak Ditemukan" };
  return {
    title: res.data.title,
  };
}

export default async function StaticContentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await publicFetch<StaticPage>(`/pages/${slug}`);
  if (!res?.data) notFound();

  const page = res.data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <header className="border-b-2 border-[var(--ink)] pb-4 mb-8 space-y-2">
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold">{page.title}</h1>
        {page.updated_at && (
          <p className="text-xs text-[var(--ink-muted)]">
            Diperbarui terakhir: {formatDateWIB(page.updated_at)}
          </p>
        )}
      </header>

      <div
        className="article-prose"
        dangerouslySetInnerHTML={{ __html: page.content_html }}
      />

      {page.slug === "kontak" && <ContactForm />}
    </div>
  );
}

