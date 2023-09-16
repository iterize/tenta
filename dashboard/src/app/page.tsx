"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { useNetworks } from "@/requests/networks";
import { useSensors } from "@/requests/sensors";
import Link from "next/link";
import { useStatus } from "@/requests/status";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  IconCircleCheckFilled,
  IconCircleDashed,
  IconPlus,
} from "@tabler/icons-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { IconCircleDashedX } from "@tabler/icons-react";

export default function Page() {
  const { userData, userDataIsloading, logoutUser } = useUser();

  const [newNetworkName, setNewNetworkName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { networksData, createNetwork } = useNetworks(
    userData?.accessToken,
    logoutUser
  );

  async function submit() {
    setIsSubmitting(true);
    try {
      await toast.promise(createNetwork(newNetworkName), {
        loading: "Creating new network",
        success: "Successfully created new network",
        error: "Could not create new network",
      });
      setNewNetworkName("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (userDataIsloading) {
    return <AuthLoadingScreen />;
  } else if (userData === undefined) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col items-center flex-grow w-full p-8 bg-slate-50">
      <h2 className="flex flex-row items-center mb-4 text-2xl font-bold gap-x-1 text-slate-800">
        Networks
      </h2>
      <div className="grid w-full max-w-4xl grid-cols-2 gap-4">
        {networksData === undefined && "..."}
        {networksData?.map((network) => (
          <NetworkCard
            key={network.identifier}
            networkName={network.name}
            networkIdentifier={network.identifier}
            accessToken={userData.accessToken}
            logoutUser={logoutUser}
          />
        ))}
        <CreateNetworkButton createNetwork={createNetwork} />
      </div>
      <h2 className="flex flex-row items-center mt-16 mb-4 text-2xl font-bold gap-x-1 text-slate-800">
        Server Status
      </h2>
      <ServerStatus />
      <h2 className="flex flex-row items-center mt-16 mb-4 text-2xl font-bold gap-x-1 text-slate-800">
        Dashboard Status
      </h2>
      <DashboardStatus />
    </div>
  );
}

function NetworkCard(props: {
  networkName: string;
  networkIdentifier: string;
  accessToken: string;
  logoutUser: () => void;
}) {
  const sensorsData = useSensors(
    props.accessToken,
    props.logoutUser,
    props.networkIdentifier
  );

  return (
    <Link href={`/networks/${props.networkIdentifier}`} className="group">
      <div className="flex flex-col w-full overflow-hidden bg-white border rounded-lg shadow group-hover:bg-slate-50 border-slate-300 group-hover:shadow-md group-hover:border-slate-400">
        <h3 className="flex flex-row items-baseline px-3 pt-2 pb-1 m-0 text-lg font-semibold border-b border-slate-200">
          <div>{props.networkName}</div>
          <div className="flex-grow" />
          <div className="px-1 text-sm font-medium rounded text-emerald-800 bg-emerald-200">
            {sensorsData === undefined && "..."}
            {sensorsData !== undefined && (
              <>
                <span className="font-bold text-emerald-900">
                  {sensorsData.length}
                </span>{" "}
                sensor
                {sensorsData.length === 1 ? "" : "s"}
              </>
            )}
          </div>
        </h3>
        <div className="flex flex-col w-full p-3 font-mono text-xs bg-slate-50 text-slate-500">
          {props.networkIdentifier}
        </div>
      </div>
    </Link>
  );
}

function CreateNetworkButton(props: {
  createNetwork: (name: string) => Promise<void>;
}) {
  const [newNetworkName, setNewNetworkName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const rules = [
    {
      label: "At least one character",
      valid: newNetworkName.length > 0,
    },
    {
      label: "Max. 64 characters",
      valid: newNetworkName.length <= 64,
    },
    {
      label: "Only lowercase letters/numbers/ dashes",
      valid: newNetworkName.match(/^[a-z0-9-]*$/) !== null,
    },
    {
      label: "No leading/trailing/consecutive dashes",
      valid:
        newNetworkName.match(/--/) === null &&
        newNetworkName.match(/^-/) === null &&
        newNetworkName.match(/-$/) === null,
    },
  ];

  const formatIsValid = rules.every((rule) => rule.valid);

  async function submit() {
    if (!formatIsValid) {
      toast.error("Invalid network name");
      return;
    }

    setIsSubmitting(true);
    try {
      await toast.promise(props.createNetwork(newNetworkName), {
        loading: "Creating new network",
        success: "Successfully created new network",
        error: "Could not create new network",
      });
      setIsOpen(false);
      setNewNetworkName("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        setNewNetworkName("");
      }}
    >
      <DialogTrigger asChild>
        <button className="min-h-[5rem] transition-colors border-2 border-dashed rounded-lg border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-900">
          <div className="flex flex-row items-center justify-center text-sm font-medium ">
            <IconPlus width={16} className="mr-1.5 -ml-0.5" /> Create Network
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new network</DialogTitle>
        </DialogHeader>
        <div className="flex flex-row items-baseline gap-x-3">
          <Label className="text-right whitespace-nowrap">Network Name</Label>
          <div className="flex flex-col items-start justify-start flex-grow gap-y-2">
            <Input
              autoFocus
              value={newNetworkName}
              onChange={(e) => setNewNetworkName(e.target.value)}
              className="w-full"
            />
            {rules.map((rule, index) => (
              <div
                key={index}
                className={
                  "flex flex-row items-center gap-x-2 text-xs font-medium px-3 " +
                  (rule.valid ? "text-emerald-700" : "text-rose-700")
                }
              >
                {rule.valid ? (
                  <IconCircleCheckFilled size={14} />
                ) : (
                  <IconCircleDashed size={14} />
                )}

                <div>{rule.label}</div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={isSubmitting ? () => {} : submit}
            variant={isSubmitting ? "ghost" : "default"}
          >
            {isSubmitting ? "..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ServerStatus() {
  const serverStatus = useStatus();

  return (
    <div className="flex flex-col w-full max-w-xl p-4 mx-auto overflow-hidden text-sm bg-white border rounded shadow border-slate-300">
      <div>
        <span className="inline-flex font-medium w-28">Environment:</span>{" "}
        {serverStatus?.environment || "..."}
      </div>
      <div>
        <span className="inline-flex font-medium w-28">Commit SHA:</span>{" "}
        <span className="font-mono bg-slate-150 rounded-sm py-0.5 px-1 text-slate-700">
          {serverStatus?.commitSha || "..."}
        </span>
      </div>
      <div>
        <span className="inline-flex font-medium w-28">Branch Name:</span>{" "}
        {serverStatus?.branchName || "..."}
      </div>
      <div>
        <span className="inline-flex font-medium w-28">Last Boot:</span>{" "}
        {serverStatus?.startTimestamp !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {formatDistanceToNow(
                  new Date(serverStatus.startTimestamp * 1000),
                  {
                    addSuffix: true,
                  }
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  {new Date(serverStatus.startTimestamp * 1000).toISOString()}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <div>
        <span className="inline-flex font-medium w-28">MQTT Broker:</span>{" "}
        {serverStatus?.mqttHostname || "..."}:{serverStatus?.mqttPort || "..."}
      </div>
    </div>
  );
}

function DashboardStatus() {
  return (
    <div className="flex flex-col w-full max-w-xl p-4 mx-auto overflow-hidden text-sm bg-white border rounded shadow border-slate-300">
      <div>
        <span className="inline-flex font-medium w-28">Environment:</span>{" "}
        {process.env.NEXT_PUBLIC_BRANCH_NAME === undefined && "..."}
        {process.env.NEXT_PUBLIC_BRANCH_NAME !== undefined && (
          <>
            {process.env.NEXT_PUBLIC_BRANCH_NAME === "main" && "production"}
            {process.env.NEXT_PUBLIC_BRANCH_NAME !== "main" && "development"}
          </>
        )}
      </div>
      <div>
        <span className="inline-flex font-medium w-28">Commit SHA:</span>{" "}
        <span className="font-mono bg-slate-150 rounded-sm py-0.5 px-1 text-slate-700">
          {process.env.NEXT_PUBLIC_COMMIT_SHA}
        </span>
      </div>
      <div>
        <span className="inline-flex font-medium w-28">Branch Name:</span>{" "}
        {process.env.NEXT_PUBLIC_BRANCH_NAME}
      </div>
      <div>
        <span className="inline-flex font-medium w-28">Last Build:</span>{" "}
        {process.env.NEXT_PUBLIC_BUILD_TIMESTAMP !== undefined && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {formatDistanceToNow(
                  new Date(
                    parseInt(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP) * 1000
                  ),
                  {
                    addSuffix: true,
                  }
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  {new Date(
                    parseInt(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP) * 1000
                  ).toISOString()}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
