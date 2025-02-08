"use client";

import dynamic from "next/dynamic";

export const ActivitiesCumulativeTimeline = dynamic(
  () => import("./ActivitiesCumulativeTimeline"),
  {
    ssr: false,
  },
);
