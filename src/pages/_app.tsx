import type { ReactElement, ReactNode } from "react";

import type { NextPage } from "next";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { AppProps, AppType } from "next/app";
import { CookiesProvider } from "react-cookie";

import { LicenseInfo } from "@mui/x-license";

import { LoggedInLayout } from "~/components/layouts/LoggedInLayout";
import { TooltipProvider } from "~/components/ui/tooltip";
import "~/styles/globals.css";
import { trpc } from "~/utils/trpc";

LicenseInfo.setLicenseKey(process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY!);

export type NextPageWithLayout<
  TProps = Record<string, unknown>,
  TInitialProps = TProps,
> = NextPage<TProps, TInitialProps> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const App = (({
  Component,
  pageProps: { session, ...pageProps },
}: AppPropsWithLayout) => {
  const getLayout =
    Component.getLayout ?? ((page) => <LoggedInLayout>{page}</LoggedInLayout>);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <CookiesProvider>
        <SessionProvider session={session}>
          <TooltipProvider>
            {getLayout(<Component {...pageProps} />)}
          </TooltipProvider>
        </SessionProvider>
      </CookiesProvider>
    </ThemeProvider>
  );
}) as AppType;

export default trpc.withTRPC(App);
