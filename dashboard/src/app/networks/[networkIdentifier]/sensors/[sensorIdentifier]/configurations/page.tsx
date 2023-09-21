"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { Button } from "@/components/ui/button";
import { useConfigurations } from "@/requests/configurations";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { TimestampLabel } from "@/components/custom/timestamp-label";
import {
  IconAccessPointOff,
  IconAdjustmentsFilled,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconPlus,
} from "@tabler/icons-react";
import { ConfigRevisionTag } from "@/components/custom/config-revision-tag";
import { useState } from "react";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";

export default function Page(props: {
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  const { userData, userDataIsloading, logoutUser } = useUser();

  const { sensorsData } = useSensors(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier
  );

  const { configurationsData, createConfigRevision } = useConfigurations(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier,
    props.params.sensorIdentifier
  );

  const [newConfigValue, setNewConfigValue] = useState<string | undefined>(
    undefined
  );
  const [configIsSubmitting, setConfigIsSubmitting] = useState(false);

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

  function isValidJsonString(str: string) {
    try {
      JSON.parse(str);
      return str.trimStart().startsWith("{");
    } catch (e) {
      return false;
    }
  }

  const configObjectIsValid = isValidJsonString(newConfigValue ?? "");

  async function submitNewConfig() {
    if (newConfigValue === undefined) {
      return;
    }

    if (!configObjectIsValid) {
      toast.error("Invalid config object");
      return;
    }

    setConfigIsSubmitting(true);
    try {
      await toast.promise(createConfigRevision(JSON.parse(newConfigValue)), {
        loading: "Publishing config",
        success: () => {
          setNewConfigValue(undefined);
          return "Successfully published config";
        },
        error: "Could not publish config",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setConfigIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-row items-center justify-start w-full pb-4 text-lg font-normal border-b text-slate-900 gap-x-2 border-slate-300">
        <div className="flex flex-row items-center justify-center">
          <div className="w-8 h-8 p-2 text-white bg-blue-500 rounded-lg">
            <IconAdjustmentsFilled className="w-full h-full" />
          </div>
          <div className="px-3 font-medium text-blue-950">Configurations</div>
        </div>
      </div>
      {newConfigValue === undefined && (
        <div className="flex flex-row justify-start w-full">
          <Button
            onClick={() => {
              setNewConfigValue("");
            }}
          >
            <IconPlus width={16} className="mr-1.5 -ml-0.5" />
            New Revision
          </Button>
        </div>
      )}
      {newConfigValue !== undefined && (
        <div className="flex flex-col items-end w-full p-3 bg-white border rounded-lg shadow border-slate-300 gap-y-2">
          <div className="w-full text-sm font-medium text-left">
            New Configuration Object:
          </div>
          <Textarea
            autoFocus
            value={newConfigValue}
            onChange={(e) => {
              setNewConfigValue(e.target.value);
            }}
            placeholder={
              '{\n    "someValue": 30,\n    "maybeAFirmwareVersion": 1.7.1\n}'
            }
            rows={12}
          />
          <div className="flex flex-col w-full gap-y-1.5 gap-x-2 md:flex-row">
            <div
              className={
                "flex flex-row gap-x-1.5 items-center text-xs font-medium px-3 h-3.5 flex-shrink-0 whitespace-nowrap " +
                (configObjectIsValid ? "text-emerald-600" : "text-red-600")
              }
            >
              {configObjectIsValid ? (
                <IconCircleCheckFilled size={14} />
              ) : (
                <IconCircleXFilled size={14} />
              )}
              Object is {!configObjectIsValid && "not"} a valid JSON object
            </div>
            <div className="flex-grow" />
            <div className="flex flex-row justify-end w-full gap-x-2">
              <Button
                onClick={() => {
                  setNewConfigValue(undefined);
                }}
              >
                Abort
              </Button>
              <Button
                onClick={configIsSubmitting ? () => {} : submitNewConfig}
                variant={configIsSubmitting ? "ghost" : "default"}
              >
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}
      {configurationsData.map((configuration) => (
        <ConfigurationBox
          key={configuration.revision}
          configuration={configuration}
        />
      ))}
      {configurationsData.length === 0 && (
        <div className="w-full mt-2 text-sm text-center text-slate-700">
          no configurations
        </div>
      )}
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
      <div className="flex flex-col items-start justify-start p-3 border-b md:flex-row gap-x-3 border-slate-200">
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
          <div className="grid flex-grow w-full grid-cols-3 -mt-1 text-[0.65rem]">
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

function NewConfigurationBox(props: {
  createConfigRevision: (value: Record<string, any>) => Promise<void>;
}) {
  return (
    <div className="flex flex-col flex-shrink-0 w-full overflow-hidden bg-white border rounded-lg shadow-md border-slate-300"></div>
  );
}
