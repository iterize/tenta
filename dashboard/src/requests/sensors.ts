"use client";

import useSWR from "swr";
import axios, { AxiosError, AxiosResponse } from "axios";
import { z } from "zod";
import toast from "react-hot-toast";

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
  accessToken: string | undefined,
  logoutUser: () => void
): Promise<SensorsType | undefined> {
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

export function useSensors(
  accessToken: string | undefined,
  logoutUser: () => void,
  networkIdentifier: string
) {
  const { data } = useSWR(
    [`/networks/${networkIdentifier}/sensors`, accessToken],
    ([url, accessToken]) => fetcher(url, accessToken, logoutUser)
  );

  return data;
}
