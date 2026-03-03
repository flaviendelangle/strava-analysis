"use client";

import dynamic from "next/dynamic";

export const PowerCurve = dynamic(
  () => import("./PowerCurve"),
  {
    ssr: false,
  },
);
