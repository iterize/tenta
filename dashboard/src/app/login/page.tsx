"use client";

import { SWRProvider } from "@/app/swr-provider";

export default function Page() {
  //const { data, error, isLoading } = useSWR("/api/user", fetcher);

  return (
    <SWRProvider>
      <main className="flex h-screen w-screen items-center justify-center">
        Login
      </main>
    </SWRProvider>
  );
}
