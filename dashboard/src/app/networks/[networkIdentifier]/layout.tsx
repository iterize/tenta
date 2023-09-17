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
import { truncate } from "lodash";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";

export default function NetworkPageLayout(props: {
  children: React.ReactNode;
  params: { networkIdentifier: string };
}) {
  const { userData, userDataIsloading, logoutUser } = useUser();

  const { networksData } = useNetworks(userData?.accessToken, logoutUser);
  const { sensorsData, createSensor, updateSensor } = useSensors(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier
  );

  const router = useRouter();
  const pathname = usePathname();

  const [currentSensorIdentifier, setCurrentSensorIdentifier] = useState<
    string | undefined
  >(undefined);
  const [currentActivityValue, setCurrentActivityValue] = useState<
    "activity" | "plots" | "configurations" | "measurements" | "logs"
  >("activity");

  useEffect(() => {
    if (pathname.split("/").length > 4) {
      setCurrentSensorIdentifier(pathname.split("/")[4] as any);
      setCurrentActivityValue(pathname.split("/")[5] as any);
    }
  }, [pathname]);

  if (userDataIsloading) {
    return <AuthLoadingScreen />;
  } else if (userData === undefined) {
    redirect("/login");
  }

  const network = networksData?.find(
    (network) => network.identifier === props.params.networkIdentifier
  );

  let currentlyActiveLabel: string;
  if (
    !["activity", "plots", "configurations", "measurements", "logs"].includes(
      pathname.split("/").pop() ?? ""
    )
  ) {
    currentlyActiveLabel = "activity";
  } else {
    currentlyActiveLabel = pathname.split("/").pop() ?? "";
  }

  return (
    <>
      <div className="flex flex-row items-center justify-start w-full h-16 overflow-hidden border-b md:h-12 border-slate-300 bg-slate-100">
        <Link href="/">
          <IconSquareChevronLeftFilled className="w-12 h-16 md:h-12 p-3.5 hover:bg-slate-200 text-slate-800 hover:text-slate-950 border-r border-slate-100 hover:border-slate-300" />
        </Link>
        <Link href={`/networks/${props.params.networkIdentifier}`}>
          <div className="flex flex-row items-baseline px-2 m-0 font-regular">
            {network ? (
              <div className="flex flex-col items-baseline md:flex-row gap-x-2">
                <div>
                  <span className="font-bold">
                    {truncate(network.name, { length: 32 })}
                  </span>{" "}
                  <span className="flex-shrink-0">network</span>
                </div>
                <span className="font-mono text-xs opacity-60">
                  ({network.identifier})
                </span>
              </div>
            ) : (
              "..."
            )}
          </div>
        </Link>
      </div>
      <div className="lg:grid lg:grid-cols-3 h-[calc(100vh-7rem)] lg:h-[calc(100vh-6rem)] bg-slate-50">
        <div className="hidden w-full h-full overflow-hidden border-r border-slate-300 lg:block">
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
                    currentlyActiveLabel={currentlyActiveLabel}
                  />
                ))}
                <div className="flex justify-center w-full p-3">
                  <CreationDialog
                    action="create"
                    label="sensor"
                    submit={createSensor}
                    onSuccess={(newSensorIdentifier: string) => {
                      router.push(
                        `/networks/${props.params.networkIdentifier}/sensors/${newSensorIdentifier}/activity`
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

        <div className="flex justify-center w-full col-span-2 p-2 bg-white lg:hidden">
          {sensorsData !== undefined && (
            <Select
              value={currentSensorIdentifier}
              onValueChange={(newSensorIdentifier: string) => {
                router.push(
                  `/networks/${props.params.networkIdentifier}/sensors/${newSensorIdentifier}/${currentActivityValue}`
                );
              }}
            >
              <SelectTrigger className="w-full h-14">
                <SelectValue placeholder="Select a sensor" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Sensors</SelectLabel>
                  {sensorsData.map((sensor) => (
                    <SelectItem value={sensor.identifier}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{sensor.name}</span>
                        <span className="font-mono text-xs text-slate-500">
                          {sensor.identifier}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>

        {currentSensorIdentifier !== undefined && (
          <div className="flex justify-center w-full col-span-2 px-2 py-1 -mt-2 bg-white lg:hidden">
            <Tabs
              defaultValue="activity"
              value={currentActivityValue}
              className="w-full"
              onValueChange={(newValue) => {
                setCurrentActivityValue(newValue as any);
                router.push(
                  `/networks/${props.params.networkIdentifier}/sensors/${currentSensorIdentifier}/${newValue}`
                );
              }}
            >
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="activity">
                  <div className="flex flex-row items-center gap-x-1">
                    <IconActivityHeartbeat
                      size={14}
                      className="max-[480px]:hidden"
                    />
                    Activity
                  </div>
                </TabsTrigger>
                <TabsTrigger value="configurations">
                  <div className="flex flex-row items-center gap-x-1">
                    <IconChartHistogram
                      size={14}
                      className="max-[480px]:hidden"
                    />
                    Configs
                  </div>
                </TabsTrigger>
                <TabsTrigger value="plots">
                  <div className="flex flex-row items-center gap-x-1">
                    <IconAdjustmentsFilled
                      size={14}
                      className="max-[480px]:hidden"
                    />
                    Plots
                  </div>
                </TabsTrigger>
                <TabsTrigger value="measurements">
                  <div className="flex flex-row items-center gap-x-1">
                    <IconDatabaseSearch
                      size={14}
                      className="max-[480px]:hidden"
                    />
                    Data
                  </div>
                </TabsTrigger>
                <TabsTrigger value="logs">
                  <div className="flex flex-row items-center gap-x-1">
                    <IconDatabaseExclamation
                      size={14}
                      className="max-[480px]:hidden"
                    />
                    Logs
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        <div className="block w-full h-px lg:hidden bg-slate-300" />

        <div className="col-span-2 lg:min-h-0 ">{props.children}</div>
      </div>
    </>
  );
}

function SensorListItem(props: {
  networkIdentifier: string;
  sensorName: string;
  sensorIdentifier: string;
  updateSensor: (name: string) => Promise<void>;
  currentlyActiveLabel: string;
}) {
  const pathname = usePathname();
  const isActive = pathname.includes(`/sensors/${props.sensorIdentifier}`);

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
          href={`/networks/${props.networkIdentifier}/sensors/${props.sensorIdentifier}/${props.currentlyActiveLabel}`}
          className={isActive ? "cursor-default" : "cursor-pointer"}
        >
          <div
            className={
              "flex flex-row items-center justify-start w-full h-16 px-3 gap-x-1 "
            }
          >
            <div
              className={
                "w-full flex flex-col items-baseline gap-x-2 " +
                (isActive
                  ? "text-slate-950"
                  : "text-slate-500 group-hover:text-blue-900")
              }
            >
              <div className="flex flex-row items-center w-full gap-x-1">
                <div className="font-bold">{props.sensorName}</div>{" "}
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
              <div className="font-mono text-xs opacity-60">
                ({props.sensorIdentifier})
              </div>
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
        <div className="hidden xl:block">{renderedIcon}</div>
        {renderedLabel}
      </div>
    </Link>
  );
}
