"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { Button } from "@/components/ui/button";
import { useConfigurations } from "@/requests/configurations";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { TimestampLabel } from "@/components/custom/timestamp-label";
import { IconAdjustmentsFilled, IconPlus } from "@tabler/icons-react";
import { ConfigRevisionTag } from "@/components/custom/config-revision-tag";

export default function Page(props: {
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  const { userData, userDataIsloading, logoutUser } = useUser();

  const sensorsData = useSensors(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier
  );

  const configurationsData = useConfigurations(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier,
    props.params.sensorIdentifier
  );

  if (userDataIsloading || configurationsData === undefined) {
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

  return (
    <>
      <div className="flex flex-row items-center w-full pb-4 text-base font-medium border-b text-slate-900 gap-x-2 border-slate-300">
        <IconAdjustmentsFilled className="p-1.5 bg-blue-500 rounded text-blue-50 w-7 h-7" />{" "}
        <h1>Sensor Node Configurations</h1>
      </div>
      <div className="flex flex-row justify-start w-full">
        <Button>
          <IconPlus width={16} className="mr-1.5 -ml-0.5" />
          New Revision
        </Button>
      </div>
      {configurationsData.map((configuration) => (
        <ConfigurationBox
          key={configuration.revision}
          configuration={configuration}
        />
      ))}
    </>
  );
}

function ConfigurationBox(props: {
  configuration: {
    value: {};
    revision: number;
    creationTimestamp: number | null;
    publicationTimestamp: number | null;
    acknowledgmentTimestamp: number | null;
    success: boolean | null;
  };
}) {
  return (
    <div className="flex flex-col flex-shrink-0 w-full overflow-hidden bg-white border rounded-lg shadow-md border-slate-300">
      <div className="flex flex-row items-start justify-start p-3 border-b gap-x-3 border-slate-200">
        <ConfigRevisionTag revision={props.configuration.revision} />
        <div className="flex flex-col w-full">
          <div className="grid flex-grow w-full h-1.5 grid-cols-3 my-2 rounded-full  relative">
            <div
              className="absolute -translate-x-1/2 w-2.5 h-2.5 rounded-full -top-[0.125rem] bg-emerald-600 "
              style={{
                left:
                  props.configuration.creationTimestamp === null
                    ? "0%"
                    : props.configuration.publicationTimestamp === null
                    ? "33.33333%"
                    : props.configuration.acknowledgmentTimestamp === null
                    ? "66.66666%"
                    : "100%",
              }}
            />
            <div
              className={
                "w-full h-full rounded-l-full border-r-[2.5px] border-emerald-600 " +
                (props.configuration.creationTimestamp !== null
                  ? "bg-emerald-300"
                  : "bg-slate-200")
              }
            />
            <div
              className={
                "w-full h-full border-r-[2.5px] border-emerald-600 " +
                (props.configuration.publicationTimestamp !== null
                  ? "bg-emerald-300"
                  : "bg-slate-200")
              }
            />

            <div
              className={
                "w-full h-full rounded-r-full " +
                (props.configuration.acknowledgmentTimestamp !== null
                  ? "bg-emerald-300"
                  : "bg-slate-200")
              }
            />
          </div>
          <div className="grid flex-grow w-full grid-cols-3 -mt-1 text-xs">
            <TimestampLabel
              label="created"
              timestamp={props.configuration.creationTimestamp}
              labelClassName="font-semibold text-emerald-800"
            />
            <TimestampLabel
              label="published"
              timestamp={props.configuration.publicationTimestamp}
              labelClassName="font-semibold text-emerald-800"
            />
            <TimestampLabel
              label="acknowledged"
              timestamp={props.configuration.acknowledgmentTimestamp}
              labelClassName="font-semibold text-emerald-800"
            />
          </div>
        </div>
      </div>
      <div className="p-3 font-mono text-xs leading-tight whitespace-pre bg-slate-50 text-slate-500">
        {JSON.stringify(props.configuration.value, null, 2)}
      </div>
    </div>
  );
}
