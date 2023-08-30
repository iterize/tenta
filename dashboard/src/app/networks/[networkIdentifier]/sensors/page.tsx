"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { NavigationBar } from "@/components/custom/navigation-bar";
import { useNetworks } from "@/requests/networks";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { IconSquareChevronLeftFilled } from "@tabler/icons-react";
import { IconAppsFilled } from "@tabler/icons-react";
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
    <>
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
      <div className="grid grid-cols-3 h-[calc(100vh-6rem)] grid-rows-1">
        <div className="w-full h-full overflow-hidden border-r border-slate-300">
          {sensorsData === undefined && "..."}
          {sensorsData !== undefined && (
            <>
              <div className="flex items-center justify-center w-full h-10 text-sm font-medium text-center text-teal-800 bg-teal-200 border-b border-slate-300">
                <span>
                  <span className="font-bold text-teal-900">
                    {sensorsData.length}
                  </span>{" "}
                  sensor
                </span>
                {sensorsData.length === 1 ? "" : "s"}
                <button className="w-10 h-10 p-2.5 cursor-pointer opacity-70 hover:opacity-100">
                  <IconAppsFilled className="w-full h-full" />
                </button>
              </div>
              <div className="h-[calc(100%-2.5rem)] overflow-y-scroll">
                {sensorsData.map((sensor) => (
                  <SensorListItem
                    key={sensor.identifier}
                    networkIdentifier={props.params.networkIdentifier}
                    sensorName={sensor.name}
                    sensorIdentifier={sensor.identifier}
                  />
                ))}{" "}
              </div>
            </>
          )}
        </div>
        <div className="col-span-2 p-3">col2</div>
      </div>
    </>
  );
}

function SensorListItem(props: {
  networkIdentifier: string;
  sensorName: string;
  sensorIdentifier: string;
}) {
  return (
    <Link
      href={`/networks/${props.networkIdentifier}/sensors/${props.sensorIdentifier}`}
    >
      <div className="w-full p-3 border-b border-slate-200 hover:bg-sky-100 hover:text-sky-950">
        <span>
          <span className="font-bold">{props.sensorName}</span>{" "}
          <span className="text-xs">({props.sensorIdentifier})</span>
        </span>
      </div>
    </Link>
  );
}
