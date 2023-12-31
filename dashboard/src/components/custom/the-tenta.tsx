import Image from "next/image";

export function TheTenta(props: { className: string }) {
  return (
    <div className={"relative " + props.className}>
      <Image
        src="/tenta-artwork-recolored.png"
        alt="Tenta Artwork"
        width="1716"
        height="1716"
        className={"relative z-10 w-full"}
      />
      <div
        className="absolute top-0 left-0 z-0 w-full h-full"
        style={{
          background:
            "radial-gradient(circle 14rem at center, rgb(148 163 184 / 80%), rgb(148 163 184 / 0%))",
        }}
      />
    </div>
  );
}
