"use client";

import useSWR from "swr";
import axios, { AxiosError, AxiosResponse } from "axios";
import { z } from "zod";
import toast from "react-hot-toast";

const schema = z
  .object({
    environment: z.string(),
    commit_sha: z.string(),
    branch_name: z.string(),
    start_timestamp: z.number(),
  })
  .transform((data) => ({
    environment: data.environment,
    commitSha: data.commit_sha,
    branchName: data.branch_name,
    startTimestamp: data.start_timestamp,
  }));

export type StatusType = z.infer<typeof schema>;

async function fetcher(url: string): Promise<StatusType | undefined> {
  return await axios
    .get(`${process.env.NEXT_PUBLIC_SERVER_URL}${url}`)
    .then((res: AxiosResponse) => schema.parse(res.data))
    .catch((err: AxiosError) => {
      console.error(`Error while fetching url ${url}: ${err}`);
      if (err.response?.status.toString().startsWith("5")) {
        toast("Server error", { icon: "🔥" });
      } else {
        toast("Client error", { icon: "❓" });
      }
      return undefined;
    });
}

export function useStatus() {
  const { data } = useSWR(`/status`, (url) => fetcher(url));

  return data;
}
