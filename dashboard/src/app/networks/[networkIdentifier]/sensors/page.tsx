"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { NavigationBar } from "@/components/custom/navigation-bar";
import { useNetworks } from "@/requests/networks";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { IconSquareChevronLeftFilled } from "@tabler/icons-react";
import Link from "next/link";

export default function Page(props: { params: { networkIdentifier: string } }) {
  const { userData, userDataIsloading } = useUser();

  const networksData = useNetworks(userData?.accessToken);
  const sensorsData = useSensors(
    props.params.networkIdentifier,
    userData?.accessToken
  );

  if (userDataIsloading) {
    return <AuthLoadingScreen />;
  } else if (userData === undefined) {
    redirect("/login");
  }

  const network = networksData?.find(
    (network) => network.identifier === props.params.networkIdentifier
  );

  return (
    <main className="flex flex-col w-screen min-h-screen">
      <NavigationBar />
      <div className="flex flex-row items-center justify-start w-full h-12 overflow-hidden border-b border-slate-300 bg-slate-100">
        <Link href="/networks">
          <IconSquareChevronLeftFilled className="w-12 h-12 p-3.5 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border-r border-slate-100 hover:border-slate-300" />
        </Link>
        <h1 className="flex flex-row items-baseline px-2 m-0 font-regular">
          <div>
            {network ? (
              <span>
                <span className="font-bold">{network.name}</span> network{" "}
                <span className="text-xs">({network.identifier})</span>
              </span>
            ) : (
              "..."
            )}
          </div>
        </h1>
      </div>
    </main>
  );
}
