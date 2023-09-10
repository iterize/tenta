"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Pagination } from "@/components/custom/pagination";
import { Button } from "@/components/ui/button";
import { useMeasurements } from "@/requests/measurements";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

export default function Page(props: {
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  const { userData, userDataIsloading, logoutUser } = useUser();

  const [currentPageNumber, setCurrentPageNumber] = useState(1);

  const sensorsData = useSensors(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier
  );
  const {
    measurementsData,
    measurementsDataFetchingState,
    numberOfMeasurementsPages,
    fetchMoreMeasurements,
  } = useMeasurements(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier,
    props.params.sensorIdentifier
  );
  const [dataLoadingToastId, setDataLoadingToastId] = useState<
    string | undefined
  >();

  useEffect(() => {
    if (
      measurementsDataFetchingState === "fetching" &&
      dataLoadingToastId === undefined
    ) {
      setDataLoadingToastId(toast.loading("loading data"));
    }
    if (
      (measurementsDataFetchingState === "new data" ||
        measurementsDataFetchingState === "no new data") &&
      dataLoadingToastId !== undefined
    ) {
      setDataLoadingToastId(undefined);
      toast.success(measurementsDataFetchingState, {
        id: dataLoadingToastId,
        duration: 1500,
      });
    }
  }, [measurementsDataFetchingState, dataLoadingToastId, measurementsData]);

  // when new data is fetched, go to the last page
  useEffect(() => {
    setCurrentPageNumber(numberOfMeasurementsPages);
  }, [numberOfMeasurementsPages]);

  // when page is left, dismiss all toasts
  useEffect(() => {
    return () => toast.dismiss();
  }, []);

  if (userDataIsloading || sensorsData === undefined) {
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
      <div className="flex flex-row items-center justify-start w-full gap-x-6">
        <Pagination
          currentPageNumber={currentPageNumber}
          numberOfPages={numberOfMeasurementsPages}
          setCurrentPageNumber={setCurrentPageNumber}
          noDataPlaceholder={
            measurementsDataFetchingState === "fetching" ? "..." : "no data"
          }
        />
        <Button onClick={fetchMoreMeasurements}>load older data</Button>
      </div>
      <div className="flex flex-col items-center justify-center w-full mt-2 gap-y-4">
        {measurementsData === undefined && "loading"}
        {measurementsData
          .slice((currentPageNumber - 1) * 64, currentPageNumber * 64)
          .map((measurement) => (
            <div
              key={JSON.stringify(measurement)}
              className="flex flex-col justify-start flex-shrink-0 w-full overflow-hidden text-sm bg-white border rounded-md shadow gap-x-6 border-slate-300"
            >
              <div
                key={JSON.stringify(measurement)}
                className="flex flex-row items-baseline justify-start w-full p-3 border-b border-slate-200"
              >
                <div
                  className={
                    "flex items-center flex-shrink-0 h-6 px-2 text-sm font-semibold text-blue-900 bg-blue-200 rounded mr-2 " +
                    (measurement.revision === null
                      ? "bg-slate-200 text-slate-700"
                      : "bg-blue-200 text-blue-900")
                  }
                >
                  {measurement.revision === null
                    ? "No Config Revision"
                    : `Config Revision ${measurement.revision.toString()}`}
                </div>
                <div className="font-medium">
                  Created{" "}
                  {formatDistanceToNow(
                    new Date(measurement.creationTimestamp * 1000),
                    {
                      addSuffix: true,
                    }
                  )}
                </div>
                <div className="flex-grow" />
                <div>
                  {new Date(measurement.creationTimestamp * 1000).toISOString()}
                </div>
              </div>
              <div className="w-full font-mono text-xs whitespace-pre divide-y bg-slate-100 text-slate-600 divide-slate-200">
                {Object.entries(measurement.value).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex flex-row items-center justify-start w-full px-3 py-1 gap-x-2"
                  >
                    <div className="flex-grow-0 w-40 font-medium break-words whitespace-break-spaces">
                      {key}:
                    </div>
                    <div>{JSON.stringify(value)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </>
  );
}
