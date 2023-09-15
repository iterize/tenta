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
import { ConfigRevisionTag } from "@/components/custom/config-revision-tag";
import { TimestampLabel } from "@/components/custom/timestamp-label";

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
      <h2 className="w-full -mb-2 text-sm font-medium">
        Measurement messages:
      </h2>
      {Object.keys(measurementsAggregationData).length !== 0 && (
        <MeasurementActivityPlot data={measurementsAggregationData} />
      )}
      {Object.keys(measurementsAggregationData).length === 0 && (
        <div className="w-full text-sm text-center">no measurements</div>
      )}
      <h2 className="w-full mt-2 text-sm font-medium">
        <span className={"uppercase font-semibold "}>ERROR</span> log messages:
      </h2>
      {logsAggregationData.filter((l) => l.severity === "error").length ===
        0 && <div className="w-full text-sm text-center">no error logs</div>}
      {logsAggregationData
        .filter((l) => l.severity === "error")
        .map((l) => (
          <LogAggregationPanel key={l.message} log={l} />
        ))}
      <h2 className="w-full mt-2 text-sm font-medium">
        <span className={"uppercase font-semibold"}>WARNING</span> log messages:
      </h2>
      {logsAggregationData.filter((l) => l.severity === "warning").length ===
        0 && <div className="w-full text-sm text-center">no warning logs</div>}
      {logsAggregationData
        .filter((l) => l.severity === "warning")
        .map((l) => (
          <LogAggregationPanel key={l.message} log={l} />
        ))}
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
    <div className="w-[calc(100%-1rem)] p-2 ml-4 bg-white border rounded-md shadow border-slate-300">
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
    <div className="flex flex-col justify-start flex-shrink-0 w-[calc(100%-1rem)] ml-4 overflow-hidden text-sm bg-white border rounded-lg shadow gap-x-6 border-slate-300">
      <div className="flex flex-row items-center w-full p-3 border-b font-regular border-slate-200 gap-x-3">
        <ConfigRevisionTag
          revision={log.minRevision}
          to_revision={log.maxRevision}
        />

        <TimestampLabel
          label="first appeared"
          timestamp={log.minCreationTimestamp}
        />
        <div className="-mx-1 font-light">|</div>
        <TimestampLabel
          label="last appeared"
          timestamp={log.maxCreationTimestamp}
        />
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
  );
}
