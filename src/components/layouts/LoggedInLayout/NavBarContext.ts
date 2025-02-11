import * as React from "react";

export const NavBarContext = React.createContext<{
  isMenuExpanded: boolean;
}>({
  isMenuExpanded: false,
});
