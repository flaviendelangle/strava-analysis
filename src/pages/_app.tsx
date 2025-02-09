import type { ReactElement, ReactNode } from "react";

import type { NextPage } from "next";
import { SessionProvider } from "next-auth/react";
import type { AppProps, AppType } from "next/app";

import { LoggedInLayout } from "~/components/LoggedInLayout";
import "~/styles/globals.css";
import { trpc } from "~/utils/trpc";

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

  return getLayout(
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>,
  );
}) as AppType;

export default trpc.withTRPC(App);
