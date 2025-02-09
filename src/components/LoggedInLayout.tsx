import type { ReactNode } from "react";

import { signOut } from "next-auth/react";

import { SharedLayout } from "./SharedLayout";

type DefaultLayoutProps = { children: ReactNode };

export const LoggedInLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <SharedLayout>
      <nav className="w-full py-2 px-4 flex items-baseline justify-between border-b border-gray-600">
        <h1>Strava Analysis</h1>
        <button
          className="bg-zinc-500 text-white px-2 py-1 rounded-md"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Log out
        </button>
      </nav>
      <main className="px-4">{children}</main>
    </SharedLayout>
  );
};
