import type { ReactNode } from "react";

import Head from "next/head";
import Image from "next/image";

import stravaBanner from "../../../public/strava-banner.svg";

export const SharedLayout = ({ children }: SharedLayoutProps) => {
  return (
    <>
      <Head>
        <title>Little experiment with Strava's API</title>
        <link rel="icon" href="/favicon.svg" />
      </Head>

      <div className="h-screen">{children}</div>
      <span className="bg-background absolute right-0 bottom-0 rounded-tl-lg">
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
