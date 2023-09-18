"use client";

import Link from "next/link";
import { useUser } from "@/requests/user";
import { Button } from "@/components/ui/button";
import { IconRipple } from "@tabler/icons-react";

export function NavigationBar() {
  const { userData, logoutUser } = useUser();

  return (
    <header className="flex flex-row items-center justify-start flex-shrink-0 w-full h-12 pl-6 pr-2 overflow-hidden border-b md:pr-6 border-slate-300">
      <Link
        href="/"
        className="flex items-center h-12 p-2.5 -ml-6 overflow-hidden border-r w-14 bg-slate-900 border-slate-300 text-slate-100"
      >
        <IconRipple className="w-full h-full" />
      </Link>
      <Link href="/">
        <h1 className="pl-4 font-light text-slate-950">
          <span className="font-medium">Tenta Dashboard</span>{" "}
          <span className="hidden lg:inline">
            {process.env.NEXT_PUBLIC_INSTANCE_TITLE !== undefined && (
              <>&nbsp;|&nbsp; {process.env.NEXT_PUBLIC_INSTANCE_TITLE}</>
            )}
          </span>
        </h1>
      </Link>
      <div className="flex-grow" />
      <p className="hidden text-sm text-slate-800 sm:block">
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
