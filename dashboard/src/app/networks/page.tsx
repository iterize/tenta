"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { NavigationBar } from "@/components/custom/navigation-bar";
import { NetworkCard } from "@/components/custom/network-card";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { IconTopologyComplex } from "@tabler/icons-react";

export default function Page() {
  const { userData, userDataIsloading } = useUser();

  if (userDataIsloading) {
    return <AuthLoadingScreen />;
  } else if (userData === undefined) {
    redirect("/login");
  }

  return (
    <main className="flex flex-col w-screen min-h-screen">
      <NavigationBar />
      <div className="flex flex-col items-center flex-grow p-8 bg-slate-50">
        <h1 className="flex flex-row items-center mb-4 text-2xl font-bold gap-x-1 text-slate-800">
          Networks
        </h1>
        <div className="grid w-full max-w-4xl grid-cols-2 gap-4">
          <NetworkCard
            networkName="Mainnet"
            networkIdentifier="575a7328-4e2e-4b88-afcc-e0b5ed3920cc"
          />
          <NetworkCard
            networkName="Testnet"
            networkIdentifier="2d1d2c9e-2b3a-4b4c-8c1c-5f1d9d7d3d6f"
          />
        </div>
      </div>
    </main>
  );
}
