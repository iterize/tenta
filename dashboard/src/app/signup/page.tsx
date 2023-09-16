"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/requests/user";
import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { redirect } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { TheTenta } from "@/components/custom/the-tenta";

export default function Page() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { userData, userDataIsloading, signupUser } = useUser();

  async function submit() {
    if (password !== passwordConfirmation) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await toast.promise(signupUser(username, password), {
        loading: "Authenticating",
        success: "Successfully created new account",
        error: "Username already exists",
      });
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
      <div className="grid w-screen h-[calc(100vh-3rem)] grid-cols-2 grid-rows-1 relative">
        <div className="absolute top-0 left-0 w-full h-full background-paper-pattern" />
        <div className="flex items-center justify-center">
          <TheTenta className="max-w-2xl" />
        </div>
        <div className="flex flex-col items-center justify-center w-full max-w-xs mx-auto gap-y-2">
          <h1 className="mb-1 text-2xl font-bold">Signup</h1>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            required
            type="password"
            autoComplete="new-password"
            placeholder="Password Confirmation"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
          <div className="flex items-baseline justify-center w-full">
            <Link
              href="/login"
              className="mx-3 text-xs font-semibold underline text-slate-900"
            >
              Log in instead
            </Link>
            <div className="flex-grow" />
            <Button
              className="mt-2"
              onClick={isSubmitting ? () => {} : submit}
              variant={isSubmitting ? "ghost" : "default"}
            >
              {isSubmitting ? "..." : "Sign up"}
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
