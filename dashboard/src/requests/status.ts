"use client";

import useSWR from "swr";
import axios, { AxiosError, AxiosResponse } from "axios";
import { z } from "zod";

const schema = z
  .object({
    environment: z.string(),
    commit_sha: z.string(),
    branch_name: z.string(),
    start_timestamp: z.number(),
    mqtt_hostname: z.string(),
    mqtt_port: z.number(),
  })
  .transform((data) => ({
    environment: data.environment,
    commitSha: data.commit_sha,
    branchName: data.branch_name,
    startTimestamp: data.start_timestamp,
    mqttHostname: data.mqtt_hostname,
    mqttPort: data.mqtt_port,
  }));

export type StatusType = z.infer<typeof schema>;

async function fetcher(url: string): Promise<StatusType | undefined> {
  return await axios
    .get(`${process.env.NEXT_PUBLIC_SERVER_URL}${url}`)
    .then((res: AxiosResponse) => schema.parse(res.data))
    .catch((err: AxiosError) => {
      console.error(`Error while fetching url ${url}: ${err}`);

      // redirect to /offline
      window.location.href = "/offline";
      return undefined;
    });
}

export function useStatus() {
  const { data } = useSWR(`/status`, (url) => fetcher(url));

  return data;
}
