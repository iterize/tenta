import Link from "next/link";

export default function Page() {
  return (
    <main className="flex flex-col items-center justify-center w-screen h-[calc(100vh-3rem)] p-8 gap-y-4 text-normal relative">
      <div className="absolute top-0 bottom-0 left-0 right-0 z-0 background-paper-pattern" />
      <div className="relative z-10 text-4xl font-semibold">
        Server is Offline
      </div>
      <div className="relative z-10 max-w-xl text-center">
        Could not reach Tenta server at{" "}
        <span className="px-1 font-mono rounded-md bg-slate-200 py-0.5">
          {process.env.NEXT_PUBLIC_SERVER_URL}
        </span>
        . Read the Tenta documentation about deployment at{" "}
        <Link
          href="https://tenta.onrender.com/deployment"
          target="_blank"
          className="font-medium underline break-all"
        >
          tenta.onrender.com/deployment
        </Link>
      </div>
    </main>
  );
}
