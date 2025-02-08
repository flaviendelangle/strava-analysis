import * as React from "react";
import type { ReactNode } from "react";

import { SharedLayout } from "../SharedLayout";
import { NavBar } from "./NavBar";

export const LoggedInLayout = (props: LoggedInLayoutProps) => {
  const { children } = props;

  return (
    <SharedLayout>
      <div className="flex h-screen">
        <NavBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </SharedLayout>
  );
};

interface LoggedInLayoutProps {
  children: ReactNode;
}
