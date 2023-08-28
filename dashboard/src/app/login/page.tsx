"use client";

import { SWRProvider } from "@/app/swr-provider";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Page() {
  //const { data, error, isLoading } = useSWR("/api/user", fetcher);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SWRProvider>
      <main className="flex h-screen w-screen items-center justify-center">
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
            className="bg-green-800 text-green-50 mt-2"
            onClick={() => {
              console.log("login");
            }}
          >
            Login
          </Button>
        </div>
      </main>
    </SWRProvider>
  );
}
