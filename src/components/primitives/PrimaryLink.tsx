import Link, { LinkProps } from "next/link";

import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export function PrimaryLink(props: PrimaryLinkProps) {
  const { className, ...rest } = props;
  return (
    <Link
      className={cn(buttonVariants({ variant: "default" }), className)}
      {...rest}
    />
  );
}

interface PrimaryLinkProps extends Omit<LinkProps, "className"> {
  children: React.ReactNode;
  className?: string;
}
