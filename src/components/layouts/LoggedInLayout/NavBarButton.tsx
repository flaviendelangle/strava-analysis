import * as React from "react";

import { NavBarContext } from "./NavBarContext";

interface NavBarButtonProps
  extends Omit<
    React.HTMLAttributes<HTMLButtonElement>,
    "aria-label" | "children" | "className"
  > {
  svgPath: string;
  label: string;
}

export function NavBarButton(props: NavBarButtonProps) {
  const { svgPath, label, ...other } = props;
  const { isMenuExpanded } = React.useContext(NavBarContext);

  return (
    <button
      className="flex h-12 items-center gap-2 p-2 hover:bg-gray-700"
      aria-label={label}
      {...other}
    >
      <span className="px-1">
        <svg
          className="w-5 fill-gray-300"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={svgPath} />
        </svg>
      </span>
      {isMenuExpanded && <span>{label}</span>}
    </button>
  );
}
