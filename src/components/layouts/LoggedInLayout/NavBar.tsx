import * as React from "react";

import {
  BarChart3Icon,
  BikeIcon,
  ListIcon,
  LogOutIcon,
  MapIcon,
  MenuIcon,
  MoonIcon,
  PlayCircleIcon,
  SettingsIcon,
  SunIcon,
  XIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Tooltip, TooltipProps } from "~/components/primitives/Tooltip";
import { useTheme } from "~/hooks/useTheme";
import { cn } from "~/lib/utils";

import { NavBarContext } from "./NavBarContext";

interface NavBarLinkProps {
  icon: React.ElementType;
  label: string;
  href: string;
}

function NavBarLink({ icon: Icon, label, href }: NavBarLinkProps) {
  const { isMenuExpanded } = React.useContext(NavBarContext);
  const pathname = usePathname();
  const isActive = (pathname ?? "").startsWith(href);

  return (
    <Link
      className={cn(
        "group relative mx-2 flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
      aria-label={label}
      href={href}
    >
      {isActive && (
        <span className="bg-primary absolute top-1.5 bottom-1.5 left-0 w-0.75 rounded-r-full" />
      )}
      <Icon className="size-4.5 shrink-0" />
      {isMenuExpanded && <span>{label}</span>}
    </Link>
  );
}

interface NavBarButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

function NavBarButton({ icon: Icon, label, onClick }: NavBarButtonProps) {
  const { isMenuExpanded } = React.useContext(NavBarContext);

  return (
    <button
      className="text-muted-foreground hover:bg-accent hover:text-foreground mx-2 flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm font-medium whitespace-nowrap transition-colors"
      aria-label={label}
      onClick={onClick}
    >
      <Icon className="size-4.5 shrink-0" />
      {isMenuExpanded && <span>{label}</span>}
    </button>
  );
}

function TooltipIfMenuCollapsed(props: TooltipProps) {
  const { isMenuExpanded } = React.useContext(NavBarContext);

  if (isMenuExpanded) {
    return props.children;
  }

  return <Tooltip {...props} />;
}

function ThemeToggleNavButton() {
  const { resolvedTheme, setTheme } = useTheme();
  const label = resolvedTheme === "dark" ? "Light mode" : "Dark mode";

  return (
    <TooltipIfMenuCollapsed label={label}>
      <NavBarButton
        icon={resolvedTheme === "dark" ? SunIcon : MoonIcon}
        label={label}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      />
    </TooltipIfMenuCollapsed>
  );
}

export function NavBar() {
  const [isMenuExpanded, setIsMenuExpanded] = React.useState(false);

  return (
    <NavBarContext value={{ isMenuExpanded }}>
      <nav
        data-expanded={isMenuExpanded}
        className="bg-sidebar border-sidebar-border flex h-full w-14 shrink-0 flex-col justify-between border-r py-3 data-[expanded=true]:w-52"
      >
        <div className="flex flex-col gap-0.5">
          <TooltipIfMenuCollapsed
            label={isMenuExpanded ? "Collapse menu" : "Expand menu"}
          >
            <button
              className="hover:bg-accent mx-2 mb-2 flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm font-bold whitespace-nowrap transition-colors"
              aria-label={isMenuExpanded ? "Collapse menu" : "Expand menu"}
              onClick={() => setIsMenuExpanded((prev) => !prev)}
            >
              {isMenuExpanded ? (
                <>
                  <BikeIcon className="text-primary size-4.5 shrink-0" />
                  <span className="text-foreground flex-1">Undertrained</span>
                  <XIcon className="text-muted-foreground size-4" />
                </>
              ) : (
                <MenuIcon className="text-muted-foreground size-4.5 shrink-0" />
              )}
            </button>
          </TooltipIfMenuCollapsed>

          <TooltipIfMenuCollapsed label="Activities">
            <NavBarLink icon={ListIcon} label="Activities" href="/activities" />
          </TooltipIfMenuCollapsed>
          <TooltipIfMenuCollapsed label="Heatmap">
            <NavBarLink icon={MapIcon} label="Heatmap" href="/heatmap" />
          </TooltipIfMenuCollapsed>
          <TooltipIfMenuCollapsed label="Statistics">
            <NavBarLink
              icon={BarChart3Icon}
              label="Statistics"
              href="/statistics"
            />
          </TooltipIfMenuCollapsed>
          <TooltipIfMenuCollapsed label="Live Training">
            <NavBarLink
              icon={PlayCircleIcon}
              label="Live Training"
              href="/training-1"
            />
          </TooltipIfMenuCollapsed>
        </div>

        <div className="flex flex-col gap-0.5">
          <div className="border-sidebar-border mx-3 mb-1 border-t" />
          <TooltipIfMenuCollapsed label="Settings">
            <NavBarLink icon={SettingsIcon} label="Settings" href="/settings" />
          </TooltipIfMenuCollapsed>
          <ThemeToggleNavButton />
          <TooltipIfMenuCollapsed label="Sign out">
            <NavBarButton
              icon={LogOutIcon}
              label="Sign out"
              onClick={() => signOut({ callbackUrl: "/login" })}
            />
          </TooltipIfMenuCollapsed>
        </div>
      </nav>
    </NavBarContext>
  );
}
