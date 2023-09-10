"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Pagination } from "@/components/custom/pagination";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { useLogs } from "@/requests/logs";

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
  const { logsData, logsDataFetchingState, numberOfLogsPages, fetchMoreLogs } =
    useLogs(
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
      logsDataFetchingState === "fetching" &&
      dataLoadingToastId === undefined
    ) {
      setDataLoadingToastId(toast.loading("loading data"));
    }
    if (
      (logsDataFetchingState === "new data" ||
        logsDataFetchingState === "no new data") &&
      dataLoadingToastId !== undefined
    ) {
      setDataLoadingToastId(undefined);
      toast.success(logsDataFetchingState, {
        id: dataLoadingToastId,
        duration: 1500,
      });
    }
  }, [logsDataFetchingState, dataLoadingToastId]);

  // when new data is fetched, go to the last page
  useEffect(() => {
    setCurrentPageNumber(numberOfLogsPages);
  }, [numberOfLogsPages]);

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
          numberOfPages={numberOfLogsPages}
          setCurrentPageNumber={setCurrentPageNumber}
          noDataPlaceholder={
            logsDataFetchingState === "fetching" ? "..." : "no data"
          }
        />
        <Button onClick={fetchMoreLogs}>load older data</Button>
      </div>
      <div className="flex flex-col items-center justify-center w-full mt-2 gap-y-4">
        {logsData === undefined && "loading"}
        {logsData.map((log) => (
          <div
            key={JSON.stringify(log)}
            className="flex flex-col justify-start flex-shrink-0 w-full overflow-hidden text-sm bg-white border rounded-md shadow gap-x-6 border-slate-300"
          >
            <div
              key={JSON.stringify(log)}
              className="flex flex-row items-baseline justify-start w-full p-3 border-b border-slate-200"
            >
              <div
                className={
                  "flex items-center flex-shrink-0 h-6 px-2 text-sm font-semibold text-blue-900 bg-blue-200 rounded mr-2 " +
                  (log.revision === null
                    ? "bg-slate-200 text-slate-700"
                    : "bg-blue-200 text-blue-900")
                }
              >
                {log.revision === null
                  ? "No Config Revision"
                  : `Config Revision ${log.revision.toString()}`}
              </div>
              <div className="font-medium">
                Created{" "}
                {formatDistanceToNow(new Date(log.creationTimestamp * 1000), {
                  addSuffix: true,
                })}
              </div>
              <div className="flex-grow" />
              <div>{new Date(log.creationTimestamp * 1000).toISOString()}</div>
            </div>
            <div className="flex flex-row items-baseline w-full px-3 py-2 font-mono text-xs break-words justify-baseline bg-slate-100 text-slate-600 whitespace-break-spaces gap-x-2">
              <div
                className={
                  "px-1.5 py-0.5 mr-1 rounded-sm uppercase font-semibold " +
                  (log.severity === "info"
                    ? "bg-blue-200 text-blue-900 "
                    : "") +
                  (log.severity === "warning"
                    ? "bg-yellow-200 text-yellow-900 "
                    : "") +
                  (log.severity === "error" ? "bg-red-200 text-red-900 " : "")
                }
              >
                {log.severity}
              </div>
              <div>{log.message}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
