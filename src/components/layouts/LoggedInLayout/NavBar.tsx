import * as React from "react";

import { signOut } from "next-auth/react";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipProps } from "~/components/primitives/Tooltip";

import { NavBarButton } from "./NavBarButton";
import { NavBarContext } from "./NavBarContext";

interface NavBarLinkProps extends Omit<
  LinkProps,
  "aria-label" | "children" | "className" | "href"
> {
  svgPath: string;
  label: string;
  href: string;
}

function NavBarLink(props: NavBarLinkProps) {
  const { svgPath, label, href, ...other } = props;
  const { isMenuExpanded } = React.useContext(NavBarContext);
  const pathname = usePathname();
  const isActive = (pathname ?? "").startsWith(href);

  return (
    <Link
      className="hover:bg-accent/80 data-[active=true]:bg-accent hover:data-[active=true]:bg-accent/80 flex h-12 items-center gap-2 p-2 whitespace-nowrap"
      data-active={isActive}
      aria-label={label}
      href={href}
      {...other}
    >
      <span className="px-1">
        <svg
          className="fill-muted-foreground w-5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={svgPath} />
        </svg>
      </span>
      {isMenuExpanded && <span>{label}</span>}
    </Link>
  );
}

function TooltipIfMenuCollapsed(props: TooltipProps) {
  const { isMenuExpanded } = React.useContext(NavBarContext);

  if (isMenuExpanded) {
    return props.children;
  }

  return <Tooltip {...props} />;
}

export function NavBar() {
  const [isMenuExpanded, setIsMenuExpanded] = React.useState(false);

  return (
    <NavBarContext value={{ isMenuExpanded }}>
      <nav
        data-expanded={isMenuExpanded}
        className="border-border flex h-full w-12 shrink-0 flex-col justify-between border-r py-4 data-[expanded=true]:w-64"
      >
        <div className="flex flex-col justify-start">
          <TooltipIfMenuCollapsed
            label={isMenuExpanded ? "Collapse menu" : "Expand menu"}
          >
            <NavBarButton
              label="Strava analysis"
              svgPath="M3 18h18v-2H3zm0-5h18v-2H3zm0-7v2h18V6z"
              onClick={() => setIsMenuExpanded((prev) => !prev)}
            />
          </TooltipIfMenuCollapsed>
          <TooltipIfMenuCollapsed label="Activities">
            <NavBarLink
              label="Activities"
              svgPath="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5m0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5m0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5M7 19h14v-2H7zm0-6h14v-2H7zm0-8v2h14V5z"
              href="/activities"
            />
          </TooltipIfMenuCollapsed>
          <TooltipIfMenuCollapsed label="Heatmap">
            <NavBarLink
              label="Heatmap"
              svgPath="m20.5 3-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5M15 19l-6-2.11V5l6 2.11z"
              href="/heatmap"
            />
          </TooltipIfMenuCollapsed>
          <TooltipIfMenuCollapsed label="Statistics">
            <NavBarLink
              label="Statistics"
              svgPath="M4 9h4v11H4zm12 4h4v7h-4zm-6-9h4v16h-4z"
              href="/statistics"
            />
          </TooltipIfMenuCollapsed>
          <TooltipIfMenuCollapsed label="Live Training">
            <NavBarLink
              label="Live Training"
              svgPath="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m-2 14.5v-9l6 4.5z"
              href="/training-1"
            />
          </TooltipIfMenuCollapsed>
        </div>
        <div className="flex flex-col justify-start">
          <TooltipIfMenuCollapsed label="Settings">
            <NavBarLink
              label="Settings"
              svgPath="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6"
              href="/settings"
            />
          </TooltipIfMenuCollapsed>
          <TooltipIfMenuCollapsed label="Sign out">
            <NavBarButton
              label="Sign out"
              svgPath="m17 7-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4z"
              onClick={() => signOut({ callbackUrl: "/login" })}
            />
          </TooltipIfMenuCollapsed>
        </div>
      </nav>
    </NavBarContext>
  );
}
