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
import { IconDatabaseSearch } from "@tabler/icons-react";
import { ConfigRevisionTag } from "@/components/custom/config-revision-tag";
import { Spinner } from "@/components/custom/spinner";

export default function Page(props: {
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  const { userData, userDataIsloading, logoutUser } = useUser();

  const [currentPageNumber, setCurrentPageNumber] = useState(1);

  const { sensorsData } = useSensors(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier
  );
  const {
    measurementsData,
    measurementsDataFetchingState,
    numberOfMeasurementsPages,
    fetchNewerMeasurements,
    fetchOlderMeasurements,
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
    const interval = setInterval(() => {
      console.log(
        `fetching newer measurements for sensor ${props.params.sensorIdentifier}`
      );
      fetchNewerMeasurements();
    }, 5000);

    return () => clearInterval(interval);
  });

  useEffect(() => {
    if (
      measurementsDataFetchingState === "user-fetching" &&
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
      <div className="flex flex-row items-center w-full pb-4 text-base font-medium border-b text-slate-900 gap-x-2 border-slate-300">
        <IconDatabaseSearch className="p-1.5 bg-emerald-500 rounded text-emerald-50 w-7 h-7" />{" "}
        <h1>Raw measurement data</h1>
      </div>
      <div className="flex flex-row items-center justify-start w-full gap-x-4 md:gap-x-6">
        <Pagination
          currentPageNumber={currentPageNumber}
          numberOfPages={numberOfMeasurementsPages}
          setCurrentPageNumber={setCurrentPageNumber}
          noDataPlaceholder={
            measurementsDataFetchingState === "background-fetching" ||
            measurementsDataFetchingState === "user-fetching"
              ? "..."
              : "no data"
          }
        />
        <Button onClick={fetchOlderMeasurements}>load older</Button>
        <div className="flex-row items-end justify-end flex-grow hidden pr-3 md:flex">
          {measurementsDataFetchingState === "background-fetching" && (
            <Spinner />
          )}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-full gap-y-4">
        {measurementsData === undefined && "loading"}
        {measurementsData
          .slice((currentPageNumber - 1) * 64, currentPageNumber * 64)
          .map((measurement) => (
            <div
              key={JSON.stringify(measurement)}
              className="flex flex-col justify-start flex-shrink-0 w-full overflow-hidden text-sm bg-white border rounded-lg shadow gap-x-6 border-slate-300"
            >
              <div
                key={JSON.stringify(measurement)}
                className="flex flex-row items-center w-full p-3 pb-2 border-b border-slate-200 gap-x-3"
              >
                <ConfigRevisionTag revision={measurement.revision} />
                <div className="flex flex-col items-start justify-center flex-grow md:items-baseline gap-x-2 md:flex-row ">
                  <div className="font-regular">
                    {formatDistanceToNow(
                      new Date(measurement.creationTimestamp * 1000),
                      {
                        addSuffix: true,
                      }
                    )}
                  </div>
                  <div className="flex-grow" />
                  <div className="text-xs">
                    {new Date(
                      measurement.creationTimestamp * 1000
                    ).toISOString()}
                  </div>
                </div>
              </div>
              <div className="w-full font-mono text-xs whitespace-pre divide-y bg-slate-50 text-slate-500 divide-slate-200">
                {Object.entries(measurement.value).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex flex-row items-center justify-start w-full px-3 py-1 gap-x-2"
                  >
                    <div className="flex-grow-0 w-40 break-words font-regular whitespace-break-spaces">
                      {key}:
                    </div>
                    <div>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </>
  );
}
