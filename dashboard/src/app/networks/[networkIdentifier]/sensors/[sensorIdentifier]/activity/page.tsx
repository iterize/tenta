"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { useMeasurementsAggregation } from "@/requests/measurements-aggregation";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { maxBy, minBy, range } from "lodash";
import { useLogsAggregation } from "@/requests/logs-aggregation";
import { formatDistanceToNow } from "date-fns";
import { IconActivityHeartbeat } from "@tabler/icons-react";

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
  const { logsAggregationData } = useLogsAggregation(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier,
    props.params.sensorIdentifier
  );

  if (
    userDataIsloading ||
    measurementsAggregationData === undefined ||
    logsAggregationData === undefined
  ) {
    return <AuthLoadingScreen />;
  } else if (userData === undefined) {
    redirect("/login");
  }

  console.log(measurementsAggregationData);

  return (
    <>
      <div className="flex flex-row items-center w-full pb-4 text-base font-medium border-b text-slate-900 gap-x-2 border-slate-300">
        <IconActivityHeartbeat className="p-1.5 bg-rose-500 rounded text-rose-50 w-7 h-7" />{" "}
        <h1>
          Sensor Node Activity <span className="text-xs">(last 4 weeks)</span>
        </h1>
        <div className="flex-grow" />
        <span className="text-xs">Plot times in UTC</span>
      </div>
      <h2 className="w-full -mb-2 text-sm font-medium">Measurements:</h2>
      {Object.keys(measurementsAggregationData).length !== 0 && (
        <MeasurementActivityPlot data={measurementsAggregationData} />
      )}
      {Object.keys(measurementsAggregationData).length === 0 && (
        <div className="w-full text-sm text-center">no measurements</div>
      )}
      <h2 className="w-full mt-2 text-sm font-medium">
        <span className={"uppercase font-semibold text-red-700"}>ERROR</span>{" "}
        log messages:
      </h2>
      pass
      <h2 className="w-full mt-2 text-sm font-medium">
        <span className={"uppercase font-semibold text-yellow-700"}>
          WARNING
        </span>{" "}
        log messages:
      </h2>
      pass
    </>
  );
}

function MeasurementActivityPlot(props: {
  data: Record<string, { average: number; bucketTimestamp: number }[]>;
}) {
  const plotRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(plotRef.current);

    const now = new Date();
    const nextUTCMidnightTimestamp =
      Math.floor(now.getTime() / 1000) -
      now.getUTCSeconds() -
      now.getUTCMinutes() * 60 -
      now.getUTCHours() * 3600 +
      24 * 3600;

    const maxX = nextUTCMidnightTimestamp + 7200;
    const minX = nextUTCMidnightTimestamp - 29 * 24 * 3600 - 7200;

    const minY = 0;
    const maxY = Object.keys(props.data).length - 1;

    if (minY === undefined || maxY === undefined) {
      return;
    }

    const xScale = d3.scaleLinear([minX, maxX], [200, 1050]);
    const yScale = d3.scaleLinear([minY, maxY], [125, 10]);

    svg.selectAll("*").remove();

    const utcMidnightTimestamps = range(minX + 7200, maxX, 24 * 3600);

    svg
      .append("g")
      .attr("class", "major-x-tick-lines text-slate-300 z-0")
      .selectAll("line")
      .data(utcMidnightTimestamps)
      .enter()
      .append("line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", yScale(minY))
      .attr("y2", yScale(maxY))
      .attr("stroke", "currentColor");

    svg
      .append("g")
      .attr("class", "minor-x-tick-lines text-slate-150 z-0")
      .selectAll("line")
      .data(
        range(minX + 3600 * 2, maxX, 6 * 3600).filter(
          (d) => !utcMidnightTimestamps.includes(d)
        )
      )
      .enter()
      .append("line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", yScale(minY))
      .attr("y2", yScale(maxY))
      .attr("stroke", "currentColor");

    svg
      .append("g")
      .attr(
        "class",
        "major-x-tick-labels text-slate-600 z-10 text-xs font-medium"
      )
      .selectAll("text")
      .data(
        range(minX + 3600 + 12 * 3600, maxX - 3599 - 12 * 3600, 3 * 24 * 3600)
      )
      .enter()
      .append("text")
      .text((d) =>
        new Date(d * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      )
      .attr("x", (d) => xScale(d))
      .attr("y", 147)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor");

    const yTicks = range(minY, maxY + 1);

    svg
      .append("g")
      .attr(
        "class",
        "y-tick-labels text-slate-600 z-10 text-xs font-medium font-mono"
      )
      .selectAll("text")
      .data(yTicks)
      .enter()
      .append("text")
      .text((d) => {
        const label = Object.keys(props.data)[d];
        return label.length > 27 ? label.slice(0, 24) + "..." : label;
      })
      .attr("x", 195)
      .attr("y", (d) => yScale(d) + 4)
      .attr("text-anchor", "end")
      .attr("fill", "currentColor");

    Object.keys(props.data).forEach((sensorIdentifier, i) => {
      svg
        .append("line")
        .attr("class", "data-point-line z-10 stroke-emerald-800")
        .attr("x1", xScale(minX))
        .attr("x2", xScale(maxX))
        .attr("y1", yScale(i))
        .attr("y2", yScale(i))
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2 2");
      svg
        .append("g")
        .attr("class", "data-point-circles z-10 text-emerald-500")
        .selectAll("circle")
        .data(props.data[sensorIdentifier])
        .enter()
        .append("circle")
        .attr("r", 1.5)
        .attr("cx", (d) => xScale(d.bucketTimestamp))
        .attr("cy", (d) => yScale(i))
        .attr("fill", "currentColor");
    });
  }, [props.data, plotRef.current]);

  return (
    <div className="w-full p-2 bg-white border rounded-md shadow border-slate-300">
      <svg viewBox="0 0 1050 150" ref={plotRef} className="w-full" />
    </div>
  );
}

function LogAggregationPanel(props: {
  log: {
    minCreationTimestamp: number;
    maxCreationTimestamp: number;
    minRevision: number | null;
    maxRevision: number | null;
    severity: "error" | "info" | "warning";
    message: string;
    count: number;
  };
}) {
  const log = props.log;

  return (
    <div className="flex flex-col justify-start flex-shrink-0 w-[calc(100%-1rem)] ml-4 overflow-hidden text-sm bg-white border rounded-md shadow gap-x-6 border-slate-300">
      <div className="flex flex-row items-baseline justify-start w-full p-3 border-b border-slate-200">
        <div
          className={
            "flex items-center flex-shrink-0 h-6 px-2 text-sm font-semibold text-blue-900 bg-blue-200 rounded mr-2 " +
            (log.minRevision === null
              ? "bg-slate-200 text-slate-700"
              : "bg-blue-200 text-blue-900")
          }
        >
          {log.minRevision === null || log.maxRevision === null
            ? "No Config Revision"
            : log.minRevision === log.maxRevision
            ? `Config Revision ${log.minRevision.toString()} only`
            : `Config Revisions ${log.minRevision.toString()} - ${log.maxRevision.toString()}`}
        </div>
        <div className="font-normal">
          First appeared{" "}
          {formatDistanceToNow(new Date(log.minCreationTimestamp * 1000), {
            addSuffix: true,
          })}
          {" | "}
          Last appeared{" "}
          {formatDistanceToNow(new Date(log.maxCreationTimestamp * 1000), {
            addSuffix: true,
          })}
        </div>
        <div className="flex-grow" />
        <div>
          {new Date(log.minCreationTimestamp * 1000).toISOString()}
          {" | "}
          {new Date(log.maxCreationTimestamp * 1000).toISOString()}
        </div>
      </div>
      <div className="flex flex-row items-baseline w-full px-3 py-2 font-mono text-xs break-words justify-baseline bg-slate-100 text-slate-600 whitespace-break-spaces gap-x-2">
        <div
          className={
            "px-1.5 py-0.5 mr-1 rounded-sm uppercase font-semibold " +
            (log.severity === "info" ? "bg-blue-200 text-blue-900 " : "") +
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
  );
}
