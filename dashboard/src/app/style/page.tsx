"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { NavigationBar } from "@/components/custom/navigation-bar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";

export default function Page() {
  return (
    <main className="flex flex-col w-screen min-h-screen p-8 gap-y-4">
      <div className="flex flex-row gap-x-2">
        <div className="w-32">Color `blue`</div>
        <div className="w-12 h-6 text-center bg-blue-100 rounded" />
        <div className="w-12 h-6 text-center bg-blue-200 rounded" />
        <div className="w-12 h-6 text-center bg-blue-300 rounded" />
        <div className="w-12 h-6 text-center bg-blue-400 rounded" />
        <div className="w-12 h-6 text-center bg-blue-500 rounded" />
        <div className="w-12 h-6 text-center bg-blue-600 rounded" />
        <div className="w-12 h-6 text-center bg-blue-700 rounded" />
        <div className="w-12 h-6 text-center bg-blue-800 rounded" />
        <div className="w-12 h-6 text-center bg-blue-900 rounded" />
      </div>
      <div className="flex flex-row gap-x-2">
        <div className="w-32">Color `red`</div>
        <div className="w-12 h-6 text-center bg-red-100 rounded" />
        <div className="w-12 h-6 text-center bg-red-200 rounded" />
        <div className="w-12 h-6 text-center bg-red-300 rounded" />
        <div className="w-12 h-6 text-center bg-red-400 rounded" />
        <div className="w-12 h-6 text-center bg-red-500 rounded" />
        <div className="w-12 h-6 text-center bg-red-600 rounded" />
        <div className="w-12 h-6 text-center bg-red-700 rounded" />
        <div className="w-12 h-6 text-center bg-red-800 rounded" />
        <div className="w-12 h-6 text-center bg-red-900 rounded" />
      </div>
      <div className="flex flex-row gap-x-2">
        <div className="w-32">Color `orange`</div>
        <div className="w-12 h-6 text-center bg-orange-100 rounded" />
        <div className="w-12 h-6 text-center bg-orange-200 rounded" />
        <div className="w-12 h-6 text-center bg-orange-300 rounded" />
        <div className="w-12 h-6 text-center bg-orange-400 rounded" />
        <div className="w-12 h-6 text-center bg-orange-500 rounded" />
        <div className="w-12 h-6 text-center bg-orange-600 rounded" />
        <div className="w-12 h-6 text-center bg-orange-700 rounded" />
        <div className="w-12 h-6 text-center bg-orange-800 rounded" />
        <div className="w-12 h-6 text-center bg-orange-900 rounded" />
      </div>
      <div className="flex flex-row gap-x-2">
        <div className="w-32">Color `yellow`</div>
        <div className="w-12 h-6 text-center bg-yellow-100 rounded" />
        <div className="w-12 h-6 text-center bg-yellow-200 rounded" />
        <div className="w-12 h-6 text-center bg-yellow-300 rounded" />
        <div className="w-12 h-6 text-center bg-yellow-400 rounded" />
        <div className="w-12 h-6 text-center bg-yellow-500 rounded" />
        <div className="w-12 h-6 text-center bg-yellow-600 rounded" />
        <div className="w-12 h-6 text-center bg-yellow-700 rounded" />
        <div className="w-12 h-6 text-center bg-yellow-800 rounded" />
        <div className="w-12 h-6 text-center bg-yellow-900 rounded" />
      </div>
      <div className="flex flex-row gap-x-2">
        <div className="w-32">Color `eggshell`</div>
        <div className="w-12 h-6 text-center rounded bg-eggshell-100" />
        <div className="w-12 h-6 text-center rounded bg-eggshell-200" />
        <div className="w-12 h-6 text-center rounded bg-eggshell-300" />
        <div className="w-12 h-6 text-center rounded bg-eggshell-400" />
        <div className="w-12 h-6 text-center rounded bg-eggshell-500" />
        <div className="w-12 h-6 text-center rounded bg-eggshell-600" />
        <div className="w-12 h-6 text-center rounded bg-eggshell-700" />
        <div className="w-12 h-6 text-center rounded bg-eggshell-800" />
        <div className="w-12 h-6 text-center rounded bg-eggshell-900" />
      </div>
    </main>
  );
}
