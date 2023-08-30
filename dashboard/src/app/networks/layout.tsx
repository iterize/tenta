import { NavigationBar } from "@/components/custom/navigation-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-col w-screen min-h-screen">
      <NavigationBar />
      {children}
    </main>
  );
}
