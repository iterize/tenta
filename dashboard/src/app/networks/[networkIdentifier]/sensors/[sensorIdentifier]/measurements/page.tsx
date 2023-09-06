"use client";

import { AuthLoadingScreen } from "@/components/custom/auth-loading-screen";
import { useSensors } from "@/requests/sensors";
import { useUser } from "@/requests/user";
import { redirect } from "next/navigation";
import { useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Pagination } from "@/components/custom/pagination";
import { Button } from "@/components/ui/button";

export default function Page(props: {
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  const { userData, userDataIsloading, logoutUser } = useUser();

  const [numberOfPages, setNumberOfPages] = useState(10);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);

  const sensorsData = useSensors(
    userData?.accessToken,
    logoutUser,
    props.params.networkIdentifier
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
    <>
      <div className="flex flex-row items-center justify-start w-full gap-x-6">
        <Pagination
          currentPageNumber={currentPageNumber}
          numberOfPages={numberOfPages}
          setCurrentPageNumber={setCurrentPageNumber}
        />
        <Button onClick={() => {}}>load more data</Button>
      </div>
    </>
  );
}
