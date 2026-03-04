import { type ReactNode, useMemo } from "react";

import { ThemeProvider, createTheme } from "@mui/material/styles";

import { useTheme } from "~/hooks/useTheme";

export function ChartThemeProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: { mode: resolvedTheme === "dark" ? "dark" : "light" },
      }),
    [resolvedTheme],
  );

  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
}
