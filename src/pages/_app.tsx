import type { ReactElement, ReactNode } from "react";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { CookiesProvider } from "react-cookie";
import type { NextPage } from "next";
import { SessionProvider } from "next-auth/react";
import type { AppProps, AppType } from "next/app";

import { LoggedInLayout } from "~/components/layouts/LoggedInLayout";
import "~/styles/globals.css";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
        <ConvexProvider client={convex}>
          {getLayout(<Component {...pageProps} />)}
        </ConvexProvider>
      </SessionProvider>
    </CookiesProvider>
  );
}) as AppType;

export default App;
