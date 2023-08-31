"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect, usePathname } from "next/navigation";

import { IconSettings } from "@tabler/icons-react";
import { IconMessage2 } from "@tabler/icons-react";
import { IconChartDots } from "@tabler/icons-react";

import Link from "next/link";

export default function Page(props: {
  children: React.ReactNode;
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  const { userData, userDataIsloading } = useUser();

  const sensorsData = useSensors(
    props.params.networkIdentifier,
    userData?.accessToken
  );

  if (userDataIsloading) {
    return <AuthLoadingScreen />;
  } else if (userData === undefined) {
    redirect("/login");
  }

  const sensor = sensorsData?.find(
    (sensor) => sensor.identifier === props.params.sensorIdentifier
  );

  if (sensor === undefined) {
    return "unknown sensor id";
  }

  const pathname = usePathname();

  return (
    <div className="flex flex-col items-center justify-start w-full h-full p-3 overflow-x-hidden overflow-y-scroll">
      <div className="w-full mb-4 h-9">
        <div className="flex flex-row items-center justify-start w-full h-full gap-x-2">
          <Link
            href={`/networks/${props.params.networkIdentifier}/sensors/${props.params.sensorIdentifier}/configurations`}
            className={
              "flex items-center justify-center rounded w-9 h-9 " +
              (pathname.endsWith("configurations")
                ? "bg-rose-500"
                : "bg-slate-300")
            }
          >
            <IconSettings
              className={
                "w-6 " +
                (pathname.endsWith("configurations")
                  ? "text-rose-50"
                  : "text-white")
              }
            />{" "}
          </Link>
          <Link
            href={`/networks/${props.params.networkIdentifier}/sensors/${props.params.sensorIdentifier}/logs`}
            className={
              "flex items-center justify-center rounded w-9 h-9 " +
              (pathname.endsWith("logs") ? "bg-rose-500" : "bg-slate-300")
            }
          >
            <IconMessage2
              className={
                "w-6 " +
                (pathname.endsWith("logs") ? "text-rose-50" : "text-white")
              }
            />{" "}
          </Link>
          <Link
            href={`/networks/${props.params.networkIdentifier}/sensors/${props.params.sensorIdentifier}/measurements`}
            className={
              "flex items-center justify-center rounded w-9 h-9 " +
              (pathname.endsWith("measurements")
                ? "bg-rose-500"
                : "bg-slate-300")
            }
          >
            <IconChartDots
              className={
                "w-6 " +
                (pathname.endsWith("measurements")
                  ? "text-rose-50"
                  : "text-white")
              }
            />{" "}
          </Link>
          <span>
            <span className="font-semibold">
              {pathname.split("/").pop()?.toUpperCase()}
            </span>{" "}
            of sensor <span className="font-semibold">{sensor.name}</span> (
            {sensor.identifier})
          </span>
        </div>
      </div>
      <div className="w-full">{props.children}</div>
    </div>
  );
}
