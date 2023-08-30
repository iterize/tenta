"use client";

import useSWR from "swr";
import axios from "axios";
import { z } from "zod";
import { UserDataType } from "./user";

const networksSchema = z.array(
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

export type NetworksType = z.infer<typeof networksSchema>;

async function networkFetcher(
  accessToken: string | undefined
): Promise<NetworksType> {
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
  return networksSchema.parse(data);
}

export function useNetworks(userData: UserDataType | undefined) {
  const { data: networksData } = useSWR(
    ["/networks", userData?.accessToken],
    ([url, accessToken]) => networkFetcher(accessToken)
  );

  return networksData;
}
