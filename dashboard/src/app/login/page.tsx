"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/requests/user";
import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { NavigationBar } from "@/components/custom/navigation-bar";

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
    redirect("/");
  }

  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  return (
    <>
      <div className="grid w-screen h-[calc(100vh-3rem)] grid-cols-2 grid-rows-1">
        <div className="flex items-center justify-center">
          <Image
            src="/tenta-artwork-compressed.png"
            alt="Tenta Artwork"
            width="1716"
            height="1716"
            className="max-w-2xl"
          />
        </div>
        <div className="flex flex-col items-center justify-center w-full max-w-xs mx-auto gap-y-2">
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
