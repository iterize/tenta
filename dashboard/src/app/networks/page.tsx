"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { NavigationBar } from "@/components/custom/navigation-bar";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";

export default function Page() {
  const { userData, userDataIsloading, logoutUser } = useUser();

  if (userDataIsloading) {
    return <AuthLoadingScreen />;
  } else if (userData === undefined) {
    redirect("/login");
  }

  return (
    <main className="w-screen min-h-screen">
      <NavigationBar />
      <div className="flex flex-col items-center justify-center">
        <div>Networks</div>
      </div>
    </main>
  );
}
