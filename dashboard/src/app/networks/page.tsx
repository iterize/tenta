"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { NavigationBar } from "@/components/custom/navigation-bar";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { useNetworks } from "@/requests/networks";
import { useSensors } from "@/requests/sensors";
import Link from "next/link";

export default function Page() {
  const { userData, userDataIsloading } = useUser();

  const networksData = useNetworks(userData?.accessToken);

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
              accessToken={userData.accessToken}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export function NetworkCard(props: {
  networkName: string;
  networkIdentifier: string;
  accessToken: string;
}) {
  const sensorsData = useSensors(props.networkIdentifier, props.accessToken);

  return (
    <Link
      href={`/networks/${props.networkIdentifier}/sensors`}
      className="group"
    >
      <div className="flex flex-col w-full overflow-hidden bg-white border rounded-lg shadow group-hover:bg-slate-50 border-slate-300 group-hover:shadow-md group-hover:border-slate-400">
        <h2 className="flex flex-row items-baseline px-3 pt-2 pb-1 m-0 text-lg font-bold border-b border-slate-200">
          <div>{props.networkName}</div>
          <div className="flex-grow" />
          <div className="px-1 text-sm font-medium text-teal-800 bg-teal-200 rounded">
            {sensorsData === undefined && "..."}
            {sensorsData !== undefined && (
              <>
                <span className="font-bold text-teal-900">
                  {sensorsData.length}
                </span>{" "}
                sensor
                {sensorsData.length === 1 ? "" : "s"}
              </>
            )}
          </div>
        </h2>
        <div className="flex flex-col w-full p-3">
          <p className="text-xs">identifier: {props.networkIdentifier}</p>
        </div>
      </div>
    </Link>
  );
}
