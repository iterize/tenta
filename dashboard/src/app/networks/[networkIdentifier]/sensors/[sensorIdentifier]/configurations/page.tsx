"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { Button } from "@/components/ui/button";
import { useConfigurations } from "@/requests/configurations";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";

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
      <Button>New Revision</Button>
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
      <div className="flex flex-row items-center justify-start p-3 border-b gap-x-4 border-slate-200">
        <div className="px-2 py-0.5 bg-amber-300 text-amber-900 text-sm font-semibold rounded flex-shrink-0">
          Revision {props.configuration.revision}
        </div>
        <div className="grid flex-grow w-full h-2 grid-cols-4 overflow-hidden divide-x-2 rounded-full divide-emerald-600">
          <div className="w-full h-full bg-emerald-400" />
          <div className="w-full h-full bg-slate-200" />
          <div className="w-full h-full bg-slate-200" />
          <div className="w-full h-full bg-slate-200" />
        </div>
      </div>
      <div className="p-3 bg-slate-100">
        {JSON.stringify(props.configuration.value, null, 4)}
      </div>
    </div>
  );
}
