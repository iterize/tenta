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
import { IconDatabaseExclamation } from "@tabler/icons-react";
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
    logsData,
    logsDataFetchingState,
    numberOfLogsPages,
    fetchNewerLogs,
    fetchOlderLogs,
  } = useLogs(
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
        `fetching newer logs for sensor ${props.params.sensorIdentifier}`
      );
      fetchNewerLogs();
    }, 5000);

    return () => clearInterval(interval);
  });

  useEffect(() => {
    if (
      logsDataFetchingState === "user-fetching" &&
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
      <div className="flex flex-row items-center justify-start w-full pb-4 text-lg font-normal border-b text-slate-900 gap-x-2 border-slate-300">
        <div className="flex flex-row items-center justify-center rounded-md">
          <div className="w-8 h-8 p-2 text-white bg-yellow-500 rounded-lg">
            <IconDatabaseExclamation className="w-full h-full" />
          </div>
          <div className="px-3 font-medium text-yellow-950">Raw Logs</div>
        </div>
      </div>
      <div className="flex flex-row items-center justify-start w-full gap-x-4 md:gap-x-6">
        <Pagination
          currentPageNumber={currentPageNumber}
          numberOfPages={numberOfLogsPages}
          setCurrentPageNumber={setCurrentPageNumber}
          noDataPlaceholder={
            logsDataFetchingState === "user-fetching" ||
            logsDataFetchingState === "background-fetching"
              ? "..."
              : "no data"
          }
        />
        <Button onClick={fetchOlderLogs}>load older</Button>
        <div className="flex flex-row items-end justify-end flex-grow pr-3">
          {logsDataFetchingState === "background-fetching" && <Spinner />}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-full gap-y-4">
        {logsDataFetchingState !== "background-fetching" &&
          logsData.length === 0 && (
            <div className="w-full mt-2 text-sm text-center text-slate-700">
              no logs
            </div>
          )}
        {logsData.map((log) => (
          <div
            key={JSON.stringify(log)}
            className="flex flex-col justify-start flex-shrink-0 w-full overflow-hidden text-sm bg-white border rounded-lg shadow gap-x-6 border-slate-300"
          >
            <div
              key={JSON.stringify(log)}
              className="flex flex-row items-center w-full p-3 pb-2 border-b border-slate-200 gap-x-3"
            >
              <ConfigRevisionTag revision={log.revision} />
              <div className="flex flex-col items-start justify-center flex-grow md:items-baseline gap-x-2 md:flex-row ">
                <div className="font-regular">
                  {formatDistanceToNow(new Date(log.creationTimestamp * 1000), {
                    addSuffix: true,
                  })}
                </div>
                <div className="flex-grow" />
                <div className="text-xs">
                  {new Date(log.creationTimestamp * 1000).toISOString()}
                </div>
              </div>
            </div>
            <div className="w-full px-3 py-2 font-mono text-xs break-words bg-slate-50 text-slate-500 whitespace-break-spaces gap-x-2">
              <span
                className={
                  "uppercase font-semibold opacity-70 " +
                  (log.severity === "info" ? "text-slate-700" : "") +
                  (log.severity === "warning" ? "text-yellow-700" : "") +
                  (log.severity === "error" ? "text-red-700" : "")
                }
              >
                {log.severity}
              </span>{" "}
              {log.message}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
