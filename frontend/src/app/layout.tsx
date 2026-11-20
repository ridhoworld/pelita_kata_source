import type { Metadata } from "next";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const serif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Pelita Kata — Jurnalisme Warga, Literasi & Liputan Mendalam",
    template: "%s | Pelita Kata",
  },
  description:
    "Publikasi artikel jurnalistik gratis, non-komersial, tanpa paywall dan tanpa iklan mengganggu. Fokus pada isu lokal, literasi, opini publik, dan liputan mendalam.",
  alternates: {
    types: {
      "application/rss+xml": `${SITE_URL}/rss.xml`,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Pelita Kata",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Pelita Kata",
    url: SITE_URL,
    inLanguage: "id-ID",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/cari?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Pelita Kata",
    url: SITE_URL,
  };

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('pk_theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');var fs=localStorage.getItem('pk_font_size');if(fs)document.documentElement.style.setProperty('--reading-size',fs);}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        {process.env.NEXT_PUBLIC_UMAMI_URL && process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <script
            defer
            src={process.env.NEXT_PUBLIC_UMAMI_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
      </head>
      <body className={`${sans.variable} ${serif.variable} antialiased min-h-screen flex flex-col`}>
        <a
          href="#konten-utama"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[var(--accent)] focus:text-white focus:px-4 focus:py-2 focus:rounded"
        >
          Lompat ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
