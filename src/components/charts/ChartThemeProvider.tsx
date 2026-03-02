import type { ReactNode } from "react";

import { ThemeProvider, createTheme } from "@mui/material/styles";

const darkChartTheme = createTheme({
  palette: { mode: "dark" },
});

export function ChartThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={darkChartTheme}>{children}</ThemeProvider>;
}
