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
      <div className="flex flex-row items-center w-full pb-4 text-base font-medium border-b text-slate-900 gap-x-2 border-slate-300">
        <IconDatabaseExclamation className="p-1.5 bg-yellow-500 rounded text-yellow-50 w-7 h-7" />{" "}
        <h1>Raw log data</h1>
      </div>
      <div className="flex flex-row items-center justify-start w-full gap-x-6">
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
        <Button onClick={fetchOlderLogs}>load older data</Button>
      </div>
      <div className="flex flex-col items-center justify-center w-full gap-y-4">
        {logsData === undefined && "loading"}
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
              <div className="font-regular">
                {formatDistanceToNow(new Date(log.creationTimestamp * 1000), {
                  addSuffix: true,
                })}
              </div>
              <div className="flex-grow" />
              <div>{new Date(log.creationTimestamp * 1000).toISOString()}</div>
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
