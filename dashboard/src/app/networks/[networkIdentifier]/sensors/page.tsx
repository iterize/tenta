"use client";

export default function Page(props: { params: { networkIdentifier: string } }) {
  return (
    <main className="flex flex-col w-screen min-h-screen">
      {props.params.networkIdentifier}
    </main>
  );
}
