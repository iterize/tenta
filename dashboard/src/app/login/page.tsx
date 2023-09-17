"use client";

import { use, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/requests/user";
import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { redirect } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { TheTenta } from "@/components/custom/the-tenta";
import { useStatus } from "@/requests/status";

export default function Page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userData, userDataIsloading, loginUser } = useUser();

  const serverStatus = useStatus();

  async function submit() {
    setIsSubmitting(true);
    try {
      await toast.promise(loginUser(username, password), {
        loading: "Authenticating",
        success: "Successfully authenticated",
        error: "Failed to authenticate",
      });
      setUsername("");
      setPassword("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (userDataIsloading || serverStatus === undefined) {
    return <AuthLoadingScreen />;
  } else if (userData !== undefined) {
    redirect("/");
  }

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <>
      <div className="grid w-screen h-[calc(100vh-3rem)] grid-cols-1 lg:grid-cols-2 grid-rows-1 relative">
        <div className="absolute top-0 left-0 w-full h-full background-paper-pattern" />
        <div className="items-center justify-center hidden lg:flex">
          <TheTenta className="max-w-2xl" />
        </div>
        <div className="flex flex-col items-center justify-center w-full max-w-xs mx-auto gap-y-2">
          <h1 className="mb-1 text-2xl font-bold">Login</h1>
          <Input
            required
            type="username"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-baseline justify-center w-full">
            <Link
              href="/signup"
              className="mx-3 text-xs font-semibold underline text-slate-900"
            >
              Sign up instead
            </Link>
            <div className="flex-grow" />
            <Button
              className="mt-2"
              onClick={isSubmitting ? () => {} : submit}
              variant={isSubmitting ? "ghost" : "default"}
            >
              {isSubmitting ? "..." : "Log in"}
            </Button>
          </div>
          {contactEmail !== undefined && (
            <div className="mt-4 text-sm text-center text-slate-800">
              If you have questions about this Tenta instance, please contact{" "}
              <Link href="mailto:${contactEmail}" className="underline">
                {contactEmail}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
