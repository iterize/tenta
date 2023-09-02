"use client";

import useSWR from "swr";
import axios from "axios";
import { z } from "zod";
import { min } from "lodash";

const schema = z.array(
  z
    .object({
      value: z.object({}),
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
  maxRevision: number | undefined
): Promise<ConfigurationsType> {
  const fullUrl =
    process.env.NEXT_PUBLIC_SERVER_URL +
    url +
    "?direction=previous" +
    (maxRevision !== undefined ? `&revision=${maxRevision}` : "");

  const { data } = await axios.get(fullUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return schema.parse(data);
}

async function fetcher(
  url: string,
  accessToken: string | undefined
): Promise<ConfigurationsType> {
  if (!accessToken) {
    throw new Error("Not authorized!");
  }

  let data: ConfigurationsType = [];

  while (1) {
    let newData = await getSinglePage(
      url,
      accessToken,
      min(data.map((d) => d.revision))
    );
    data = [...data, ...newData];
    if (newData.length < 64) {
      break;
    }
  }

  return data.sort((a, b) => b.revision - a.revision);
}

export function useConfigurations(
  accessToken: string | undefined,
  networkIdentifier: string,
  sensorIdentifier: string
) {
  const { data } = useSWR(
    [
      `/networks/${networkIdentifier}/sensors/${sensorIdentifier}/configurations`,
      accessToken,
    ],
    ([url, accessToken]) => fetcher(url, accessToken)
  );

  return data;
}
