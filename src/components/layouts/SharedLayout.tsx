import type { ReactNode } from "react";

import Head from "next/head";
import Image from "next/image";

import stravaBanner from "../../../public/strava-banner.svg";

export const SharedLayout = ({ children }: SharedLayoutProps) => {
  return (
    <>
      <Head>
        <title>Little experiment with Strava's API</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="h-screen">{children}</div>
      <span className="absolute bottom-0 right-0 rounded-tl-lg bg-gray-200">
        <Image
          priority
          src={stravaBanner}
          alt="This app is powered by Strava"
        />
      </span>
    </>
  );
};

interface SharedLayoutProps {
  children: ReactNode;
}
