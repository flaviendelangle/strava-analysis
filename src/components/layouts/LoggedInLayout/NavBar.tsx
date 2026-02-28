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
      className="flex h-12 items-center gap-2 whitespace-nowrap p-2 hover:bg-accent/80 data-[active=true]:bg-accent hover:data-[active=true]:bg-accent/80"
      data-active={isActive}
      aria-label={label}
      href={href}
      {...other}
    >
      <span className="px-1">
        <svg
          className="w-5 fill-muted-foreground"
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
        className="flex h-full w-12 shrink-0 flex-col justify-between border-r border-border py-4 data-[expanded=true]:w-64"
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
          <TooltipIfMenuCollapsed label="Activities table">
            <NavBarLink
              label="Activities table"
              svgPath="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5m0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5m0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5M7 19h14v-2H7zm0-6h14v-2H7zm0-8v2h14V5z"
              href="/activities/table"
            />
          </TooltipIfMenuCollapsed>
          <TooltipIfMenuCollapsed label="Activities map">
            <NavBarLink
              label="Activities map"
              svgPath="m20.5 3-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5M15 19l-6-2.11V5l6 2.11z"
              href="/activities/map"
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
              svgPath="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2M5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5m5.8-10 2.4-2.4.8.8c1.3 1.3 3 2.1 5 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5m0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5"
              href="/training"
            />
          </TooltipIfMenuCollapsed>
        </div>
        <div className="flex flex-col justify-start">
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
