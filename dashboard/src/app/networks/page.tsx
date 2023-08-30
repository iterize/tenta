"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { Button } from "@/components/ui/button";
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
    <main className="flex items-center justify-center w-screen h-screen">
      <div className="flex flex-col items-center justify-center">
        <div>Networks</div>
        <Button className="mt-2" onClick={logoutUser}>
          {"Logout"}
        </Button>
      </div>
    </main>
  );
}
