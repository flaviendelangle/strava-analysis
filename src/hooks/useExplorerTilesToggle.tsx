import * as React from "react";

interface ExplorerTilesContextValue {
  showExplorerTiles: boolean;
  setShowExplorerTiles: React.Dispatch<React.SetStateAction<boolean>>;
}

const ExplorerTilesContext = React.createContext<ExplorerTilesContextValue>({
  showExplorerTiles: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setShowExplorerTiles: () => {},
});

export function ExplorerTilesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showExplorerTiles, setShowExplorerTiles] = React.useState(false);

  const value = React.useMemo(
    () => ({ showExplorerTiles, setShowExplorerTiles }),
    [showExplorerTiles],
  );

  return <ExplorerTilesContext value={value}>{children}</ExplorerTilesContext>;
}

export function useExplorerTilesToggle() {
  return React.useContext(ExplorerTilesContext);
}
