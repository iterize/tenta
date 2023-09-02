"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { useNetworks } from "@/requests/networks";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect, usePathname } from "next/navigation";
import {
  IconSquareChevronLeftFilled,
  IconSquareChevronRightFilled,
} from "@tabler/icons-react";
import { IconAppsFilled } from "@tabler/icons-react";
import Link from "next/link";

export default function NetworkPageLayout(props: {
  children: React.ReactNode;
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  const { userData, userDataIsloading, logoutUser } = useUser();

  const networksData = useNetworks(userData?.accessToken, logoutUser);
  const sensorsData = useSensors(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier
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
        <Link href="/">
          <IconSquareChevronLeftFilled className="w-12 h-12 p-3.5 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border-r border-slate-100 hover:border-slate-300" />
        </Link>
        <Link href={`/networks/${props.params.networkIdentifier}`}>
          <h1 className="flex flex-row items-baseline px-2 m-0 font-regular">
            <div>
              {network ? (
                <span>
                  <span className="font-bold">{network.name}</span> network{" "}
                  <span className="font-mono text-xs opacity-60">
                    ({network.identifier})
                  </span>
                </span>
              ) : (
                "..."
              )}
            </div>
          </h1>
        </Link>
      </div>
      <div className="grid grid-cols-3 h-[calc(100vh-6rem)] grid-rows-1">
        <div className="w-full h-full overflow-hidden border-r border-slate-300">
          {sensorsData === undefined && "..."}
          {sensorsData !== undefined && (
            <>
              <div className="flex items-center justify-center w-full h-10 text-sm font-medium text-center border-b text-emerald-800 bg-emerald-200 border-slate-300">
                <span>
                  <span className="font-bold text-emerald-900">
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
        <div className="col-span-2">{props.children}</div>
      </div>
    </>
  );
}

function SensorListItem(props: {
  networkIdentifier: string;
  sensorName: string;
  sensorIdentifier: string;
}) {
  const pathname = usePathname();
  const isActive = pathname.includes(`/sensors/${props.sensorIdentifier}`);

  let currentlyActiveLabel = pathname.split("/").pop();
  if (
    currentlyActiveLabel === undefined ||
    !["configurations", "measurements", "logs"].includes(currentlyActiveLabel)
  ) {
    currentlyActiveLabel = "configurations";
  }

  return (
    <div className="border-b border-slate-300 group">
      <div
        className={
          "flex flex-col border-slate-600 " +
          (isActive
            ? "bg-slate-50 border-r-4"
            : "hover:bg-sky-100 hover:text-sky-900")
        }
      >
        <Link
          href={`/networks/${props.networkIdentifier}/sensors/${props.sensorIdentifier}/${currentlyActiveLabel}`}
          className={isActive ? "cursor-default" : "cursor-pointer"}
        >
          <div
            className={
              "flex flex-row items-center justify-start w-full h-12 px-3 gap-x-1 "
            }
          >
            <div
              className={
                isActive
                  ? "text-slate-950"
                  : "text-slate-500 group-hover:text-sky-900"
              }
            >
              <span className="font-bold">{props.sensorName}</span>{" "}
              <span className="font-mono text-xs opacity-60">
                ({props.sensorIdentifier})
              </span>
            </div>
          </div>
        </Link>
        {isActive && (
          <div className="grid grid-cols-3 grid-rows-1 text-sm text-center border-t divide-x border-slate-200 divide-slate-200">
            <SensorListItemLink
              networkIdentifier={props.networkIdentifier}
              sensorIdentifier={props.sensorIdentifier}
              label="configurations"
            />
            <SensorListItemLink
              networkIdentifier={props.networkIdentifier}
              sensorIdentifier={props.sensorIdentifier}
              label="measurements"
            />
            <SensorListItemLink
              networkIdentifier={props.networkIdentifier}
              sensorIdentifier={props.sensorIdentifier}
              label="logs"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SensorListItemLink(props: {
  networkIdentifier: string;
  sensorIdentifier: string;
  label: "configurations" | "measurements" | "logs";
}) {
  const pathname = usePathname();
  const isActive = pathname.includes(
    `/sensors/${props.sensorIdentifier}/${props.label}`
  );

  return (
    <Link
      href={`/networks/${props.networkIdentifier}/sensors/${props.sensorIdentifier}/${props.label}`}
      className={
        isActive
          ? "bg-slate-250 text-slate-950"
          : "bg-slate-100 hover:bg-sky-100 hover:text-sky-900 text-slate-500"
      }
    >
      <div className="flex flex-row items-center justify-center h-8 px-3 gap-x-1.5 font-medium text-[0.8rem]">
        <span>
          {props.label.slice(0, 1).toUpperCase()}
          {props.label.slice(1)}
        </span>
      </div>
    </Link>
  );
}
