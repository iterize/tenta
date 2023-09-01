"use client";

export default function Page(props: {
  children: React.ReactNode;
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  return (
    <div className="flex flex-col items-center justify-start w-full h-full p-3 overflow-x-hidden overflow-y-scroll">
      {props.children}
    </div>
  );
}
