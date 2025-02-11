export function PrimaryButton(
  props: Omit<React.HTMLAttributes<HTMLButtonElement>, "className">,
) {
  return (
    <button
      className="inline-flex rounded-md bg-purple-800 px-4 py-2 text-white hover:bg-purple-700"
      {...props}
    />
  );
}
