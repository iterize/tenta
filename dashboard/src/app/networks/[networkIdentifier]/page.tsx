"use client";

import { TheTenta } from "@/components/custom/the-tenta";

export default function Page(props: { params: { networkIdentifier: string } }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="mb-4">
        please <span className="font-semibold">select a sensor</span> in the
        list on the left
      </div>
      <TheTenta className="max-w-xl" />
    </div>
  );
}
