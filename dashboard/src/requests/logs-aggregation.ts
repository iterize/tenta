"use client";

import useSWR from "swr";
import axios, { AxiosError, AxiosResponse } from "axios";
import { z } from "zod";
import toast from "react-hot-toast";

const schema = z.array(
  z
    .object({
      min_creation_timestamp: z.number(),
      max_creation_timestamp: z.number(),
      min_revision: z.number().int().nullable(),
      max_revision: z.number().int().nullable(),
      severity: z.union([
        z.literal("info"),
        z.literal("warning"),
        z.literal("error"),
      ]),
      message: z.string(),
      count: z.number().int(),
    })
    .transform((obj) => ({
      minCreationTimestamp: obj.min_creation_timestamp,
      maxCreationTimestamp: obj.max_creation_timestamp,
      minRevision: obj.min_revision,
      maxRevision: obj.max_revision,
      severity: obj.severity,
      message: obj.message,
      count: obj.count,
    }))
);

export type LogsAggregationType = z.infer<typeof schema>;

async function fetcher(
  url: string,
  accessToken: string | undefined,
  logoutUser: () => void
): Promise<LogsAggregationType | undefined> {
  if (!accessToken) {
    return undefined;
  }

  return await axios
    .get(`${process.env.NEXT_PUBLIC_SERVER_URL}${url}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res: AxiosResponse) => schema.parse(res.data))
    .catch((err: AxiosError) => {
      console.error(`Error while fetching url ${url}: ${err}`);
      if (err.response?.status === 401) {
        toast("Session expired", { icon: "🔑" });
        logoutUser();
        window.location.reload();
      } else if (err.response?.status.toString().startsWith("5")) {
        toast("Server error", { icon: "🔥" });
        logoutUser();
        window.location.reload();
      } else {
        toast("Client error", { icon: "❓" });
        logoutUser();
        window.location.reload();
      }
      return undefined;
    });
}

export function useLogsAggregation(
  accessToken: string | undefined,
  logoutUser: () => void,
  networkIdentifier: string,
  sensorIdentifier: string
) {
  const { data } = useSWR(
    [
      `/networks/${networkIdentifier}/sensors/${sensorIdentifier}/logs/aggregates`,
      accessToken,
    ],
    ([url, accessToken]) => fetcher(url, accessToken, logoutUser)
  );

  return {
    logsAggregationData: data,
  };
}
