"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { Button } from "@/components/ui/button";
import { useConfigurations } from "@/requests/configurations";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Page(props: {
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  const { userData, userDataIsloading } = useUser();

  const sensorsData = useSensors(
    userData?.accessToken,
    props.params.networkIdentifier
  );

  const configurationsData = useConfigurations(
    userData?.accessToken,
    props.params.networkIdentifier,
    props.params.sensorIdentifier
  );

  console.log({
    at: userData?.accessToken,
    cd: configurationsData,
  });

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
      <div className="flex flex-row justify-end w-full">
        <Button>New Revision</Button>
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
    receiptTimestamp: number | null;
    success: boolean | null;
  };
}) {
  return (
    <div className="flex flex-col w-full overflow-hidden bg-white border rounded shadow-md border-slate-300">
      <div className="flex flex-row items-start justify-start p-3 border-b gap-x-4 border-slate-200">
        <div className="flex items-center flex-shrink-0 h-6 px-2 text-sm font-semibold text-blue-900 bg-blue-200 rounded">
          Revision {props.configuration.revision}
        </div>
        <div className="flex flex-col w-full">
          <div className="grid flex-grow w-full h-1.5 grid-cols-4 my-2 rounded-full  relative">
            <div
              className="absolute -translate-x-1/2 w-2.5 h-2.5 rounded-full -top-[0.125rem] bg-emerald-800 "
              style={{
                left:
                  props.configuration.creationTimestamp === null
                    ? "0%"
                    : props.configuration.publicationTimestamp === null
                    ? "25%"
                    : props.configuration.receiptTimestamp === null
                    ? "50%"
                    : props.configuration.acknowledgmentTimestamp === null
                    ? "75%"
                    : "100%",
              }}
            />
            <div
              className={
                "w-full h-full rounded-l-full border-r-[2.5px] border-emerald-700 " +
                (props.configuration.creationTimestamp !== null
                  ? "bg-emerald-400"
                  : "bg-slate-200")
              }
            />
            <div
              className={
                "w-full h-full border-r-[2.5px] border-emerald-700 " +
                (props.configuration.publicationTimestamp !== null
                  ? "bg-emerald-400"
                  : "bg-slate-200")
              }
            />
            <div
              className={
                "w-full h-full border-r-[2.5px] border-emerald-700 " +
                (props.configuration.receiptTimestamp !== null
                  ? "bg-emerald-400"
                  : "bg-slate-200")
              }
            />
            <div
              className={
                "w-full h-full rounded-r-full " +
                (props.configuration.acknowledgmentTimestamp !== null
                  ? "bg-emerald-400"
                  : "bg-slate-200")
              }
            />
          </div>
          <div className="grid flex-grow w-full grid-cols-4 -mt-1 text-xs">
            <TimestepLabel
              label="created"
              timestamp={props.configuration.creationTimestamp}
            />
            <TimestepLabel
              label="published"
              timestamp={props.configuration.publicationTimestamp}
            />
            <TimestepLabel
              label="received"
              timestamp={props.configuration.receiptTimestamp}
            />
            <TimestepLabel
              label="acknowledged"
              timestamp={props.configuration.acknowledgmentTimestamp}
            />
          </div>
        </div>
      </div>
      <div className="p-3 font-mono text-xs leading-tight whitespace-pre bg-slate-100 text-slate-600">
        {JSON.stringify(props.configuration.value, null, 2)}
      </div>
    </div>
  );
}

function TimestepLabel(props: {
  label: "created" | "received" | "published" | "acknowledged";
  timestamp: number | null;
}) {
  if (props.timestamp === null) {
    return (
      <div className="pl-1">
        not{" "}
        <span className="font-semibold text-emerald-800">{props.label}</span>{" "}
        yet
      </div>
    );
  } else {
    return (
      <div className="pl-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="font-semibold text-emerald-900">
                {props.label}
              </span>{" "}
              {formatDistanceToNow(new Date(props.timestamp * 1000), {
                addSuffix: true,
              })}
            </TooltipTrigger>
            <TooltipContent>
              <p>{new Date(props.timestamp * 1000).toISOString()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
}
