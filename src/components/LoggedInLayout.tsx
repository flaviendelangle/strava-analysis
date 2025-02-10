import * as React from "react";
import type { ReactNode } from "react";

import { signOut } from "next-auth/react";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";

import { SharedLayout } from "./SharedLayout";

type DefaultLayoutProps = { children: ReactNode };

const NavBarContext = React.createContext<{
  isMenuExpanded: boolean;
}>({
  isMenuExpanded: false,
});

interface NavBarButtonProps
  extends Omit<
    React.HTMLAttributes<HTMLButtonElement>,
    "aria-label" | "children" | "className"
  > {
  svgPath: string;
  label: string;
}

function NavBarButton(props: NavBarButtonProps) {
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

interface NavBarLinkProps
  extends Omit<LinkProps, "aria-label" | "children" | "className" | "href"> {
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
      className="flex h-12 items-center gap-2 p-2 hover:bg-gray-600 data-[active=true]:bg-gray-700 hover:data-[active=true]:bg-gray-600"
      data-active={isActive}
      aria-label={label}
      href={href}
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
    </Link>
  );
}

function NavBar() {
  const [isMenuExpanded, setIsMenuExpanded] = React.useState(false);

  return (
    <NavBarContext value={{ isMenuExpanded }}>
      <nav
        data-expanded={isMenuExpanded}
        className="flex-0 flex h-full w-12 flex-col justify-start border-r border-gray-600 py-4 data-[expanded=true]:w-64"
      >
        <NavBarButton
          label="Strava analysis"
          svgPath="M3 18h18v-2H3zm0-5h18v-2H3zm0-7v2h18V6z"
          onClick={() => setIsMenuExpanded((prev) => !prev)}
        />
        <div className="h-12" />
        <NavBarLink
          label="Activities table"
          svgPath="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5m0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5m0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5M7 19h14v-2H7zm0-6h14v-2H7zm0-8v2h14V5z"
          href="/activities/table"
        />
        <NavBarLink
          label="Activities map"
          svgPath="m20.5 3-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5M15 19l-6-2.11V5l6 2.11z"
          href="/activities/map"
        />
        <NavBarLink
          label="Statistics"
          svgPath="M4 9h4v11H4zm12 4h4v7h-4zm-6-9h4v16h-4z"
          href="/statistics"
        />
        <NavBarButton
          label="Sign out"
          svgPath="m17 7-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4z"
          onClick={() => signOut({ callbackUrl: "/login" })}
        />
      </nav>
    </NavBarContext>
  );
}

export const LoggedInLayout = ({ children }: DefaultLayoutProps) => {
  return (
    <SharedLayout>
      <div className="flex h-screen">
        <NavBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </SharedLayout>
  );
};
