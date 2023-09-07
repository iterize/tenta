"use client";

import axios, { AxiosError, AxiosResponse } from "axios";
import { z } from "zod";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { max } from "lodash";

const schema = z.array(
  z
    .object({
      value: z.record(z.string(), z.number()),
      revision: z.number().nullable(),
      creation_timestamp: z.number(),
    })
    .transform((data) => ({
      value: data.value,
      revision: data.revision,
      creationTimestamp: data.creation_timestamp,
    }))
);

export type MeasurementsType = z.infer<typeof schema>;

async function getSinglePage(
  url: string,
  earliestPresentCreationTimestamp: number | undefined,
  accessToken: string | undefined,
  logoutUser: () => void
): Promise<MeasurementsType | undefined> {
  if (!accessToken) {
    return undefined;
  }

  let fullUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}${url}?direction=previous`;
  if (earliestPresentCreationTimestamp !== undefined) {
    fullUrl += `&creation_timestamp=${earliestPresentCreationTimestamp}`;
  }

  return await axios
    .get(fullUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((res: AxiosResponse) => schema.parse(res.data))
    .catch((err: AxiosError) => {
      console.error(`Error while fetching url ${fullUrl}: ${err}`);
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
  numberOfPages: number,
  accessToken: string | undefined,
  logoutUser: () => void
): Promise<MeasurementsType | undefined> {
  if (!accessToken) {
    throw new Error("Not authorized!");
  }

  let data: MeasurementsType = [];

  for (let i = 0; i < numberOfPages; i++) {
    let nextPageData = await getSinglePage(
      url,
      undefined,
      accessToken,
      logoutUser
    );

    if (nextPageData === undefined) {
      return undefined;
    }

    data = [...data, ...nextPageData];
    if (nextPageData.length < 64) {
      break;
    }
  }

  return data.sort((a, b) => b.creationTimestamp - a.creationTimestamp);
}
