import type { Metadata } from "next";
import { CmsAuthProvider } from "@/components/cms/CmsAuthContext";
import CmsShell from "@/components/cms/CmsShell";

export const metadata: Metadata = {
  title: "CMS Redaksi",
  robots: { index: false, follow: false },
};

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CmsAuthProvider>
      <CmsShell>{children}</CmsShell>
    </CmsAuthProvider>
  );
}

