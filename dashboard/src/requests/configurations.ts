"use client";

import useSWR from "swr";
import axios, { AxiosError, AxiosResponse } from "axios";
import { z } from "zod";
import { min } from "lodash";
import toast from "react-hot-toast";

const schema = z.array(
  z
    .object({
      value: z.any(),
      revision: z.number().int(),
      creation_timestamp: z.number().nullable(),
      publication_timestamp: z.number().nullable(),
      acknowledgment_timestamp: z.number().nullable(),
      receipt_timestamp: z.number().nullable(),
      success: z.boolean().nullable(),
    })
    .transform((data) => ({
      value: data.value,
      revision: data.revision,
      creationTimestamp: data.creation_timestamp,
      publicationTimestamp: data.publication_timestamp,
      acknowledgmentTimestamp: data.acknowledgment_timestamp,
      receiptTimestamp: data.receipt_timestamp,
      success: data.success,
    }))
);

export type ConfigurationsType = z.infer<typeof schema>;

async function getSinglePage(
  url: string,
  accessToken: string,
  maxRevision: number | undefined,
  logoutUser: () => void
): Promise<ConfigurationsType | undefined> {
  const fullUrl =
    process.env.NEXT_PUBLIC_SERVER_URL +
    url +
    "?direction=previous" +
    (maxRevision !== undefined ? `&revision=${maxRevision}` : "");

  return await axios
    .get(fullUrl, {
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

async function fetcher(
  url: string,
  accessToken: string | undefined,
  logoutUser: () => void
): Promise<ConfigurationsType | undefined> {
  if (!accessToken) {
    throw new Error("Not authorized!");
  }

  let data: ConfigurationsType = [];

  while (1) {
    let newData = await getSinglePage(
      url,
      accessToken,
      min(data.map((d) => d.revision)),
      logoutUser
    );
    if (newData === undefined) {
      return undefined;
    }
    data = [...data, ...newData];
    if (newData.length < 64) {
      break;
    }
  }

  return data.sort((a, b) => b.revision - a.revision);
}

export function useConfigurations(
  accessToken: string | undefined,
  logoutUser: () => void,
  networkIdentifier: string,
  sensorIdentifier: string
) {
  const { data } = useSWR(
    [
      `/networks/${networkIdentifier}/sensors/${sensorIdentifier}/configurations`,
      accessToken,
    ],
    ([url, accessToken]) => fetcher(url, accessToken, logoutUser)
  );

  return data;
}
