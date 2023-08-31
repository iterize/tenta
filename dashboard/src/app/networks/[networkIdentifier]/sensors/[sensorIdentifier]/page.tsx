"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";

export default function Page(props: {
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  const { userData, userDataIsloading } = useUser();

  const sensorsData = useSensors(
    props.params.networkIdentifier,
    userData?.accessToken
  );

  if (userDataIsloading) {
    return <AuthLoadingScreen />;
  } else if (userData === undefined) {
    redirect("/login");
  }

  const sensor = sensorsData?.find(
    (sensor) => sensor.identifier === props.params.sensorIdentifier
  );

  if (sensor === undefined) {
    return "unknown sensor id";
  }

  return (
    <div>
      network: {props.params.networkIdentifier}, sensor:{" "}
      {props.params.sensorIdentifier}
    </div>
  );
}
