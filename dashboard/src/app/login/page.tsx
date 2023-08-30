"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/requests/user";
import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { redirect } from "next/navigation";

// ------------

export default function Page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userData, userDataIsloading, loginUser } = useUser();

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

  if (userDataIsloading) {
    return <AuthLoadingScreen />;
  } else if (userData !== undefined) {
    redirect("/networks");
  }

  return (
    <main className="flex flex-col items-center justify-center w-screen h-screen gap-y-6">
      <div className="flex flex-col items-center w-full max-w-xs gap-y-2">
        <h1 className="mb-1 text-2xl font-bold">Login</h1>
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
    </main>
  );
}
