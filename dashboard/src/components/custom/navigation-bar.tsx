"use client";

import Link from "next/link";
import Image from "next/image";
import { useUser } from "@/requests/user";
import { Button } from "@/components/ui/button";
import { IconRipple } from "@tabler/icons-react";

export function NavigationBar() {
  const { userData, logoutUser } = useUser();

  return (
    <header className="flex flex-row items-center justify-start flex-shrink-0 w-full h-12 px-6 overflow-hidden border-b border-slate-300">
      <Link
        href="/"
        className="flex items-center h-12 p-2.5 -ml-6 overflow-hidden border-r w-14 bg-slate-900 border-slate-300 text-slate-100"
      >
        <IconRipple className="w-full h-full" />
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
      <p className="text-sm text-slate-800">
        powered by{" "}
        <Link
          href="https://github.com/iterize/tenta"
          target="_blank"
          className="font-medium underline text-slate-950 hover:text-rose-600"
        >
          github.com/iterize/tenta
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
