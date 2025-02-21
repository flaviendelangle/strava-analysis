"use client";

import dynamic from "next/dynamic";

export const ActivityStream = dynamic(() => import("./ActivityStream"), {
  ssr: false,
});
