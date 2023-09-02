"use client";

import useSWR from "swr";
import axios, { AxiosError, AxiosResponse } from "axios";
import { z } from "zod";
import toast from "react-hot-toast";

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

async function fetcher(
  accessToken: string | undefined,
  logoutUser: () => void
): Promise<NetworksType> {
  if (!accessToken) {
    throw new Error("Not authorized!");
  }

  const { data } = await axios
    .get(`${process.env.NEXT_PUBLIC_SERVER_URL}/networks`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res: AxiosResponse) => res.data)
    .catch((err: AxiosError) => {
      console.error("Error while fetching networks");
      console.log(err);
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
    });
  return schema.parse(data);
}

export function useNetworks(
  accessToken: string | undefined,
  logoutUser: () => void
) {
  const { data } = useSWR(["/networks", accessToken], ([url, accessToken]) =>
    fetcher(accessToken, logoutUser)
  );

  return data;
}
