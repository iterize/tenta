"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { useMeasurementsAggregation } from "@/requests/measurements-aggregation";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";

export default function Page(props: {
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  const { userData, userDataIsloading, logoutUser } = useUser();
  const { measurementsAggregationData } = useMeasurementsAggregation(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier,
    props.params.sensorIdentifier
  );

  if (userDataIsloading || measurementsAggregationData === undefined) {
    return <AuthLoadingScreen />;
  } else if (userData === undefined) {
    redirect("/login");
  }

  console.log(measurementsAggregationData);

  return (
    <div className="flex flex-col w-full gap-y-4">
      <h1 className="text-base font-semibold">
        Measurement data of the last four weeks
      </h1>
      {Object.keys(measurementsAggregationData).map((key) => (
        <MeasurementAggregationPlot
          key={key}
          label={key}
          data={measurementsAggregationData[key]}
        />
      ))}
      <h1 className="mt-8 text-base font-semibold">Aggregated logs</h1>
    </div>
  );
}

function MeasurementAggregationPlot(props: {
  label: string;
  data: { average: number; bucketTimestamp: number }[];
}) {
  return (
    <div className="flex flex-row w-full pl-4 gap-x-4">
      <div className="flex flex-row items-center justify-center w-64 gap-x-2">
        <h2 className="font-mono text-sm font-medium">{props.label}</h2>
        <div className="flex-grow border-b-[2.5px] border-dotted border-slate-300" />
      </div>
      <div className="flex-grow h-24 p-3 bg-white border rounded-md shadow border-slate-300"></div>
    </div>
  );
}
