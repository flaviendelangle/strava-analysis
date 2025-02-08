"use client";

import dynamic from "next/dynamic";

export const ActivitiesTimeline = dynamic(
  () => import("./ActivitiesTimeline"),
  {
    ssr: false,
  },
);
