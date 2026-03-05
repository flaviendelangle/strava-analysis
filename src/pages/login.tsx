import * as React from "react";

import { BikeIcon } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import stravaButton from "../../public/strava-connect-button-orange.svg";
import { SharedLayout } from "../components/layouts/SharedLayout";
import { NextPageWithLayout } from "./_app";

const LoginPage: NextPageWithLayout = () => {
  const router = useRouter();
  const session = useSession();

  if (session.data?.user) {
    router.replace("/activities");
  }

  if (session.status === "loading") {
    return null;
  }

  return (
    <main className="from-background via-background to-primary/10 relative flex h-screen items-center justify-center overflow-hidden bg-linear-to-br">
      {/* Decorative background element */}
      <BikeIcon className="text-primary/3 absolute -right-20 -bottom-20 size-112 rotate-12" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <BikeIcon className="text-primary size-10" />
            <h1 className="text-foreground text-5xl font-black tracking-tight">
              Undertrained
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Analyze your cycling performance
          </p>
        </div>

        <button
          className="group relative transition-transform hover:scale-105 active:scale-100"
          onClick={() => signIn("strava", { callbackUrl: "/activities" })}
        >
          <div className="absolute -inset-1 rounded-lg bg-[#FC4C02]/20 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
          <Image
            priority
            src={stravaButton}
            alt="Login with Strava"
            className="relative"
          />
        </button>

        <Link
          href="/privacy"
          className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-3"
        >
          Privacy Policy
        </Link>
        <Link
          href="/toolbox"
          className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-3"
        >
          Running Toolbox
        </Link>
      </div>
    </main>
  );
};

LoginPage.getLayout = function getLayout(page) {
  return <SharedLayout>{page}</SharedLayout>;
};

export default LoginPage;
