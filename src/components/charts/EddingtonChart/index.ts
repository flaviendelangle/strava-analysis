"use client";

import dynamic from "next/dynamic";

export const EddingtonChart = dynamic(
  () => import("./EddingtonChart"),
  {
    ssr: false,
  },
);
