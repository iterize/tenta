"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/requests/user";
import { Button } from "@/components/ui/button";

export function NavigationBar() {
  const { userData, logoutUser } = useUser();

  return (
    <header className="flex flex-row items-center justify-start flex-shrink-0 w-full h-12 px-6 overflow-hidden border-b border-slate-300">
      <Link
        href="/"
        className="flex items-center w-20 h-12 px-4 -ml-6 overflow-hidden border-r bg-slate-900 border-slate-300 text-slate-100"
      >
        <Image
          src="/tenta-icon-v2-square.svg"
          alt="Tenta Icon"
          width="100"
          height="100"
        />
      </Link>
      <Link href="/">
        <h1 className="hidden pl-5 font-light text-slate-950 xl:block xl:text-lg">
          <span className="font-semibold">
            {process.env.NEXT_PUBLIC_INSTANCE_TITLE || "Tenta Dashboard"}
          </span>{" "}
          {process.env.NEXT_PUBLIC_INSTANCE_SUBTITLE !== undefined && (
            <>&nbsp;|&nbsp; {process.env.NEXT_PUBLIC_INSTANCE_SUBTITLE}</>
          )}
        </h1>
      </Link>
      <div className="flex-grow" />
      <p className="text-slate-800">
        powered by{" "}
        <Link
          href="https://github.com/tum-esm/hermes"
          target="_blank"
          className="font-medium underline text-slate-950 hover:text-rose-600"
        >
          github.com/tum-esm/tenta
        </Link>
      </p>
      {userData !== undefined && (
        <Button className="ml-4" onClick={logoutUser}>
          {"Logout"}
        </Button>
      )}
    </header>
  );
}