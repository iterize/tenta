"use client";

import useSWR from "swr";
import axios from "axios";
import { z } from "zod";
import Cookies from "js-cookie";

const userDataSchema = z
  .object({
    user_identifier: z.string(),
    access_token: z.string(),
  })
  .transform((data) => ({
    userIdentifier: data.user_identifier,
    accessToken: data.access_token,
  }));

export type UserDataType = z.infer<typeof userDataSchema>;

async function userFetcher(): Promise<UserDataType> {
  const userIdentifier = Cookies.get("userIdentifier");
  const accessToken = Cookies.get("accessToken");

  if (userIdentifier && accessToken) {
    return {
      userIdentifier,
      accessToken,
    };
  }

  throw new Error("Not authorized!");
}

export function useUser() {
  const { data: userData, error, mutate } = useSWR("userData", userFetcher);

  const loginUser = async (username: string, password: string) => {
    const { data } = await axios.post(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/authentication`,
      {
        user_name: username,
        password,
      }
    );
    const userData = userDataSchema.parse(data);
    Cookies.set("userIdentifier", userData.userIdentifier);
    Cookies.set("accessToken", userData.accessToken);
    mutate(userData);
  };

  return {
    userData,
    userDataIsloading: !userData && !error,
    logoutUser: () => {
      Cookies.remove("userIdentifier");
      Cookies.remove("accessToken");
      mutate(undefined);
    },
    loginUser,
  };
}
