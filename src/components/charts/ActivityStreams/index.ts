"use client";

import dynamic from "next/dynamic";

export const ActivityStreams = dynamic(() => import("./ActivityStreams"), {
  ssr: false,
});
