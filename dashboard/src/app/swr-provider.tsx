"use client";

import { SWRConfig } from "swr";

export const SWRProvider = (props: { children: React.ReactNode }) => {
  return <SWRConfig>{props.children}</SWRConfig>;
};
