import type { ReactNode } from "react";

import Head from "next/head";
import Image from "next/image";

import stravaBanner from "../../public/strava-banner.svg";

type DefaultLayoutProps = { children: ReactNode };

export const SharedLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <>
      <Head>
        <title>Strava Analysis</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="h-screen">{children}</div>
      <span className="absolute bottom-0 right-0 bg-gray-200 rounded-tl-lg">
        <Image
          priority
          src={stravaBanner}
          alt="This app is powered by Strava"
        />
      </span>
    </>
  );
};
