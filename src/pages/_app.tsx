import type { ReactElement, ReactNode } from "react";

import { LicenseInfo } from "@mui/x-license";
import { CookiesProvider } from "react-cookie";
import type { NextPage } from "next";
import { SessionProvider } from "next-auth/react";
import type { AppProps, AppType } from "next/app";

LicenseInfo.setLicenseKey(process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY!);

import { LoggedInLayout } from "~/components/layouts/LoggedInLayout";
import { trpc } from "~/utils/trpc";
import "~/styles/globals.css";

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
    <CookiesProvider>
      <SessionProvider session={session}>
        {getLayout(<Component {...pageProps} />)}
      </SessionProvider>
    </CookiesProvider>
  );
}) as AppType;

export default trpc.withTRPC(App);
