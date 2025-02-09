import * as React from "react";

import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { redirect } from "next/navigation";

import stravaButton from "../../public/strava-connect-button-orange.svg";
import { SharedLayout } from "../components/SharedLayout";
import { NextPageWithLayout } from "./_app";

const LoginPage: NextPageWithLayout = () => {
  const session = useSession();

  if (session.data?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="h-screen flex justify-center items-center">
      <div className="flex flex-col items-center">
        <span>You are not logged in</span>
        <button onClick={() => signIn("strava", { callbackUrl: "/dashboard" })}>
          <Image priority src={stravaButton} alt="Login with Strava" />
        </button>
      </div>
    </main>
  );
};

LoginPage.getLayout = function getLayout(page) {
  return <SharedLayout>{page}</SharedLayout>;
};

export default LoginPage;
