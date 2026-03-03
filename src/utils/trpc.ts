import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import { signOut } from "next-auth/react";
import superjson from "superjson";

import type { AppRouter } from "@server/trpc/root";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  // SSR — use localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

function isUnauthorized(error: unknown): boolean {
  return (
    error instanceof TRPCClientError && error.data?.code === "UNAUTHORIZED"
  );
}

function handleUnauthorized() {
  if (typeof window !== "undefined") {
    signOut({ callbackUrl: "/login" });
  }
}

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              if (isUnauthorized(error)) {
                handleUnauthorized();
                return false;
              }
              return failureCount < 3;
            },
          },
          mutations: {
            onError: (error) => {
              if (isUnauthorized(error)) {
                handleUnauthorized();
              }
            },
          },
        },
      },
    };
  },
  ssr: false,
  transformer: superjson,
});
