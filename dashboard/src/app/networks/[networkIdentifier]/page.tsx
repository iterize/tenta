"use client";

import Image from "next/image";

export default function Page(props: { params: { networkIdentifier: string } }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <div className="mb-4">
        please <span className="font-semibold">select a sensor</span> in the
        list on the left
      </div>
      <Image
        src="/tenta-artwork-compressed.png"
        alt="Tenta Artwork"
        width="1716"
        height="1716"
        className="max-w-xl"
      />
    </div>
  );
}
