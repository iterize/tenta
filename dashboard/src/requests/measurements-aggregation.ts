"use client";

import useSWR from "swr";
import axios, { AxiosError, AxiosResponse } from "axios";
import { z } from "zod";
import toast from "react-hot-toast";

const schema = z.record(
  z.string(),
  z.array(
    z
      .object({
        average: z.number(),
        bucket_timestamp: z.number(),
      })
      .transform((obj) => ({
        average: obj.average,
        bucketTimestamp: obj.bucket_timestamp,
      }))
  )
);

export type MeasurementsAggregationType = z.infer<typeof schema>;

async function fetcher(
  url: string,
  accessToken: string | undefined,
  logoutUser: () => void
): Promise<MeasurementsAggregationType | undefined> {
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

export function useMeasurementsAggregation(
  accessToken: string | undefined,
  logoutUser: () => void,
  networkIdentifier: string,
  sensorIdentifier: string
) {
  const { data } = useSWR(
    [
      `/networks/${networkIdentifier}/sensors/${sensorIdentifier}/measurements?aggregate=true`,
      accessToken,
    ],
    ([url, accessToken]) => fetcher(url, accessToken, logoutUser)
  );

  return {
    measurementsAggregationData: data,
  };
}
