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
import { IconChartHistogram } from "@tabler/icons-react";

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
        <IconChartHistogram className="p-1.5 bg-orange-500 rounded text-orange-50 w-7 h-7" />{" "}
        <h1>Measurement data over the last four weeks</h1>
        <div className="flex-grow" />
        <span className="text-xs">Plot times in UTC</span>
      </div>
      {Object.keys(measurementsAggregationData)
        .sort()
        .map((key) => (
          <MeasurementAggregationPlot
            key={key}
            label={key}
            data={measurementsAggregationData[key]}
          />
        ))}
      {Object.keys(measurementsAggregationData).length === 0 && (
        <div className="w-full text-sm text-center">no measurements</div>
      )}
    </>
  );
}

function MeasurementAggregationPlot(props: {
  label: string;
  data: { average: number; bucketTimestamp: number }[];
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

    let minY = minBy(props.data, (d) => d.average)?.average;
    let maxY = maxBy(props.data, (d) => d.average)?.average;

    if (minY === undefined || maxY === undefined) {
      return;
    }

    const dy = maxY - minY;
    minY -= dy * 0.1;
    maxY += dy * 0.1;

    const xScale = d3.scaleLinear([minX, maxX], [65, 1050]);
    const yScale = d3.scaleLinear([minY, maxY], [135, 0]);

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

    const yTicks = yScale.ticks(5);

    svg
      .append("g")
      .attr("class", "y-tick-lines text-slate-300 z-0")
      .selectAll("line")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("x1", xScale(minX - 1 * 3600))
      .attr("x2", xScale(maxX - 2 * 3600))
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "currentColor");

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
      .text((d) => d.toPrecision(4))
      .attr("x", 60)
      .attr("y", (d) => yScale(d) + 4)
      .attr("text-anchor", "end")
      .attr("fill", "currentColor");

    svg
      .append("g")
      .attr("class", "data-point-circles text-slate-900 z-10")
      .selectAll("circle")
      .data(props.data)
      .enter()
      .append("circle")
      .attr("r", 1.25)
      .attr("cx", (d) => xScale(d.bucketTimestamp))
      .attr("cy", (d) => yScale(d.average))
      .attr("fill", "currentColor");
  }, [props.data, plotRef.current]);

  return (
    <div className="flex flex-row w-full pl-4 gap-x-4">
      <div className="flex flex-row items-center justify-center w-64 gap-x-2">
        <h2 className="font-mono text-sm font-medium">{props.label}</h2>
        <div className="flex-grow border-b-[2.5px] border-dotted border-slate-300" />
      </div>
      <div className="flex-grow p-2 bg-white border rounded-md shadow border-slate-300">
        <svg viewBox="0 0 1050 150" ref={plotRef} className="w-full" />
      </div>
    </div>
  );
}
