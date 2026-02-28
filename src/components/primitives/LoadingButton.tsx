import { Loader2 } from "lucide-react";

import { Button } from "~/components/ui/button";

export function LoadingButton(props: LoadingButtonProps) {
  const { loading, children, ...other } = props;

  return (
    <Button disabled={loading} {...other}>
      {children}
      {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
    </Button>
  );
}

interface LoadingButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "disabled"
  > {
  loading: boolean;
}
