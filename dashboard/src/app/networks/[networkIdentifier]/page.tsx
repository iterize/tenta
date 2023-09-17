"use client";

import { TheTenta } from "@/components/custom/the-tenta";

export default function Page(props: { params: { networkIdentifier: string } }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="m-4">
        please <span className="font-semibold">select a sensor</span> in the
        list
      </div>
      <TheTenta className="hidden max-w-xl md:block" />
    </div>
  );
}
