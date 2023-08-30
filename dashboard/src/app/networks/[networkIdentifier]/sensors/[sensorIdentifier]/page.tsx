"use client";

export default function Page(props: {
  params: { networkIdentifier: string; sensorIdentifier: string };
}) {
  return (
    <div>
      network: {props.params.networkIdentifier}, sensor:{" "}
      {props.params.sensorIdentifier}
    </div>
  );
}
