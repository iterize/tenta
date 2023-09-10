"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { useMeasurementsAggregation } from "@/requests/measurements-aggregation";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";

export default function Page(props: {
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  const { userData, userDataIsloading, logoutUser } = useUser();
  const { measurementsAggregationData } = useMeasurementsAggregation(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier,
    props.params.sensorIdentifier
  );

  if (userDataIsloading || measurementsAggregationData === undefined) {
    return <AuthLoadingScreen />;
  } else if (userData === undefined) {
    redirect("/login");
  }

  console.log(measurementsAggregationData);

  return "Hi";
}
