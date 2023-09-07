"use client";

import axios, { AxiosError, AxiosResponse } from "axios";
import { z } from "zod";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { max, maxBy, minBy } from "lodash";

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
  maxLocalCreationTimestamp: number | undefined,
  minLocalCreationTimestamp: number | undefined,
  accessToken: string | undefined,
  logoutUser: () => void
): Promise<MeasurementsType | undefined> {
  if (!accessToken) {
    return undefined;
  }

  let fullUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}${url}?`;

  if (
    maxLocalCreationTimestamp === undefined &&
    minLocalCreationTimestamp === undefined
  ) {
    fullUrl += `direction=previous`;
  }
  if (
    maxLocalCreationTimestamp !== undefined &&
    minLocalCreationTimestamp === undefined
  ) {
    fullUrl += `direction=next&creation_timestamp=${maxLocalCreationTimestamp}`;
  }
  if (
    maxLocalCreationTimestamp === undefined &&
    minLocalCreationTimestamp !== undefined
  ) {
    fullUrl += `direction=previous&creation_timestamp=${minLocalCreationTimestamp}`;
  }
  if (
    maxLocalCreationTimestamp !== undefined &&
    minLocalCreationTimestamp !== undefined
  ) {
    throw new Error(
      "maxLocalCreationTimestamp and minLocalCreationTimestamp cannot both be defined"
    );
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
  localData: MeasurementsType,
  loadNewerData: boolean,
  loadOlderData: boolean,
  accessToken: string | undefined,
  logoutUser: () => void
): Promise<MeasurementsType | undefined> {
  if (!accessToken) {
    throw new Error("Not authorized!");
  }

  if (localData.length === 0) {
    return (
      await getSinglePage(url, undefined, undefined, accessToken, logoutUser)
    )?.sort((a, b) => b.creationTimestamp - a.creationTimestamp);
  } else {
    // @ts-ignore
    let localMaxCreationTimestamp: number = maxBy(
      localData,
      (d) => d.creationTimestamp
    )?.creationTimestamp;

    // @ts-ignore
    let localMinCreationTimestamp: number = minBy(
      localData,
      (d) => d.creationTimestamp
    )?.creationTimestamp;

    if (
      localMinCreationTimestamp === undefined ||
      localMaxCreationTimestamp === undefined
    ) {
      throw new Error(
        "localMinCreationTimestamp or localMaxCreationTimestamp undefined"
      );
    }

    let data: MeasurementsType = localData;

    if (loadNewerData) {
      let newerData = await getSinglePage(
        url,
        localMaxCreationTimestamp,
        undefined,
        accessToken,
        logoutUser
      );
      if (newerData === undefined) {
        return undefined;
      }
      data = [...data, ...newerData];
    }

    if (loadOlderData) {
      let newerData = await getSinglePage(
        url,
        undefined,
        localMinCreationTimestamp,
        accessToken,
        logoutUser
      );
      if (newerData === undefined) {
        return undefined;
      }
      data = [...data, ...newerData];
    }

    return data.sort((a, b) => b.creationTimestamp - a.creationTimestamp);
  }
}

export function useMeasurements(
  accessToken: string | undefined,
  logoutUser: () => void,
  networkIdentifier: string,
  sensorIdentifier: string
) {
  const [data, setData] = useState<MeasurementsType>([]);
  const [numberOfRequestedPages, setNumberOfRequestedPages] = useState(1);

  const [fetchingState, setFetchingState] = useState<
    "idle" | "fetching" | "new data" | "no new data"
  >("idle");

  const url = `/networks/${networkIdentifier}/sensors/${sensorIdentifier}/measurements`;
  const numberOfPages = Math.ceil(data.length / 64);

  useEffect(() => {
    if (
      fetchingState !== "fetching" &&
      numberOfPages < numberOfRequestedPages
    ) {
      const f = async () => {
        setFetchingState("fetching");
        const startTimestamp = new Date().getTime();
        const newData = await fetcher(
          url,
          data,
          false,
          true,
          accessToken,
          logoutUser
        );
        if (newData === undefined) {
          setNumberOfRequestedPages(numberOfPages);
        } else {
          setData(newData);
          setNumberOfRequestedPages(Math.ceil(newData.length / 64));
        }
        const endTimestamp = new Date().getTime();
        console.log(
          `fetching ${numberOfRequestedPages} measurement pages took ${
            endTimestamp - startTimestamp
          } ms`
        );

        const endFetchingState = () => {
          if (data.length === newData?.length) {
            setFetchingState("no new data");
          } else {
            setFetchingState("new data");
          }
        };

        if (endTimestamp - startTimestamp < 800) {
          console.log(
            `retaining fetching state for ${max([
              0,
              800 - (endTimestamp - startTimestamp),
            ])} ms more`
          );
          await new Promise((resolve) =>
            setTimeout(
              () => {
                endFetchingState();
                resolve(null);
              },
              800 - (endTimestamp - startTimestamp)
            )
          );
        } else {
          endFetchingState();
        }
      };

      f();
    }
  }, [
    data,
    accessToken,
    fetchingState,
    logoutUser,
    url,
    numberOfPages,
    numberOfRequestedPages,
  ]);

  return {
    measurementsData: data,
    measurementsDataFetchingState: fetchingState,
    numberOfPages: numberOfPages,
    fetchMoreData: () => {
      setNumberOfRequestedPages(numberOfRequestedPages + 1);
    },
  };
}
