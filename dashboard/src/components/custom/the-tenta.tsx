import Image from "next/image";

export function TheTenta(props: { className: "max-w-xl" | "max-w-2xl" }) {
  return (
    <div className="relative">
      <Image
        src="/tenta-artwork-png-recolored.png"
        alt="Tenta Artwork"
        width="1716"
        height="1716"
        className={"relative z-10 " + props.className}
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
