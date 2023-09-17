"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { useNetworks } from "@/requests/networks";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect, usePathname, useRouter } from "next/navigation";
import {
  IconActivityHeartbeat,
  IconAdjustmentsFilled,
  IconChartHistogram,
  IconDatabaseExclamation,
  IconDatabaseSearch,
  IconEdit,
  IconSquareChevronLeftFilled,
} from "@tabler/icons-react";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreationDialog } from "@/components/custom/creation-dialog";

export default function NetworkPageLayout(props: {
  children: React.ReactNode;
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  const { userData, userDataIsloading, logoutUser } = useUser();

  const { networksData } = useNetworks(userData?.accessToken, logoutUser);
  const { sensorsData, createSensor, updateSensor } = useSensors(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier
  );

  const router = useRouter();

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
              <div className="h-[calc(100%-2.5rem)] overflow-y-scroll">
                {sensorsData.map((sensor) => (
                  <SensorListItem
                    key={sensor.identifier}
                    networkIdentifier={props.params.networkIdentifier}
                    sensorName={sensor.name}
                    sensorIdentifier={sensor.identifier}
                    updateSensor={async (newSensorName: string) => {
                      await updateSensor(sensor.identifier, newSensorName);
                    }}
                  />
                ))}
                <div className="flex justify-center w-full p-3">
                  <CreationDialog
                    action="create"
                    label="sensor"
                    submit={createSensor}
                    onSuccess={(newIdentifier: string) => {
                      router.push(
                        `/networks/${props.params.networkIdentifier}/sensors/${newIdentifier}/activity`
                      );
                    }}
                  >
                    <Button>
                      <IconPlus width={16} className="mr-1.5 -ml-0.5" /> New
                      Sensor
                    </Button>
                  </CreationDialog>
                </div>
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
  updateSensor: (name: string) => Promise<void>;
}) {
  const pathname = usePathname();
  const isActive = pathname.includes(`/sensors/${props.sensorIdentifier}`);

  let currentlyActiveLabel = pathname.split("/").pop();
  if (
    currentlyActiveLabel === undefined ||
    !["activity", "plots", "configurations", "measurements", "logs"].includes(
      currentlyActiveLabel
    )
  ) {
    currentlyActiveLabel = "activity";
  }

  return (
    <div className="border-b border-slate-300 group">
      <div
        className={
          "flex flex-col border-r-4 " +
          (isActive
            ? "bg-slate-50 border-slate-600 "
            : "hover:bg-blue-100 hover:text-blue-900 border-transparent")
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
                "w-full flex flex-row items-baseline gap-x-2 " +
                (isActive
                  ? "text-slate-950"
                  : "text-slate-500 group-hover:text-blue-900")
              }
            >
              <div className="font-bold">{props.sensorName}</div>{" "}
              <div className="font-mono text-xs opacity-60">
                ({props.sensorIdentifier})
              </div>
              <div className="flex-grow" />
              {isActive && (
                <CreationDialog
                  action="update"
                  label="sensor"
                  submit={props.updateSensor}
                  previousValue={props.sensorName}
                >
                  <button className="p-2 rounded-md hover:bg-blue-150 hover:text-blue-950">
                    <IconEdit size={16} />
                  </button>
                </CreationDialog>
              )}
            </div>
          </div>
        </Link>
        {isActive && (
          <div className="grid grid-cols-5 grid-rows-1 text-sm text-center border-t divide-x border-slate-200 divide-slate-200">
            {[
              "activity",
              "plots",
              "configurations",
              "measurements",
              "logs",
            ].map((label: any) => (
              <SensorListItemLink
                key={label}
                networkIdentifier={props.networkIdentifier}
                sensorIdentifier={props.sensorIdentifier}
                label={label}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SensorListItemLink(props: {
  networkIdentifier: string;
  sensorIdentifier: string;
  label: "activity" | "plots" | "configurations" | "measurements" | "logs";
}) {
  const pathname = usePathname();
  const isActive =
    pathname ==
    `/networks/${props.networkIdentifier}/sensors/${props.sensorIdentifier}/${props.label}`;

  let renderedLabel: string;
  let renderedIcon: JSX.Element;
  let activeColor: string;
  switch (props.label) {
    case "activity":
      renderedLabel = "Activity";
      renderedIcon = (
        <IconActivityHeartbeat
          size={12}
          className={isActive ? "text-rose-600" : "text-slate-600"}
        />
      );
      activeColor = "bg-rose-50 text-rose-800";
      break;
    case "plots":
      renderedLabel = "Plots";
      renderedIcon = (
        <IconChartHistogram
          size={12}
          className={isActive ? "text-orange-600" : "text-slate-600"}
        />
      );
      activeColor = "bg-orange-50 text-orange-800";
      break;
    case "configurations":
      renderedLabel = "Configs";
      renderedIcon = (
        <IconAdjustmentsFilled
          size={12}
          className={isActive ? "text-sky-600" : "text-slate-600"}
        />
      );
      activeColor = "bg-sky-50 text-sky-800";
      break;
    case "measurements":
      renderedLabel = "Data";
      renderedIcon = (
        <IconDatabaseSearch
          size={12}
          className={isActive ? "text-emerald-600" : "text-slate-600"}
        />
      );
      activeColor = "bg-emerald-50 text-emerald-800";
      break;
    case "logs":
      renderedLabel = "Logs";
      renderedIcon = (
        <IconDatabaseExclamation
          size={12}
          className={isActive ? "text-yellow-600" : "text-slate-600"}
        />
      );
      activeColor = "bg-yellow-50 text-yellow-800";
      break;
  }

  return (
    <Link
      href={`/networks/${props.networkIdentifier}/sensors/${props.sensorIdentifier}/${props.label}`}
      className={
        isActive
          ? activeColor
          : "bg-slate-100 hover:bg-slate-50 hover:text-slate-900 text-slate-500"
      }
    >
      <div className="flex flex-row items-center justify-center h-8 px-3 gap-x-1.5 font-medium text-xs">
        {renderedIcon}
        {renderedLabel}
      </div>
    </Link>
  );
}
