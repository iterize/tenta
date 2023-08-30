"use client";

import useSWR from "swr";
import axios from "axios";
import { z } from "zod";

const schema = z.array(
  z
    .object({
      network_identifier: z.string(),
      network_name: z.string(),
    })
    .transform((data) => ({
      identifier: data.network_identifier,
      name: data.network_name,
    }))
);

export type NetworksType = z.infer<typeof schema>;

async function fetcher(accessToken: string | undefined): Promise<NetworksType> {
  if (!accessToken) {
    throw new Error("Not authorized!");
  }

  const { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_SERVER_URL}/networks`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return schema.parse(data);
}

export function useNetworks(accessToken: string | undefined) {
  const { data } = useSWR(["/networks", accessToken], ([url, accessToken]) =>
    fetcher(accessToken)
  );

  return data;
}
