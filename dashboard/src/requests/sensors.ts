"use client";

import useSWR from "swr";
import axios from "axios";
import { z } from "zod";

const schema = z.array(
  z
    .object({
      sensor_identifier: z.string(),
      sensor_name: z.string(),
    })
    .transform((data) => ({
      identifier: data.sensor_identifier,
      name: data.sensor_name,
    }))
);

export type SensorsType = z.infer<typeof schema>;

async function fetcher(
  url: string,
  accessToken: string | undefined
): Promise<SensorsType> {
  if (!accessToken) {
    throw new Error("Not authorized!");
  }

  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_SERVER_URL}${url}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return schema.parse(data);
}

export function useSensors(
  accessToken: string | undefined,
  networkIdentifier: string
) {
  const { data } = useSWR(
    [`/networks/${networkIdentifier}/sensors`, accessToken],
    ([url, accessToken]) => fetcher(url, accessToken)
  );

  return data;
}
