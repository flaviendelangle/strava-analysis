import { Button } from "~/components/ui/button";

export function PrimaryButton(
  props: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">,
) {
  return <Button {...props} />;
}
