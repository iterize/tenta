import "./globals.css";
import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { SWRProvider } from "@/app/swr-provider";
import { NavigationBar } from "@/components/custom/navigation-bar";
import { Toaster } from "react-hot-toast";

const rubik = Rubik({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://someridiculousdomaintogetridofthaterror.com"),
  title: "Tenta Dashboard",
  description: "Remote and real-time management of distributed sensor networks",
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: "https://github.com/iterize/tenta",
    title: "Tenta Dashboard",
    description:
      "Remote and real-time management of distributed sensor networks",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta property="og:image" content="/tenta-favicon-1024.png" />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="1024" />
        <meta property="og:image:alt" content="Tenta Dashboard Favicon" />
        <meta property="og:image" content="/tenta-dashboard-og-1024-512.png" />
        <meta property="og:image:width" content="1024" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:alt" content="Tenta Dashboard Banner" />
        <meta property="og:image" content="/tenta-dashboard-og-1200-630.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Tenta Dashboard Banner" />
      </head>
      <body className={rubik.className}>
        <SWRProvider>
          <main className="flex flex-col w-screen min-h-screen">
            <NavigationBar />
            {children}
            <Toaster position="bottom-right" reverseOrder={false} />
          </main>
        </SWRProvider>
      </body>
    </html>
  );
}
