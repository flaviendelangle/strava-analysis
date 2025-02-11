import Link, { LinkProps } from "next/link";

export function PrimaryLink(props: PrimaryLinkProps) {
  return (
    <Link
      className="inline-flex rounded-md bg-purple-800 px-4 py-2 text-white hover:bg-purple-700"
      {...props}
    />
  );
}

interface PrimaryLinkProps extends Omit<LinkProps, "className"> {
  children: React.ReactNode;
}
