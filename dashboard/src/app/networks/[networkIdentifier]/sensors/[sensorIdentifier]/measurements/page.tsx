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
    numberOfPages,
    fetchMoreData,
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
      setDataLoadingToastId(undefined);
    }
  }, [measurementsDataFetchingState, dataLoadingToastId]);

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
          numberOfPages={numberOfPages}
          setCurrentPageNumber={setCurrentPageNumber}
        />
        <Button onClick={fetchMoreData}>load more data</Button>
      </div>
      <div className="flex flex-col items-center justify-center w-full gap-y-6">
        {measurementsData === undefined && "loading"}
        {measurementsData !== undefined &&
          measurementsData.map((measurement) => (
            <div
              key={JSON.stringify(measurement)}
              className="flex flex-row items-center justify-start w-full gap-x-6"
            >
              <div className="flex flex-row items-center justify-start w-full gap-x-6">
                <div className="flex flex-col items-start justify-start w-full gap-y-0">
                  <div>{measurement.creationTimestamp}</div>
                  <div>{measurement.revision?.toString()}</div>
                  <div>{JSON.stringify(measurement.value)}</div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </>
  );
}
