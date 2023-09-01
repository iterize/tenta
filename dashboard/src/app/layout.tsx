import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SWRProvider } from "@/app/swr-provider";
import { NavigationBar } from "@/components/custom/navigation-bar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tenta Dashboard",
  description: "Remote and real-time management of distributed sensor networks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SWRProvider>
          <main className="flex flex-col w-screen min-h-screen">
            <NavigationBar />
            {children}
          </main>
        </SWRProvider>
      </body>
    </html>
  );
}
