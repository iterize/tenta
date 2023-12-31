"use client";

export default function Page(props: {
  children: React.ReactNode;
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  return (
    <div className="flex flex-col items-center justify-start w-full h-full px-3 pt-6 pb-10 overflow-x-hidden overflow-y-scroll md:px-6 gap-y-4">
      {props.children}
    </div>
  );
}
