import type { ReactNode } from "react";

import { SettingsToolbar } from "~/components/settings/SettingsToolbar";
import { ExplorerTilesProvider } from "~/hooks/useExplorerTilesToggle";
import { RiderSettingsProvider } from "~/hooks/useRiderSettings";

import { SharedLayout } from "../SharedLayout";
import { NavBar } from "./NavBar";

export const LoggedInLayout = (props: LoggedInLayoutProps) => {
  const { children } = props;

  return (
    <SharedLayout>
      <ExplorerTilesProvider>
        <RiderSettingsProvider>
          <div className="flex h-screen">
            <NavBar />
            <main className="flex flex-1 flex-col overflow-hidden">
              <SettingsToolbar />
              <div className="flex-1 overflow-y-auto">{children}</div>
            </main>
          </div>
        </RiderSettingsProvider>
      </ExplorerTilesProvider>
    </SharedLayout>
  );
};

interface LoggedInLayoutProps {
  children: ReactNode;
}
