"use client";

import { SWRProvider } from "@/app/swr-provider";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

// --------------

// mock the user api
async function userFetcher(): Promise<UserDataType> {
  const userIdentifier = Cookies.get("userIdentifier");
  const accessToken = Cookies.get("accessToken");

  if (userIdentifier && accessToken) {
    return {
      userIdentifier,
      accessToken,
    };
  }

  // not authorized
  const error: any = new Error("Not authorized!");
  error.status = 403;
  throw error;
}

export function useUser() {
  const {
    data: userData,
    error,
    mutate,
  } = useSWR("userData", userFetcher, {
    refreshInterval: 0.01,
  });

  const loginUser = async (username: string, password: string) => {
    const { data } = await axios.post("http://127.0.0.1:8000/authentication", {
      user_name: username,
      password,
    });
    const userData = userDataSchema.parse(data);
    Cookies.set("userIdentifier", userData.userIdentifier);
    Cookies.set("accessToken", userData.accessToken);
    mutate(userData);
  };

  const authenticationState: "loading" | "loggedIn" | "loggedOut" = (() => {
    if (userData) {
      return "loggedIn";
    }
    if (error) {
      return "loggedOut";
    }
    return "loading";
  })();

  return {
    userData,
    authenticationState,
    logoutUser: () => {
      Cookies.remove("userIdentifier");
      Cookies.remove("accessToken");
      mutate(undefined);
    },
    loginUser,
  };
}

// ------------

export default function Page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userData, authenticationState, logoutUser, loginUser } = useUser();

  async function submit() {
    setIsSubmitting(true);
    try {
      await loginUser(username, password);
      setUsername("");
      setPassword("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SWRProvider>
      <main className="flex h-screen w-screen items-center justify-center flex-col gap-y-6">
        {authenticationState === "loading" && <div>loading...</div>}
        {authenticationState === "loggedOut" && (
          <div className="flex flex-col items-center gap-y-2 max-w-xs w-full">
            <h1 className="text-2xl font-bold mb-1">Login</h1>
            <Input
              type="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              className="mt-2"
              onClick={isSubmitting ? () => {} : submit}
              variant={isSubmitting ? "ghost" : "default"}
            >
              {isSubmitting ? "..." : "Login"}
            </Button>
          </div>
        )}
        {authenticationState === "loggedIn" && (
          <div className="flex flex-col items-center gap-y-2 max-w-xs w-full">
            <h1 className="text-2xl font-bold mb-1">Logout</h1>
            <Button className="mt-2" onClick={logoutUser}>
              Logout
            </Button>
            <div>userData: {JSON.stringify(userData)}</div>
          </div>
        )}
      </main>
    </SWRProvider>
  );
}
