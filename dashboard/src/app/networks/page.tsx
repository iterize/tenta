"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { NavigationBar } from "@/components/custom/navigation-bar";
import { NetworkCard } from "@/components/custom/network-card";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { IconTopologyComplex } from "@tabler/icons-react";
import { useNetworks } from "@/requests/networks";

export default function Page() {
  const { userData, userDataIsloading } = useUser();

  const networksData = useNetworks(userData);

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
          {networksData === undefined && "..."}
          {networksData?.map((network) => (
            <NetworkCard
              key={network.identifier}
              networkName={network.name}
              networkIdentifier={network.identifier}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
